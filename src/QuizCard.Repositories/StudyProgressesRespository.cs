using Microsoft.EntityFrameworkCore;
using QuizCard.Entities;
using QuizCard.RepositoryContracts;

namespace QuizCard.Repositories;

public class StudyProgressesRespository : IStudyProgressesRespository
{
    private readonly ApplicationDbContext _db;

    public StudyProgressesRespository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<StudyProgress> CreateStudyProgress(StudyProgress progress)
    {
        _db.StudyProgresses.Add(progress);
        await _db.SaveChangesAsync();
        return progress;
    }

    public async Task<StudyProgress?> GetStudyProgressByCardId(Guid cardId)
    {
        return await _db.StudyProgresses
            .FirstOrDefaultAsync(sp => sp.CardId == cardId);
    }

    public async Task<StudyProgress?> UpdateStudyProgress(StudyProgress progress)
    {
        _db.StudyProgresses.Update(progress);
        await _db.SaveChangesAsync();
        return progress;
    }

    public async Task<List<StudyProgress>> GetStudyProgressesByDeckId(Guid deckId)
    {
        return await _db.StudyProgresses
            .Where(sp => sp.Card != null && sp.Card.DeckId == deckId)
            .ToListAsync();
    }

    public async Task<bool> ResetProgresses(List<StudyProgress> progresses)
    {
        foreach (var p in progresses)
        {
            p.Status = StudyStatus.NotStarted;
            p.CorrectCount = 0;
            p.IncorrectCount = 0;
            p.ConsecutiveCorrect = 0;
            p.NextReviewAt = DateTime.UtcNow;
            p.LastReviewedAt = null;
        }
        await _db.SaveChangesAsync();
        return true;
    }
}

