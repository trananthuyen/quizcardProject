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
    public async Task<List<Deck>> GetCommunityDecks(string? category = null)
    {
        IQueryable<Deck> query = _db.Decks
            .Include(d => d.Cards)
                .ThenInclude(c => c.StudyProgress);

        if (!string.IsNullOrWhiteSpace(category))
        {
            var trimmedCategory = category.Trim().ToLower();
            query = query.Where(d => d.Category.ToLower() == trimmedCategory);
        }

        return await query
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
    }

    /// <summary>
    /// 2. Lấy tất cả các bộ thẻ của người dùng cụ thể ở My Resources (Kho học liệu cá nhân).
    /// </summary>
    public async Task<List<Deck>> GetUserDecks(Guid userId, string? category = null)
    {
        if (userId == Guid.Empty)
        {
            return new List<Deck>();
        }

        IQueryable<Deck> query = _db.Decks
            .Include(d => d.Cards)
                .ThenInclude(c => c.StudyProgress)
            .Where(d => d.UserId == userId);

        if (!string.IsNullOrWhiteSpace(category))
        {
            var trimmedCategory = category.Trim().ToLower();
            query = query.Where(d => d.Category.ToLower() == trimmedCategory);
        }

        return await query
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Deck>> GetAllDecks(string? category = null, Guid? userId = null)
    {
        IQueryable<Deck> query = _db.Decks
            .Include(d => d.Cards)
                .ThenInclude(c => c.StudyProgress);

        if (!string.IsNullOrWhiteSpace(category))
        {
            var trimmedCategory = category.Trim().ToLower();
            query = query.Where(d => d.Category.ToLower() == trimmedCategory);
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
                .ThenInclude(c => c.StudyProgress)
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
