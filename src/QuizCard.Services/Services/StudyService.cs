using QuizCard.Entities;
using QuizCard.RepositoryContracts;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.StudyDTOs;

namespace QuizCard.Services.Services;

/// <summary>
/// Lớp cài đặt thuật toán học tập và lặp lại ngắt quãng (StudyService) hỗ trợ quản lý tiến độ riêng biệt theo UserId.
/// Sử dụng IDecksRespository, ICardsRespository, IStudyProgressesRespository theo chuẩn Clean Architecture.
/// </summary>
public class StudyService : IStudyService
{
    private readonly IDecksRespository _decksRespository;
    private readonly ICardsRespository _cardsRespository;
    private readonly IStudyProgressesRespository _studyProgressesRespository;

    public StudyService(
        IDecksRespository decksRespository,
        ICardsRespository cardsRespository,
        IStudyProgressesRespository studyProgressesRespository)
    {
        _decksRespository = decksRespository;
        _cardsRespository = cardsRespository;
        _studyProgressesRespository = studyProgressesRespository;
    }

    private static StudyProgress? GetProgressForUser(Card card, Guid? userId)
    {
        if (card.StudyProgresses != null && card.StudyProgresses.Count > 0)
        {
            if (userId.HasValue && userId.Value != Guid.Empty)
            {
                var userSp = card.StudyProgresses.FirstOrDefault(sp => sp.UserId == userId.Value);
                if (userSp != null) return userSp;
            }
            return card.StudyProgresses.FirstOrDefault(sp => sp.UserId == null) ?? card.StudyProgresses.FirstOrDefault();
        }
        return card.StudyProgress;
    }

    /// <summary>
    /// Tính toán các số liệu thống kê học tập cho một bộ thẻ theo UserId.
    /// </summary>
    public async Task<DeckStudyStatsDto?> GetStudyStatsAsync(Guid deckId, Guid? userId = null)
    {
        var deck = await _decksRespository.GetDeckById(deckId);
        if (deck is null) return null;

        var now = DateTime.UtcNow;
        var cards = deck.Cards ?? new List<Card>();
        var total = cards.Count;

        var notStarted = cards.Count(c => {
            var p = GetProgressForUser(c, userId);
            return p == null || p.Status == StudyStatus.NotStarted;
        });

        var learning = cards.Count(c => {
            var p = GetProgressForUser(c, userId);
            return p?.Status == StudyStatus.Learning;
        });

        var mastered = cards.Count(c => {
            var p = GetProgressForUser(c, userId);
            return p?.Status == StudyStatus.Mastered;
        });

        var due = cards.Count(c => {
            var p = GetProgressForUser(c, userId);
            return p == null || 
                   p.Status != StudyStatus.Mastered ||
                   (p.NextReviewAt.HasValue && p.NextReviewAt.Value <= now);
        });

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
    /// Lấy danh sách thẻ để bắt đầu một phiên học (StudyArena) hoặc thi trắc nghiệm (QuizArena) theo UserId.
    /// </summary>
    public async Task<List<StudyCardDto>> GetSessionCardsAsync(Guid deckId, bool dueOnly = false, Guid? userId = null)
    {
        var now = DateTime.UtcNow;
        var cards = await _cardsRespository.GetAllCardsByDeckId(deckId);

        var cardListWithProgress = cards.Select(c => new
        {
            Card = c,
            Progress = GetProgressForUser(c, userId)
        });

        if (dueOnly)
        {
            cardListWithProgress = cardListWithProgress.Where(item =>
                item.Progress == null ||
                item.Progress.Status != StudyStatus.Mastered ||
                (item.Progress.NextReviewAt.HasValue && item.Progress.NextReviewAt.Value <= now)
            );
        }

        return cardListWithProgress
            .OrderBy(item => item.Progress == null ? 0 : (int)item.Progress.Status)
            .ThenBy(item => item.Progress?.NextReviewAt ?? DateTime.MinValue)
            .Select(item => new StudyCardDto(
                item.Card.Id,
                item.Card.DeckId,
                item.Card.Term,
                item.Card.Definition,
                item.Card.Example,
                item.Progress?.Status ?? StudyStatus.NotStarted,
                item.Progress?.CorrectCount ?? 0,
                item.Progress?.IncorrectCount ?? 0,
                item.Progress?.ConsecutiveCorrect ?? 0,
                item.Progress?.NextReviewAt
            ))
            .ToList();
    }

    /// <summary>
    /// Thuật toán Spaced Repetition ghi nhận kết quả trả lời của người dùng:
    /// Nâng cấp lên "Đã thuộc" nếu đúng 3 lần liên tiếp, dời lịch ôn tập, và lưu theo UserId.
    /// </summary>
    public async Task<AnswerCardResponse?> RecordAnswerAsync(Guid cardId, AnswerCardRequest request, Guid? userId = null)
    {
        var card = await _cardsRespository.GetCardById(cardId);
        if (card is null) return null;

        var targetUserId = request.UserId ?? userId;
        var progress = await _studyProgressesRespository.GetStudyProgressByCardId(cardId, targetUserId);
        bool isNewProgress = false;

        if (progress is null)
        {
            progress = new StudyProgress
            {
                Id = Guid.NewGuid(),
                CardId = card.Id,
                UserId = targetUserId,
                Status = StudyStatus.NotStarted
            };
            isNewProgress = true;
        }
        else if (progress.UserId == null && targetUserId.HasValue && targetUserId.Value != Guid.Empty)
        {
            progress.UserId = targetUserId;
        }

        var now = DateTime.UtcNow;
        progress.LastReviewedAt = now;

        bool isMastered = false;
        bool requiresRepeat = false;
        string feedback;

        if (request.IsCorrect)
        {
            progress.CorrectCount++;
            progress.ConsecutiveCorrect++;

            if (progress.ConsecutiveCorrect >= 3)
            {
                progress.Status = StudyStatus.Mastered;
                progress.NextReviewAt = now.AddDays(3 + (progress.ConsecutiveCorrect - 3) * 4);
                isMastered = true;
                requiresRepeat = false;
                feedback = "Tuyệt vời! Bạn đã thuộc thẻ này (đạt 3 lần đúng liên tiếp)!";
            }
            else
            {
                progress.Status = StudyStatus.Learning;
                progress.NextReviewAt = progress.ConsecutiveCorrect == 1 
                    ? now.AddHours(4) 
                    : now.AddDays(1);
                isMastered = false;
                requiresRepeat = false;
                feedback = $"Chính xác! Chuỗi đúng liên tiếp: {progress.ConsecutiveCorrect}/3.";
            }
        }
        else
        {
            progress.IncorrectCount++;
            progress.ConsecutiveCorrect = 0;
            progress.Status = StudyStatus.Learning;
            progress.NextReviewAt = now.AddMinutes(15);
            isMastered = false;
            requiresRepeat = true;
            feedback = "Chưa nhớ! Thẻ này sẽ được lặp lại ở cuối phiên để bạn ghi nhớ tốt hơn.";
        }

        if (isNewProgress)
        {
            await _studyProgressesRespository.CreateStudyProgress(progress);
        }
        else
        {
            await _studyProgressesRespository.UpdateStudyProgress(progress);
        }

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
    /// Đặt lại toàn bộ dữ liệu học tập của một bộ thẻ về số 0 (Reset Progress) cho UserId chỉ định.
    /// </summary>
    public async Task<bool> ResetDeckProgressAsync(Guid deckId, Guid? userId = null)
    {
        var deckExists = await _decksRespository.DeckExists(deckId);
        if (!deckExists) return false;

        var progresses = await _studyProgressesRespository.GetStudyProgressesByDeckId(deckId, userId);
        return await _studyProgressesRespository.ResetProgresses(progresses);
    }
}
