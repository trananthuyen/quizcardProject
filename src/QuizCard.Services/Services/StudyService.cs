using QuizCard.Entities;
using QuizCard.RepositoryContracts;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.StudyDTOs;

namespace QuizCard.Services.Services;

/// <summary>
/// Lớp cài đặt thuật toán học tập và lặp lại ngắt quãng (StudyService).
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

    /// <summary>
    /// Tính toán các số liệu thống kê học tập cho một bộ thẻ.
    /// </summary>
    public async Task<DeckStudyStatsDto?> GetStudyStatsAsync(Guid deckId)
    {
        var deck = await _decksRespository.GetDeckById(deckId);
        if (deck is null) return null;

        var now = DateTime.UtcNow;
        var cards = deck.Cards ?? new List<Card>();
        var total = cards.Count;
        var notStarted = cards.Count(c => c.StudyProgress == null || c.StudyProgress.Status == StudyStatus.NotStarted);
        var learning = cards.Count(c => c.StudyProgress?.Status == StudyStatus.Learning);
        var mastered = cards.Count(c => c.StudyProgress?.Status == StudyStatus.Mastered);
        
        var due = cards.Count(c => 
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
    /// </summary>
    public async Task<List<StudyCardDto>> GetSessionCardsAsync(Guid deckId, bool dueOnly = false)
    {
        var now = DateTime.UtcNow;
        var cards = await _cardsRespository.GetAllCardsByDeckId(deckId);

        if (dueOnly)
        {
            cards = cards.Where(c =>
                c.StudyProgress == null ||
                c.StudyProgress.Status != StudyStatus.Mastered ||
                (c.StudyProgress.NextReviewAt.HasValue && c.StudyProgress.NextReviewAt.Value <= now)
            ).ToList();
        }

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
    /// Thuật toán Spaced Repetition ghi nhận kết quả trả lời của người dùng:
    /// </summary>
    public async Task<AnswerCardResponse?> RecordAnswerAsync(Guid cardId, AnswerCardRequest request)
    {
        var card = await _cardsRespository.GetCardById(cardId);
        if (card is null) return null;

        var progress = card.StudyProgress;
        bool isNewProgress = false;

        if (progress is null)
        {
            progress = new StudyProgress
            {
                Id = Guid.NewGuid(),
                CardId = card.Id,
                Status = StudyStatus.NotStarted
            };
            isNewProgress = true;
            card.StudyProgress = progress;
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
    /// Đặt lại toàn bộ dữ liệu học tập của một bộ thẻ về số 0 (Reset Progress).
    /// </summary>
    public async Task<bool> ResetDeckProgressAsync(Guid deckId)
    {
        var deckExists = await _decksRespository.DeckExists(deckId);
        if (!deckExists) return false;

        var progresses = await _studyProgressesRespository.GetStudyProgressesByDeckId(deckId);
        return await _studyProgressesRespository.ResetProgresses(progresses);
    }
}
