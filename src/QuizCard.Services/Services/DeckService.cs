using QuizCard.Entities;
using QuizCard.RepositoryContracts;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.DeckDTOs;

namespace QuizCard.Services.Services;

/// <summary>
/// Lớp triển khai các thao tác CRUD và thống kê nghiệp vụ cho Bộ thẻ (DeckService).
/// Sử dụng IDecksRespository theo chuẩn Clean Architecture.
/// </summary>
public class DeckService : IDeckService
{
    private readonly IDecksRespository _decksRespository;

    public DeckService(IDecksRespository decksRespository)
    {
        _decksRespository = decksRespository;
    }

    /// <summary>
    /// Lấy toàn bộ danh sách bộ thẻ từ Repository.
    /// Kèm theo nạp danh sách thẻ con và tiến độ học để tính toán thống kê.
    /// Hỗ trợ lọc theo thể loại (Category) nếu được cung cấp.
    /// </summary>
    public async Task<IEnumerable<DeckDto>> GetAllDecksAsync(string? category = null)
    {
        var decks = await _decksRespository.GetAllDecks(category);
        return decks.Select(MapToDeckDto);
    }

    /// <summary>
    /// Tìm và trả về thông tin của 1 bộ thẻ theo Id.
    /// </summary>
    public async Task<DeckDto?> GetDeckByIdAsync(Guid id)
    {
        var deck = await _decksRespository.GetDeckById(id);
        return deck is null ? null : MapToDeckDto(deck);
    }

    /// <summary>
    /// Tạo một bộ thẻ mới với tiêu đề, mô tả và thể loại (Category).
    /// Mặc định thể loại là "Chung" nếu để trống.
    /// </summary>
    public async Task<DeckDto> CreateDeckAsync(CreateDeckRequest request)
    {
        var deck = new Deck
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Category = string.IsNullOrWhiteSpace(request.Category) ? "Chung" : request.Category.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await _decksRespository.CreateDeck(deck);
        return MapToDeckDto(deck);
    }

    /// <summary>
    /// Cập nhật tên, mô tả hoặc thể loại của bộ thẻ theo Id và ghi nhận thời điểm UpdatedAt.
    /// </summary>
    public async Task<DeckDto?> UpdateDeckAsync(Guid id, UpdateDeckRequest request)
    {
        var deck = await _decksRespository.GetDeckById(id);
        if (deck is null) return null;

        deck.Title = request.Title.Trim();
        deck.Description = request.Description?.Trim();
        deck.Category = string.IsNullOrWhiteSpace(request.Category) ? "Chung" : request.Category.Trim();
        deck.UpdatedAt = DateTime.UtcNow;

        await _decksRespository.UpdateDeck(deck);
        return MapToDeckDto(deck);
    }

    /// <summary>
    /// Xóa bộ thẻ theo Id. Cascade Delete xử lý việc dọn dẹp các thẻ con liên quan.
    /// </summary>
    public async Task<bool> DeleteDeckAsync(Guid id)
    {
        var deck = await _decksRespository.GetDeckById(id);
        if (deck is null) return false;

        return await _decksRespository.DeleteDeck(deck);
    }

    /// <summary>
    /// Hàm tiện ích: Ánh xạ thực thể Deck sang DeckDto.
    /// </summary>
    private static DeckDto MapToDeckDto(Deck deck)
    {
        var totalCards = deck.Cards?.Count ?? 0;
        var masteredCards = deck.Cards?.Count(c => c.StudyProgress?.Status == StudyStatus.Mastered) ?? 0;
        var learningCards = deck.Cards?.Count(c => c.StudyProgress?.Status == StudyStatus.Learning) ?? 0;
        var notStartedCards = totalCards - masteredCards - learningCards;

        return new DeckDto(
            deck.Id,
            deck.Title,
            deck.Description,
            deck.Category,
            deck.CreatedAt,
            totalCards,
            masteredCards,
            learningCards,
            notStartedCards
        );
    }
}
