using Microsoft.EntityFrameworkCore;
using QuizCard.Entities;
using QuizCard.RepositoryContracts;

namespace QuizCard.Repositories;

public class CardsRespository : ICardsRespository
{
    private readonly ApplicationDbContext _db;

    public CardsRespository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Card> CreateCard(Card card)
    {
        _db.Cards.Add(card);
        if (card.StudyProgress != null)
        {
            _db.StudyProgresses.Add(card.StudyProgress);
        }
        await _db.SaveChangesAsync();
        return card;
    }

    public async Task<List<Card>> CreateCardsBatch(List<Card> cards)
    {
        foreach (var card in cards)
        {
            _db.Cards.Add(card);
            if (card.StudyProgress != null)
            {
                _db.StudyProgresses.Add(card.StudyProgress);
            }
        }
        await _db.SaveChangesAsync();
        return cards;
    }

    public async Task<List<Card>> GetAllCardsByDeckId(Guid deckId)
    {
        return await _db.Cards
            .Where(c => c.DeckId == deckId)
            .Include(c => c.StudyProgresses)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<Card?> GetCardById(Guid id)
    {
        return await _db.Cards
            .Include(c => c.StudyProgresses)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<Card?> UpdateCard(Card card)
    {
        _db.Cards.Update(card);
        await _db.SaveChangesAsync();
        return card;
    }

    public async Task<bool> DeleteCard(Card card)
    {
        _db.Cards.Remove(card);
        var result = await _db.SaveChangesAsync();
        return result > 0;
    }

    public async Task<bool> DeckExists(Guid deckId)
    {
        return await _db.Decks.AnyAsync(d => d.Id == deckId);
    }
}
