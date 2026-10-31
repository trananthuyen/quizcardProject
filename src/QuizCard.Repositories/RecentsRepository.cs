using Microsoft.EntityFrameworkCore;
using QuizCard.Entities;
using QuizCard.RepositoryContracts;

namespace QuizCard.Repositories;

public class RecentsRepository : IRecentsRepository
{
    private readonly ApplicationDbContext _db;

    public RecentsRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<Recent>> GetRecentsAsync(Guid? userId, int limit = 50)
    {
        IQueryable<Recent> query = _db.Recents;

        if (userId.HasValue && userId.Value != Guid.Empty)
        {
            query = query.Where(r => r.UserId == userId.Value);
        }

        var items = await query
            .OrderByDescending(r => r.LastAccessedAt)
            .Take(limit)
            .ToListAsync();

        if (items.Count == 0) return items;

        var deckIds = items.Select(r => r.DeckId).Distinct().ToList();
        var decks = await _db.Decks
            .Include(d => d.Cards)
            .Where(d => deckIds.Contains(d.Id))
            .ToDictionaryAsync(d => d.Id);

        foreach (var r in items)
        {
            if (decks.TryGetValue(r.DeckId, out var deck))
            {
                r.Deck = deck;
            }
        }

        return items.Where(r => r.Deck != null).ToList();
    }

    public async Task<Recent> AddOrUpdateRecentAsync(Guid? userId, Guid deckId, string actionType)
    {
        // Kiểm tra xem bộ thẻ có tồn tại trong CSDL không
        var deckExists = await _db.Decks.AnyAsync(d => d.Id == deckId);
        if (!deckExists)
        {
            throw new ArgumentException($"Không tìm thấy bộ thẻ có mã {deckId}");
        }

        Recent? existing = null;
        if (userId.HasValue && userId.Value != Guid.Empty)
        {
            existing = await _db.Recents
                .FirstOrDefaultAsync(r => r.UserId == userId.Value && r.DeckId == deckId);
        }

        var now = DateTime.UtcNow;

        if (existing is not null)
        {
            existing.ActionType = string.IsNullOrWhiteSpace(actionType) ? "VIEW" : actionType.ToUpperInvariant();
            existing.LastAccessedAt = now;
            await _db.SaveChangesAsync();
            return existing;
        }

        var recent = new Recent
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            DeckId = deckId,
            ActionType = string.IsNullOrWhiteSpace(actionType) ? "VIEW" : actionType.ToUpperInvariant(),
            LastAccessedAt = now
        };

        _db.Recents.Add(recent);
        await _db.SaveChangesAsync();
        return recent;
    }

    public async Task<bool> DeleteRecentAsync(Guid recentId, Guid? userId)
    {
        IQueryable<Recent> query = _db.Recents.Where(r => r.Id == recentId);
        if (userId.HasValue && userId.Value != Guid.Empty)
        {
            query = query.Where(r => r.UserId == userId.Value);
        }

        var item = await query.FirstOrDefaultAsync();
        if (item is null) return false;

        _db.Recents.Remove(item);
        var result = await _db.SaveChangesAsync();
        return result > 0;
    }

    public async Task<bool> DeleteRecentByDeckAsync(Guid deckId, Guid? userId)
    {
        IQueryable<Recent> query = _db.Recents.Where(r => r.DeckId == deckId);
        if (userId.HasValue && userId.Value != Guid.Empty)
        {
            query = query.Where(r => r.UserId == userId.Value);
        }

        var item = await query.FirstOrDefaultAsync();
        if (item is null) return false;

        _db.Recents.Remove(item);
        var result = await _db.SaveChangesAsync();
        return result > 0;
    }

    public async Task<bool> ClearAllRecentsAsync(Guid? userId)
    {
        IQueryable<Recent> query = _db.Recents;
        if (userId.HasValue && userId.Value != Guid.Empty)
        {
            query = query.Where(r => r.UserId == userId.Value);
        }

        var list = await query.ToListAsync();
        if (list.Count == 0) return true;

        _db.Recents.RemoveRange(list);
        await _db.SaveChangesAsync();
        return true;
    }
}
