using QuizCard.Entities;
using QuizCard.RepositoryContracts;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.DeckDTOs;

namespace QuizCard.Services.Services;

/// <summary>
/// Lớp cài đặt dịch vụ quản lý Bộ thẻ (DeckService) theo chuẩn Clean Architecture.
/// </summary>
public class DeckService : IDeckService
{
    private readonly IDecksRespository _decksRespository;
    private readonly ICardsRespository _cardsRespository;
    private readonly ITrashRepository _trashRepository;

    public DeckService(IDecksRespository decksRespository, ITrashRepository trashRepository, ICardsRespository cardsRespository)
    {
        _decksRespository = decksRespository;
        _trashRepository = trashRepository;
        _cardsRespository = cardsRespository;
    }

    /// <summary>
    /// 1. Lấy tất cả các bộ thẻ hiển thị ở Community (Cộng đồng).
    /// dK: sum(card) > 0
    /// </summary>
    public async Task<IEnumerable<DeckDto>> GetCommunityDecksAsync(string? folder = null, string? tag = null)
    {
        List<Deck> temp = new List<Deck>();

        var decks = await _decksRespository.GetCommunityDecks(folder, tag);

        foreach(var ob in decks)
        {
            var cards = await _cardsRespository.GetAllCardsByDeckId(ob.Id);

            if (cards.Count > 0) temp.Add(ob);
        }

        return temp.Select(d => MapToDeckDto(d));
    }

    /// <summary>
    /// 2. Lấy tất cả các bộ thẻ của người dùng cụ thể ở My Resources (Kho học liệu cá nhân).
    /// </summary>
    public async Task<IEnumerable<DeckDto>> GetUserDecksAsync(Guid userId, string? folder = null, string? tag = null)
    {
        var decks = await _decksRespository.GetUserDecks(userId, folder, tag);
        return decks.Select(d => MapToDeckDto(d, userId));
    }

    /// <summary>
    /// Lấy toàn bộ danh sách bộ thẻ từ Repository kèm theo nạp danh sách thẻ con và tiến độ học.
    /// Hỗ trợ lọc theo Thư mục (Folder), Tag hoặc theo người sở hữu (UserId).
    /// </summary>
    public async Task<IEnumerable<DeckDto>> GetAllDecksAsync(string? folder = null, Guid? userId = null, string? tag = null)
    {
        var decks = await _decksRespository.GetAllDecks(folder, userId, tag);
        return decks.Select(d => MapToDeckDto(d, userId));
    }

    /// <summary>
    /// Lấy chi tiết một bộ thẻ theo Id.
    /// </summary>
    public async Task<DeckDto?> GetDeckByIdAsync(Guid id)
    {
        var deck = await _decksRespository.GetDeckById(id);
        if (deck is null) return null;
        return MapToDeckDto(deck, deck.UserId);
    }

    /// <summary>
    /// Tạo mới một bộ thẻ kèm gán UserId người tạo, Thư mục và Tag.
    /// </summary>
    public async Task<DeckDto> CreateDeckAsync(CreateDeckRequest request)
    {
        var deck = new Deck
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Folder = string.IsNullOrWhiteSpace(request.Folder) ? "Chung" : request.Folder.Trim(),
            Tag = request.Tag?.Trim(),
            IsPublic = request.IsPublic ?? true,
            CreatedAt = DateTime.UtcNow
        };

        await _decksRespository.CreateDeck(deck);
        return MapToDeckDto(deck, deck.UserId);
    }

    /// <summary>
    /// Cập nhật thông tin tiêu đề, mô tả, thư mục và tag của một bộ thẻ hiện có.
    /// </summary>
    public Task<DeckDto?> UpdateDeckAsync(Guid id, UpdateDeckRequest request)
    {
        return UpdateDeckAsync(id, request, null);
    }

    public async Task<DeckDto?> UpdateDeckAsync(Guid id, UpdateDeckRequest request, Guid? currentUserId)
    {
        var deck = await _decksRespository.GetDeckById(id);
        if (deck is null) return null;

        if (currentUserId.HasValue && deck.UserId.HasValue && deck.UserId.Value != currentUserId.Value)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền chỉnh sửa bộ thẻ này.");
        }

        deck.Title = request.Title.Trim();
        deck.Description = request.Description?.Trim();
        deck.Folder = string.IsNullOrWhiteSpace(request.Folder) ? "Chung" : request.Folder.Trim();
        deck.Tag = request.Tag?.Trim();
        deck.IsPublic = request.IsPublic ?? deck.IsPublic;
        deck.UpdatedAt = DateTime.UtcNow;

        await _decksRespository.UpdateDeck(deck);
        return MapToDeckDto(deck, currentUserId);
    }

    /// <summary>
    /// Chuyển bộ thẻ và toàn bộ các thẻ flashcard con vào Thùng rác (Trash).
    /// </summary>
    public async Task<bool> DeleteDeckAsync(Guid id)
    {
        var deck = await _decksRespository.GetDeckById(id);
        if (deck is null) return false;

        var deleted = await _trashRepository.MoveDeckToTrashAsync(deck);
        return deleted != null;
    }

    /// <summary>
    /// Hàm tiện ích: Ánh xạ thực thể Deck sang DeckDto (kèm UserId, Folder và Tag theo tiến độ người dùng).
    /// </summary>
    private static DeckDto MapToDeckDto(Deck deck, Guid? currentUserId = null)
    {
        var totalCards = deck.Cards?.Count ?? 0;
        var masteredCards = deck.Cards?.Count(c => GetCardStatus(c, currentUserId) == StudyStatus.Mastered) ?? 0;
        var learningCards = deck.Cards?.Count(c => GetCardStatus(c, currentUserId) == StudyStatus.Learning) ?? 0;
        var notStartedCards = totalCards - masteredCards - learningCards;

        return new DeckDto(
            deck.Id,
            deck.Title,
            deck.Description,
            deck.Folder,
            deck.CreatedAt,
            totalCards,
            masteredCards,
            learningCards,
            notStartedCards,
            deck.UserId,
            deck.Tag,
            deck.IsPublic
        );
    }

    private static StudyStatus GetCardStatus(Card card, Guid? currentUserId)
    {
        if (card.StudyProgresses != null && card.StudyProgresses.Count > 0)
        {
            if (currentUserId.HasValue && currentUserId.Value != Guid.Empty)
            {
                var userSp = card.StudyProgresses.FirstOrDefault(sp => sp.UserId == currentUserId.Value);
                if (userSp != null) return userSp.Status;
            }
            var defaultSp = card.StudyProgresses.FirstOrDefault(sp => sp.UserId == null) ?? card.StudyProgresses.FirstOrDefault();
            if (defaultSp != null) return defaultSp.Status;
        }
        return card.StudyProgress?.Status ?? StudyStatus.NotStarted;
    }
}
