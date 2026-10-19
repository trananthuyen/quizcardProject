using Microsoft.EntityFrameworkCore;
using QuizCard.Services.Data;
using QuizCard.Services.DTOs;
using QuizCard.Services.Models;

namespace QuizCard.Services.Services;

/// <summary>
/// Lớp triển khai các nghiệp vụ liên quan đến Thẻ Flashcard (CardService).
/// Chịu trách nhiệm thêm, sửa, xóa thẻ và tạo dữ liệu hàng loạt từ chuỗi văn bản.
/// </summary>
public class CardService : ICardService
{
    private readonly QuizCardDbContext _context;

    public CardService(QuizCardDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách toàn bộ thẻ thuộc về một bộ thẻ (theo deckId),
    /// kèm nạp bảng StudyProgress để hiển thị trạng thái và số lần đúng/sai.
    /// Sắp xếp theo thứ tự thời gian tạo tăng dần.
    /// </summary>
    public async Task<IEnumerable<CardDto>> GetCardsByDeckIdAsync(Guid deckId)
    {
        var cards = await _context.Cards
            .Where(c => c.DeckId == deckId)
            .Include(c => c.StudyProgress)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        return cards.Select(MapToCardDto);
    }

    /// <summary>
    /// Lấy chi tiết một thẻ Flashcard theo Id.
    /// </summary>
    public async Task<CardDto?> GetCardByIdAsync(Guid id)
    {
        var card = await _context.Cards
            .Include(c => c.StudyProgress)
            .FirstOrDefaultAsync(c => c.Id == id);

        return card is null ? null : MapToCardDto(card);
    }

    /// <summary>
    /// Tạo một thẻ Flashcard mới và tự động sinh một bản ghi tiến trình học (StudyProgress)
    /// với trạng thái ban đầu là NotStarted (Chưa học).
    /// </summary>
    public async Task<CardDto?> CreateCardAsync(Guid deckId, CreateCardRequest request)
    {
        // Kiểm tra xem bộ thẻ có tồn tại trong hệ thống không
        var deckExists = await _context.Decks.AnyAsync(d => d.Id == deckId);
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

        // Tự động tạo bản ghi tiến độ học tập ban đầu
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

        _context.Cards.Add(card);
        _context.StudyProgresses.Add(progress);
        await _context.SaveChangesAsync();

        return MapToCardDto(card);
    }

    /// <summary>
    /// Tạo hàng loạt thẻ Flashcard (Bulk Import) từ danh sách được parse từ chuỗi văn bản.
    /// Thực hiện thêm toàn bộ vào DB trong một lần SaveChangesAsync để tăng tốc độ.
    /// </summary>
    public async Task<IEnumerable<CardDto>> CreateCardsBatchAsync(Guid deckId, IEnumerable<CreateCardRequest> requests)
    {
        var deckExists = await _context.Decks.AnyAsync(d => d.Id == deckId);
        if (!deckExists) return Enumerable.Empty<CardDto>();

        var createdCards = new List<Card>();
        var now = DateTime.UtcNow;

        foreach (var req in requests)
        {
            // Bỏ qua các dòng không có thuật ngữ hoặc định nghĩa
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
            _context.Cards.Add(card);
            _context.StudyProgresses.Add(progress);
        }

        // Lưu toàn bộ danh sách thẻ vào DB
        if (createdCards.Count > 0)
        {
            await _context.SaveChangesAsync();
        }

        return createdCards.Select(MapToCardDto);
    }

    /// <summary>
    /// Cập nhật nội dung Thuật ngữ, Định nghĩa hoặc Ví dụ của một thẻ đã có.
    /// </summary>
    public async Task<CardDto?> UpdateCardAsync(Guid id, UpdateCardRequest request)
    {
        var card = await _context.Cards
            .Include(c => c.StudyProgress)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (card is null) return null;

        card.Term = request.Term.Trim();
        card.Definition = request.Definition.Trim();
        card.Example = request.Example?.Trim();
        card.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToCardDto(card);
    }

    /// <summary>
    /// Xóa một thẻ khỏi bộ thẻ.
    /// </summary>
    public async Task<bool> DeleteCardAsync(Guid id)
    {
        var card = await _context.Cards.FindAsync(id);
        if (card is null) return false;

        _context.Cards.Remove(card);
        await _context.SaveChangesAsync();
        return true;
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
