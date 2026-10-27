using Microsoft.EntityFrameworkCore;
using QuizCard.Entities;
using QuizCard.RepositoryContracts;

namespace QuizCard.Repositories;

public class TrashRepository : ITrashRepository
{
    private readonly ApplicationDbContext _db;

    public TrashRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<DeletedDeck>> GetDeletedDecksAsync(Guid? userId = null)
    {
        IQueryable<DeletedDeck> query = _db.DeletedDecks
            .Include(d => d.DeletedCards);

        if (userId.HasValue && userId.Value != Guid.Empty)
        {
            query = query.Where(d => d.UserId == userId.Value);
        }

        return await query
            .OrderByDescending(d => d.DeletedAt)
            .ToListAsync();
    }

    public async Task<DeletedDeck?> GetDeletedDeckByIdAsync(Guid id)
    {
        return await _db.DeletedDecks
            .Include(d => d.DeletedCards)
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<DeletedDeck> MoveDeckToTrashAsync(Deck deck)
    {
        // Đảm bảo Cards và StudyProgress được load đầy đủ
        if (deck.Cards == null || deck.Cards.Count == 0)
        {
            var loadedCards = await _db.Cards
                .Include(c => c.StudyProgresses)
                .Where(c => c.DeckId == deck.Id)
                .ToListAsync();
            deck.Cards = loadedCards;
        }

        var now = DateTime.UtcNow;

        var deletedDeck = new DeletedDeck
        {
            Id = deck.Id,
            UserId = deck.UserId,
            Title = deck.Title,
            Description = deck.Description,
            Folder = deck.Folder,
            Tag = deck.Tag,
            IsPublic = deck.IsPublic,
            OriginalCreatedAt = deck.CreatedAt,
            DeletedAt = now
        };

        foreach (var c in deck.Cards)
        {
            var deletedCard = new DeletedCard
            {
                Id = c.Id,
                DeletedDeckId = deletedDeck.Id,
                Term = c.Term,
                Definition = c.Definition,
                Example = c.Example,
                OriginalCreatedAt = c.CreatedAt,
                DeletedAt = now,
                StudyStatus = c.StudyProgress?.Status ?? StudyStatus.NotStarted,
                CorrectCount = c.StudyProgress?.CorrectCount ?? 0,
                IncorrectCount = c.StudyProgress?.IncorrectCount ?? 0,
                ConsecutiveCorrect = c.StudyProgress?.ConsecutiveCorrect ?? 0,
                NextReviewAt = c.StudyProgress?.NextReviewAt,
                LastReviewedAt = c.StudyProgress?.LastReviewedAt
            };
            deletedDeck.DeletedCards.Add(deletedCard);
        }

        _db.DeletedDecks.Add(deletedDeck);
        _db.Decks.Remove(deck);

        await _db.SaveChangesAsync();
        return deletedDeck;
    }

    public async Task<Deck> RestoreDeckAsync(DeletedDeck deletedDeck)
    {
        var restoredDeck = new Deck
        {
            Id = deletedDeck.Id,
            UserId = deletedDeck.UserId,
            Title = deletedDeck.Title,
            Description = deletedDeck.Description,
            Folder = deletedDeck.Folder,
            Tag = deletedDeck.Tag,
            IsPublic = deletedDeck.IsPublic,
            CreatedAt = deletedDeck.OriginalCreatedAt,
            UpdatedAt = DateTime.UtcNow,
            Cards = new List<Card>()
        };

        foreach (var dc in deletedDeck.DeletedCards)
        {
            var card = new Card
            {
                Id = dc.Id,
                DeckId = restoredDeck.Id,
                Term = dc.Term,
                Definition = dc.Definition,
                Example = dc.Example,
                CreatedAt = dc.OriginalCreatedAt,
                UpdatedAt = DateTime.UtcNow,
                StudyProgress = new StudyProgress
                {
                    Id = Guid.NewGuid(),
                    CardId = dc.Id,
                    Status = dc.StudyStatus,
                    CorrectCount = dc.CorrectCount,
                    IncorrectCount = dc.IncorrectCount,
                    ConsecutiveCorrect = dc.ConsecutiveCorrect,
                    NextReviewAt = dc.NextReviewAt,
                    LastReviewedAt = dc.LastReviewedAt
                }
            };
            restoredDeck.Cards.Add(card);
        }

        _db.Decks.Add(restoredDeck);
        _db.DeletedDecks.Remove(deletedDeck);

        await _db.SaveChangesAsync();
        return restoredDeck;
    }

    public async Task<bool> PermanentlyDeleteDeckAsync(Guid id)
    {
        var item = await _db.DeletedDecks
            .Include(d => d.DeletedCards)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (item is null) return false;

        _db.DeletedDecks.Remove(item);
        var result = await _db.SaveChangesAsync();
        return result > 0;
    }

    public async Task<bool> EmptyTrashAsync(Guid? userId = null)
    {
        IQueryable<DeletedDeck> deckQuery = _db.DeletedDecks.Include(d => d.DeletedCards);
        if (userId.HasValue && userId.Value != Guid.Empty)
        {
            deckQuery = deckQuery.Where(d => d.UserId == userId.Value);
        }

        var deletedDecks = await deckQuery.ToListAsync();
        _db.DeletedDecks.RemoveRange(deletedDecks);

        var standaloneCards = await _db.DeletedCards
            .Where(c => c.DeletedDeckId == null)
            .ToListAsync();
        _db.DeletedCards.RemoveRange(standaloneCards);

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<int> PurgeExpiredItemsAsync(int retentionDays = 5)
    {
        var cutoff = DateTime.UtcNow.AddDays(-retentionDays);

        var expiredDecks = await _db.DeletedDecks
            .Include(d => d.DeletedCards)
            .Where(d => d.DeletedAt < cutoff)
            .ToListAsync();

        var expiredStandaloneCards = await _db.DeletedCards
            .Where(c => c.DeletedDeckId == null && c.DeletedAt < cutoff)
            .ToListAsync();

        if (expiredDecks.Count == 0 && expiredStandaloneCards.Count == 0)
        {
            return 0;
        }

        _db.DeletedDecks.RemoveRange(expiredDecks);
        _db.DeletedCards.RemoveRange(expiredStandaloneCards);

        return await _db.SaveChangesAsync();
    }

    public async Task<List<DeletedCard>> GetDeletedCardsAsync(Guid? userId = null)
    {
        return await _db.DeletedCards
            .Where(c => c.DeletedDeckId == null)
            .OrderByDescending(c => c.DeletedAt)
            .ToListAsync();
    }

    public async Task<DeletedCard?> GetDeletedCardByIdAsync(Guid id)
    {
        return await _db.DeletedCards.FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<DeletedCard> MoveCardToTrashAsync(Card card)
    {
        if (card.StudyProgress == null)
        {
            card.StudyProgress = await _db.StudyProgresses.FirstOrDefaultAsync(sp => sp.CardId == card.Id);
        }

        var now = DateTime.UtcNow;

        var deletedCard = new DeletedCard
        {
            Id = card.Id,
            ActiveDeckId = card.DeckId,
            DeletedDeckId = null,
            Term = card.Term,
            Definition = card.Definition,
            Example = card.Example,
            OriginalCreatedAt = card.CreatedAt,
            DeletedAt = now,
            StudyStatus = card.StudyProgress?.Status ?? StudyStatus.NotStarted,
            CorrectCount = card.StudyProgress?.CorrectCount ?? 0,
            IncorrectCount = card.StudyProgress?.IncorrectCount ?? 0,
            ConsecutiveCorrect = card.StudyProgress?.ConsecutiveCorrect ?? 0,
            NextReviewAt = card.StudyProgress?.NextReviewAt,
            LastReviewedAt = card.StudyProgress?.LastReviewedAt
        };

        _db.DeletedCards.Add(deletedCard);
        _db.Cards.Remove(card);

        await _db.SaveChangesAsync();
        return deletedCard;
    }

    public async Task<Card?> RestoreCardAsync(DeletedCard deletedCard)
    {
        if (!deletedCard.ActiveDeckId.HasValue)
        {
            return null;
        }

        var deckExists = await _db.Decks.AnyAsync(d => d.Id == deletedCard.ActiveDeckId.Value);
        if (!deckExists)
        {
            return null; // Không thể khôi phục thẻ nếu bộ thẻ gốc không còn tồn tại
        }

        var card = new Card
        {
            Id = deletedCard.Id,
            DeckId = deletedCard.ActiveDeckId.Value,
            Term = deletedCard.Term,
            Definition = deletedCard.Definition,
            Example = deletedCard.Example,
            CreatedAt = deletedCard.OriginalCreatedAt,
            UpdatedAt = DateTime.UtcNow,
            StudyProgress = new StudyProgress
            {
                Id = Guid.NewGuid(),
                CardId = deletedCard.Id,
                Status = deletedCard.StudyStatus,
                CorrectCount = deletedCard.CorrectCount,
                IncorrectCount = deletedCard.IncorrectCount,
                ConsecutiveCorrect = deletedCard.ConsecutiveCorrect,
                NextReviewAt = deletedCard.NextReviewAt,
                LastReviewedAt = deletedCard.LastReviewedAt
            }
        };

        _db.Cards.Add(card);
        _db.DeletedCards.Remove(deletedCard);

        await _db.SaveChangesAsync();
        return card;
    }

    public async Task<bool> PermanentlyDeleteCardAsync(Guid id)
    {
        var card = await _db.DeletedCards.FirstOrDefaultAsync(c => c.Id == id);
        if (card is null) return false;

        _db.DeletedCards.Remove(card);
        var result = await _db.SaveChangesAsync();
        return result > 0;
    }
}

