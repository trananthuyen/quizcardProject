using Microsoft.EntityFrameworkCore;
using QuizCard.Services.Data;
using QuizCard.Services.DTOs;
using QuizCard.Services.Models;

namespace QuizCard.Services.Services;

/// <summary>
/// Lớp cài đặt thuật toán học tập và lặp lại ngắt quãng (StudyService).
/// Chịu trách nhiệm:
/// 1. Lọc danh sách thẻ đến hạn ôn tập (Spaced Repetition).
/// 2. Xử lý logic khi người dùng trả lời (Đúng hoặc Sai):
///    - Đúng 3 lần liên tiếp: Chuyển sang "Đã thuộc" (Mastered) và giãn cách thời gian ôn tập.
///    - Sai: Reset chuỗi đúng về 0, chuyển sang "Đang học" (Learning) và đánh dấu lặp lại ở cuối phiên.
/// </summary>
public class StudyService : IStudyService
{
    private readonly QuizCardDbContext _context;

    public StudyService(QuizCardDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Tính toán các số liệu thống kê học tập cho một bộ thẻ:
    /// - total: Tổng số thẻ.
    /// - due: Số thẻ cần ôn (thẻ chưa thuộc hoặc thẻ đã thuộc nhưng đã tới thời điểm NextReviewAt).
    /// - notStarted: Thẻ chưa từng học.
    /// - learning: Thẻ đang học.
    /// - mastered: Thẻ đã thuộc bài.
    /// </summary>
    public async Task<DeckStudyStatsDto?> GetStudyStatsAsync(Guid deckId)
    {
        var deck = await _context.Decks
            .Include(d => d.Cards)
                .ThenInclude(c => c.StudyProgress)
            .FirstOrDefaultAsync(d => d.Id == deckId);

        if (deck is null) return null;

        var now = DateTime.UtcNow;
        var total = deck.Cards.Count;
        var notStarted = deck.Cards.Count(c => c.StudyProgress == null || c.StudyProgress.Status == StudyStatus.NotStarted);
        var learning = deck.Cards.Count(c => c.StudyProgress?.Status == StudyStatus.Learning);
        var mastered = deck.Cards.Count(c => c.StudyProgress?.Status == StudyStatus.Mastered);
        
        // Thẻ cần ôn: thẻ chưa thuộc bài HOẶC thẻ đã đến/quá thời điểm NextReviewAt
        var due = deck.Cards.Count(c => 
            c.StudyProgress == null || 
            c.StudyProgress.Status != StudyStatus.Mastered ||
            (c.StudyProgress.NextReviewAt.HasValue && c.StudyProgress.NextReviewAt.Value <= now)
        );

        return new DeckStudyStatsDto(
            deck.Id,
            deck.Title,
            total,
            due,
            notStarted,
            learning,
            mastered
        );
    }

    /// <summary>
    /// Lấy danh sách thẻ để bắt đầu một phiên học (StudyArena) hoặc thi trắc nghiệm (QuizArena).
    /// Các thẻ chưa học (NotStarted) và đang học (Learning) được ưu tiên xếp lên đầu.
    /// </summary>
    /// <param name="deckId">Mã bộ thẻ cần học.</param>
    /// <param name="dueOnly">Nếu true thì chỉ lấy thẻ đến hạn ôn tập; nếu false thì lấy toàn bộ thẻ trong bộ.</param>
    public async Task<List<StudyCardDto>> GetSessionCardsAsync(Guid deckId, bool dueOnly = false)
    {
        var now = DateTime.UtcNow;

        var query = _context.Cards
            .Where(c => c.DeckId == deckId)
            .Include(c => c.StudyProgress)
            .AsQueryable();

        // Nếu người dùng chọn chế độ chỉ ôn thẻ đến hạn
        if (dueOnly)
        {
            query = query.Where(c =>
                c.StudyProgress == null ||
                c.StudyProgress.Status != StudyStatus.Mastered ||
                (c.StudyProgress.NextReviewAt.HasValue && c.StudyProgress.NextReviewAt.Value <= now)
            );
        }

        var cards = await query.ToListAsync();

        // Sắp xếp ưu tiên: Thẻ chưa học (0) -> Thẻ đang học (1) -> Thẻ đã thuộc (2),
        // và sau đó theo thời điểm NextReviewAt tăng dần.
        return cards
            .OrderBy(c => c.StudyProgress == null ? 0 : (int)c.StudyProgress.Status)
            .ThenBy(c => c.StudyProgress?.NextReviewAt ?? DateTime.MinValue)
            .Select(c => new StudyCardDto(
                c.Id,
                c.DeckId,
                c.Term,
                c.Definition,
                c.Example,
                c.StudyProgress?.Status ?? StudyStatus.NotStarted,
                c.StudyProgress?.CorrectCount ?? 0,
                c.StudyProgress?.IncorrectCount ?? 0,
                c.StudyProgress?.ConsecutiveCorrect ?? 0,
                c.StudyProgress?.NextReviewAt
            ))
            .ToList();
    }

    /// <summary>
    /// Cốt lõi của thuật toán Spaced Repetition:
    /// Ghi nhận kết quả trả lời của người dùng và cập nhật lại chu kỳ ôn tập của thẻ:
    /// 1. Nếu trả lời Đúng (IsCorrect = true):
    ///    - Tăng CorrectCount và ConsecutiveCorrect (chuỗi đúng liên tiếp).
    ///    - Nếu ConsecutiveCorrect >= 3:
    ///      -> Đổi trạng thái sang Mastered (Đã thuộc).
    ///      -> Giãn cách ngày ôn tập: +3 ngày (lần đầu thuộc) và cộng thêm 4 ngày cho mỗi lần đúng tiếp theo.
    ///    - Nếu ConsecutiveCorrect < 3:
    ///      -> Trạng thái Learning (Đang học).
    ///      -> Đúng lần 1: Ôn lại sau 4 tiếng; Đúng lần 2: Ôn lại sau 1 ngày.
    /// 2. Nếu trả lời Sai (IsCorrect = false):
    ///    - Tăng IncorrectCount, reset ConsecutiveCorrect = 0.
    ///    - Chuyển trạng thái sang Learning (Đang học).
    ///    - Đánh dấu RequiresRepeatInSession = true để đẩy thẻ về cuối phiên học lặp lại ngay.
    ///    - Đặt NextReviewAt = sau 15 phút.
    /// </summary>
    public async Task<AnswerCardResponse?> RecordAnswerAsync(Guid cardId, AnswerCardRequest request)
    {
        var card = await _context.Cards
            .Include(c => c.StudyProgress)
            .FirstOrDefaultAsync(c => c.Id == cardId);

        if (card is null) return null;

        // Nếu thẻ chưa có bản ghi tiến trình học thì khởi tạo mới
        var progress = card.StudyProgress;
        if (progress is null)
        {
            progress = new StudyProgress
            {
                Id = Guid.NewGuid(),
                CardId = card.Id,
                Status = StudyStatus.NotStarted
            };
            _context.StudyProgresses.Add(progress);
            card.StudyProgress = progress;
        }

        var now = DateTime.UtcNow;
        progress.LastReviewedAt = now;

        bool isMastered = false;
        bool requiresRepeat = false;
        string feedback;

        // TRƯỜNG HỢP 1: Người dùng trả lời ĐÚNG
        if (request.IsCorrect)
        {
            progress.CorrectCount++;
            progress.ConsecutiveCorrect++;

            // Khi đạt chuỗi đúng 3 lần liên tiếp -> Công nhận đã thuộc bài (Mastered)
            if (progress.ConsecutiveCorrect >= 3)
            {
                progress.Status = StudyStatus.Mastered;
                // Giãn cách thời gian ôn tập dài hạn (từ 3 ngày trở lên)
                progress.NextReviewAt = now.AddDays(3 + (progress.ConsecutiveCorrect - 3) * 4);
                isMastered = true;
                requiresRepeat = false;
                feedback = "Tuyệt vời! Bạn đã thuộc thẻ này (đạt 3 lần đúng liên tiếp)!";
            }
            else
            {
                // Chưa đủ 3 lần đúng liên tiếp -> Vẫn đang trong giai đoạn rèn luyện (Learning)
                progress.Status = StudyStatus.Learning;
                progress.NextReviewAt = progress.ConsecutiveCorrect == 1 
                    ? now.AddHours(4) 
                    : now.AddDays(1);
                isMastered = false;
                requiresRepeat = false;
                feedback = $"Chính xác! Chuỗi đúng liên tiếp: {progress.ConsecutiveCorrect}/3.";
            }
        }
        // TRƯỜNG HỢP 2: Người dùng trả lời SAI / CHƯA NHỚ
        else
        {
            progress.IncorrectCount++;
            progress.ConsecutiveCorrect = 0; // Reset chuỗi đúng về 0
            progress.Status = StudyStatus.Learning;
            progress.NextReviewAt = now.AddMinutes(15);
            isMastered = false;
            requiresRepeat = true; // Yêu cầu lặp lại thẻ này ở cuối phiên học
            feedback = "Chưa nhớ! Thẻ này sẽ được lặp lại ở cuối phiên để bạn ghi nhớ tốt hơn.";
        }

        await _context.SaveChangesAsync();

        return new AnswerCardResponse(
            card.Id,
            progress.Status,
            progress.CorrectCount,
            progress.IncorrectCount,
            progress.ConsecutiveCorrect,
            progress.NextReviewAt,
            isMastered,
            requiresRepeat,
            feedback
        );
    }

    /// <summary>
    /// Đặt lại toàn bộ dữ liệu học tập của một bộ thẻ về số 0 (Reset Progress),
    /// cho phép người dùng học lại từ đầu như một bộ thẻ mới.
    /// </summary>
    public async Task<bool> ResetDeckProgressAsync(Guid deckId)
    {
        var deckExists = await _context.Decks.AnyAsync(d => d.Id == deckId);
        if (!deckExists) return false;

        var progresses = await _context.StudyProgresses
            .Where(sp => sp.Card != null && sp.Card.DeckId == deckId)
            .ToListAsync();

        foreach (var p in progresses)
        {
            p.Status = StudyStatus.NotStarted;
            p.CorrectCount = 0;
            p.IncorrectCount = 0;
            p.ConsecutiveCorrect = 0;
            p.NextReviewAt = DateTime.UtcNow;
            p.LastReviewedAt = null;
        }

        await _context.SaveChangesAsync();
        return true;
    }
}
