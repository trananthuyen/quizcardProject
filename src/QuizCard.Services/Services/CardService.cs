using QuizCard.Entities;
using QuizCard.RepositoryContracts;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.CardDTOs;

namespace QuizCard.Services;

/// <summary>
/// Lớp triển khai các nghiệp vụ liên quan đến Thẻ Flashcard (CardService).
/// Chịu trách nhiệm thêm, sửa, xóa thẻ và tạo dữ liệu hàng loạt từ chuỗi văn bản.
/// </summary>
public class CardService : ICardService
{
    private readonly ICardsRespository _cardsRespository;

    public CardService(ICardsRespository cardsRespository)
    {
        _cardsRespository = cardsRespository;
    }

    /// <summary>
    /// Lấy danh sách toàn bộ thẻ thuộc về một bộ thẻ (theo deckId),
    /// kèm nạp bảng StudyProgress để hiển thị trạng thái và số lần đúng/sai.
    /// Sắp xếp theo thứ tự thời gian tạo tăng dần.
    /// </summary>
    public async Task<IEnumerable<CardDto>> GetCardsByDeckIdAsync(Guid deckId)
    {
        var cards = await _cardsRespository.GetAllCardsByDeckId(deckId);
        return cards.Select(MapToCardDto);
    }

    /// <summary>
    /// Lấy chi tiết một thẻ Flashcard theo Id.
    /// </summary>
    public async Task<CardDto?> GetCardByIdAsync(Guid id)
    {
        var card = await _cardsRespository.GetCardById(id);
        return card is null ? null : MapToCardDto(card);
    }

    /// <summary>
    /// Tạo một thẻ Flashcard mới và tự động sinh một bản ghi tiến trình học (StudyProgress)
    /// với trạng thái ban đầu là NotStarted (Chưa học).
    /// </summary>
    public async Task<CardDto?> CreateCardAsync(Guid deckId, CreateCardRequest request)
    {
        var deckExists = await _cardsRespository.DeckExists(deckId);
        if (!deckExists) return null;

        var card = new Card
        {
            Id = Guid.NewGuid(),
            DeckId = deckId,
            Term = request.Term.Trim(),
            Definition = request.Definition.Trim(),
            Example = request.Example?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        var progress = new StudyProgress
        {
            Id = Guid.NewGuid(),
            CardId = card.Id,
            Status = StudyStatus.NotStarted,
            CorrectCount = 0,
            IncorrectCount = 0,
            ConsecutiveCorrect = 0,
            NextReviewAt = DateTime.UtcNow
        };

        card.StudyProgress = progress;

        await _cardsRespository.CreateCard(card);

        return MapToCardDto(card);
    }

    /// <summary>
    /// Tạo hàng loạt thẻ Flashcard (Bulk Import) từ danh sách được parse từ chuỗi văn bản.
    /// Thực hiện thêm toàn bộ vào DB trong một lần SaveChangesAsync để tăng tốc độ.
    /// </summary>
    public async Task<IEnumerable<CardDto>> CreateCardsBatchAsync(Guid deckId, IEnumerable<CreateCardRequest> requests)
    {
        if (requests == null)
        {
            throw new ArgumentNullException(nameof(requests));
        }

        var deckExists = await _cardsRespository.DeckExists(deckId);
        if (!deckExists) return Enumerable.Empty<CardDto>();

        var createdCards = new List<Card>();
        var now = DateTime.UtcNow;

        foreach (var req in requests)
        {
            if (string.IsNullOrWhiteSpace(req.Term) || string.IsNullOrWhiteSpace(req.Definition))
                continue;

            var card = new Card
            {
                Id = Guid.NewGuid(),
                DeckId = deckId,
                Term = req.Term.Trim(),
                Definition = req.Definition.Trim(),
                Example = req.Example?.Trim(),
                CreatedAt = now
            };

            var progress = new StudyProgress
            {
                Id = Guid.NewGuid(),
                CardId = card.Id,
                Status = StudyStatus.NotStarted,
                CorrectCount = 0,
                IncorrectCount = 0,
                ConsecutiveCorrect = 0,
                NextReviewAt = now
            };

            card.StudyProgress = progress;
            createdCards.Add(card);
        }

        if (createdCards.Count > 0)
        {
            await _cardsRespository.CreateCardsBatch(createdCards);
        }

        return createdCards.Select(MapToCardDto);
    }

    /// <summary>
    /// Cập nhật nội dung Thuật ngữ, Định nghĩa hoặc Ví dụ của một thẻ đã có.
    /// </summary>
    public async Task<CardDto?> UpdateCardAsync(Guid id, UpdateCardRequest request)
    {
        var card = await _cardsRespository.GetCardById(id);
        if (card is null) return null;

        card.Term = request.Term.Trim();
        card.Definition = request.Definition.Trim();
        card.Example = request.Example?.Trim();
        card.UpdatedAt = DateTime.UtcNow;

        await _cardsRespository.UpdateCard(card);
        return MapToCardDto(card);
    }

    /// <summary>
    /// Xóa một thẻ khỏi bộ thẻ.
    /// </summary>
    public async Task<bool> DeleteCardAsync(Guid id)
    {
        var card = await _cardsRespository.GetCardById(id);
        if (card is null) return false;

        return await _cardsRespository.DeleteCard(card);
    }

    /// <summary>
    /// Hàm tiện ích riêng: Chuyển đổi thực thể Card kèm StudyProgress sang CardDto.
    /// </summary>
    private static CardDto MapToCardDto(Card card)
    {
        StudyProgressDto? progressDto = null;
        if (card.StudyProgress != null)
        {
            progressDto = new StudyProgressDto(
                card.StudyProgress.Status,
                card.StudyProgress.CorrectCount,
                card.StudyProgress.IncorrectCount,
                card.StudyProgress.ConsecutiveCorrect,
                card.StudyProgress.NextReviewAt,
                card.StudyProgress.LastReviewedAt
            );
        }

        return new CardDto(
            card.Id,
            card.DeckId,
            card.Term,
            card.Definition,
            card.Example,
            card.CreatedAt,
            progressDto
        );
    }
}
