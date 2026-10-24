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

    public async Task<List<Deck>> GetAllDecks(string? category = null)
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

