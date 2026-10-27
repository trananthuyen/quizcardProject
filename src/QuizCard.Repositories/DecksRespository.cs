using Microsoft.EntityFrameworkCore;
using QuizCard.Entities;
using QuizCard.RepositoryContracts;

namespace QuizCard.Repositories;

public class DecksRespository : IDecksRespository
{
    private readonly ApplicationDbContext _db;

    public DecksRespository(ApplicationDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// 1. Lấy tất cả các bộ thẻ hiển thị ở Community (Cộng đồng).
    /// </summary>
    public async Task<List<Deck>> GetCommunityDecks(string? folder = null, string? tag = null)
    {
        IQueryable<Deck> query = _db.Decks
            .Include(d => d.Cards)
                .ThenInclude(c => c.StudyProgresses)
            .Where(d => d.IsPublic || d.UserId == null);

        if (!string.IsNullOrWhiteSpace(folder))
        {
            var trimmedFolder = folder.Trim().ToLower();
            query = query.Where(d => d.Folder.ToLower() == trimmedFolder);
        }

        if (!string.IsNullOrWhiteSpace(tag))
        {
            var trimmedTag = tag.Trim().ToLower();
            query = query.Where(d => d.Tag != null && d.Tag.ToLower().Contains(trimmedTag));
        }

        return await query
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
    }

    /// <summary>
    /// 2. Lấy tất cả các bộ thẻ của người dùng cụ thể ở My Resources (Kho học liệu cá nhân).
    /// </summary>
    public async Task<List<Deck>> GetUserDecks(Guid userId, string? folder = null, string? tag = null)
    {
        if (userId == Guid.Empty)
        {
            return new List<Deck>();
        }

        IQueryable<Deck> query = _db.Decks
            .Include(d => d.Cards)
                .ThenInclude(c => c.StudyProgresses)
            .Where(d => d.UserId == userId);

        if (!string.IsNullOrWhiteSpace(folder))
        {
            var trimmedFolder = folder.Trim().ToLower();
            query = query.Where(d => d.Folder.ToLower() == trimmedFolder);
        }

        if (!string.IsNullOrWhiteSpace(tag))
        {
            var trimmedTag = tag.Trim().ToLower();
            query = query.Where(d => d.Tag != null && d.Tag.ToLower().Contains(trimmedTag));
        }

        return await query
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Deck>> GetAllDecks(string? folder = null, Guid? userId = null, string? tag = null)
    {
        IQueryable<Deck> query = _db.Decks
            .Include(d => d.Cards)
                .ThenInclude(c => c.StudyProgresses);

        if (!string.IsNullOrWhiteSpace(folder))
        {
            var trimmedFolder = folder.Trim().ToLower();
            query = query.Where(d => d.Folder.ToLower() == trimmedFolder);
        }

        if (!string.IsNullOrWhiteSpace(tag))
        {
            var trimmedTag = tag.Trim().ToLower();
            query = query.Where(d => d.Tag != null && d.Tag.ToLower().Contains(trimmedTag));
        }

        if (userId.HasValue && userId.Value != Guid.Empty)
        {
            query = query.Where(d => d.UserId == userId.Value);
        }

        return await query
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
    }

    public async Task<Deck?> GetDeckById(Guid id)
    {
        return await _db.Decks
            .Include(d => d.Cards)
                .ThenInclude(c => c.StudyProgresses)
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<Deck> CreateDeck(Deck deck)
    {
        _db.Decks.Add(deck);
        await _db.SaveChangesAsync();
        return deck;
    }

    public async Task<Deck?> UpdateDeck(Deck deck)
    {
        _db.Decks.Update(deck);
        await _db.SaveChangesAsync();
        return deck;
    }

    public async Task<bool> DeleteDeck(Deck deck)
    {
        _db.Decks.Remove(deck);
        var result = await _db.SaveChangesAsync();
        return result > 0;
    }

    public async Task<bool> DeckExists(Guid id)
    {
        return await _db.Decks.AnyAsync(d => d.Id == id);
    }
}
