using QuizCard.Entities;
using QuizCard.RepositoryContracts;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.TrashDTOs;

namespace QuizCard.Services.Services;

public class TrashService : ITrashService
{
    private readonly ITrashRepository _trashRepository;
    private readonly IDecksRespository _decksRepository;
    private readonly ICardsRespository _cardsRepository;

    private const int RETENTION_DAYS = 5;

    public TrashService(
        ITrashRepository trashRepository,
        IDecksRespository decksRepository,
        ICardsRespository cardsRepository)
    {
        _trashRepository = trashRepository;
        _decksRepository = decksRepository;
        _cardsRepository = cardsRepository;
    }

    public async Task<List<DeletedDeckDto>> GetTrashDecksAsync(Guid? userId = null)
    {
        // 1. Tự động xóa vĩnh viễn các mục đã nằm trong thùng rác quá 5 ngày
        await _trashRepository.PurgeExpiredItemsAsync(RETENTION_DAYS);

        // 2. Lấy danh sách các bộ thẻ còn hiệu lực trong thùng rác
        var deletedDecks = await _trashRepository.GetDeletedDecksAsync(userId);
        return deletedDecks.Select(d => MapToDeletedDeckDto(d, false)).ToList();
    }

    public async Task<DeletedDeckDto?> GetTrashDeckByIdAsync(Guid id)
    {
        await _trashRepository.PurgeExpiredItemsAsync(RETENTION_DAYS);

        var deletedDeck = await _trashRepository.GetDeletedDeckByIdAsync(id);
        if (deletedDeck is null) return null;

        return MapToDeletedDeckDto(deletedDeck, includeCards: true);
    }

    public async Task<DeletedDeckDto?> MoveDeckToTrashAsync(Guid deckId)
    {
        var deck = await _decksRepository.GetDeckById(deckId);
        if (deck is null) return null;

        var deletedDeck = await _trashRepository.MoveDeckToTrashAsync(deck);
        return MapToDeletedDeckDto(deletedDeck, includeCards: true);
    }

    public async Task<bool> RestoreDeckAsync(Guid deckId)
    {
        var deletedDeck = await _trashRepository.GetDeletedDeckByIdAsync(deckId);
        if (deletedDeck is null) return false;

        await _trashRepository.RestoreDeckAsync(deletedDeck);
        return true;
    }

    public async Task<bool> PermanentlyDeleteDeckAsync(Guid deckId)
    {
        return await _trashRepository.PermanentlyDeleteDeckAsync(deckId);
    }

    public async Task<bool> EmptyTrashAsync(Guid? userId = null)
    {
        return await _trashRepository.EmptyTrashAsync(userId);
    }

    public async Task<int> PurgeExpiredTrashAsync()
    {
        return await _trashRepository.PurgeExpiredItemsAsync(RETENTION_DAYS);
    }

    public async Task<List<DeletedCardDto>> GetTrashCardsAsync(Guid? userId = null)
    {
        await _trashRepository.PurgeExpiredItemsAsync(RETENTION_DAYS);
        var cards = await _trashRepository.GetDeletedCardsAsync(userId);
        return cards.Select(MapToDeletedCardDto).ToList();
    }

    public async Task<DeletedCardDto?> MoveCardToTrashAsync(Guid cardId)
    {
        var card = await _cardsRepository.GetCardById(cardId);
        if (card is null) return null;

        var deletedCard = await _trashRepository.MoveCardToTrashAsync(card);
        return MapToDeletedCardDto(deletedCard);
    }

    public async Task<bool> RestoreCardAsync(Guid cardId)
    {
        var deletedCard = await _trashRepository.GetDeletedCardByIdAsync(cardId);
        if (deletedCard is null) return false;

        var restored = await _trashRepository.RestoreCardAsync(deletedCard);
        return restored is not null;
    }

    public async Task<bool> PermanentlyDeleteCardAsync(Guid cardId)
    {
        return await _trashRepository.PermanentlyDeleteCardAsync(cardId);
    }

    private static DeletedDeckDto MapToDeletedDeckDto(DeletedDeck d, bool includeCards = false)
    {
        var expireTime = d.DeletedAt.AddDays(RETENTION_DAYS);
        var remaining = expireTime - DateTime.UtcNow;
        var daysRemaining = Math.Max(0, (int)remaining.TotalDays);
        var hoursRemaining = Math.Max(0, remaining.Hours);

        var cards = includeCards && d.DeletedCards != null
            ? d.DeletedCards.Select(MapToDeletedCardDto).ToList()
            : null;

        return new DeletedDeckDto(
            d.Id,
            d.UserId,
            d.Title,
            d.Description,
            d.Folder,
            d.Tag,
            d.IsPublic,
            d.OriginalCreatedAt,
            d.DeletedAt,
            d.DeletedCards?.Count ?? 0,
            daysRemaining,
            hoursRemaining,
            cards
        );
    }

    private static DeletedCardDto MapToDeletedCardDto(DeletedCard c)
    {
        var expireTime = c.DeletedAt.AddDays(RETENTION_DAYS);
        var remaining = expireTime - DateTime.UtcNow;
        var daysRemaining = Math.Max(0, (int)remaining.TotalDays);

        return new DeletedCardDto(
            c.Id,
            c.DeletedDeckId,
            c.ActiveDeckId,
            c.Term,
            c.Definition,
            c.Example,
            c.OriginalCreatedAt,
            c.DeletedAt,
            daysRemaining
        );
    }
}
