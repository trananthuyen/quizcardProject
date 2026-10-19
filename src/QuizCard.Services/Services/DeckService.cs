using Microsoft.EntityFrameworkCore;
using QuizCard.Services.Data;
using QuizCard.Services.DTOs;
using QuizCard.Services.Models;

namespace QuizCard.Services.Services;

/// <summary>
/// Lớp triển khai các thao tác CRUD và thống kê nghiệp vụ cho Bộ thẻ (DeckService).
/// Sử dụng Entity Framework Core để truy vấn và cập nhật dữ liệu vào SQLite.
/// </summary>
public class DeckService : IDeckService
{
    // Ngữ cảnh cơ sở dữ liệu được Inject tự động thông qua cơ chế Dependency Injection (DI)
    private readonly QuizCardDbContext _context;

    public DeckService(QuizCardDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy toàn bộ danh sách bộ thẻ từ DB.
    /// Kèm theo nạp (Eager Loading) danh sách thẻ con và tiến độ học để tính toán thống kê.
    /// Hỗ trợ lọc theo thể loại (Category) nếu được cung cấp.
    /// Sắp xếp theo thứ tự bộ thẻ mới tạo nhất lên đầu.
    /// </summary>
    public async Task<IEnumerable<DeckDto>> GetAllDecksAsync(string? category = null)
    {
        IQueryable<Deck> query = _context.Decks
            .Include(d => d.Cards)
                .ThenInclude(c => c.StudyProgress);

        if (!string.IsNullOrWhiteSpace(category))
        {
            var trimmedCategory = category.Trim().ToLower();
            query = query.Where(d => d.Category.ToLower() == trimmedCategory);
        }

        var decks = await query
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();

        return decks.Select(MapToDeckDto);
    }

    /// <summary>
    /// Tìm và trả về thông tin của 1 bộ thẻ theo Id.
    /// </summary>
    public async Task<DeckDto?> GetDeckByIdAsync(Guid id)
    {
        var deck = await _context.Decks
            .Include(d => d.Cards)
                .ThenInclude(c => c.StudyProgress)
            .FirstOrDefaultAsync(d => d.Id == id);

        return deck is null ? null : MapToDeckDto(deck);
    }

    /// <summary>
    /// Tạo một bộ thẻ mới với tiêu đề, mô tả và thể loại (Category).
    /// Mặc định thể loại là "Chung" nếu để trống.
    /// Lưu vào SQLite và trả về DTO tương ứng.
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

        _context.Decks.Add(deck);
        await _context.SaveChangesAsync();

        return MapToDeckDto(deck);
    }

    /// <summary>
    /// Cập nhật tên, mô tả hoặc thể loại của bộ thẻ theo Id và ghi nhận thời điểm UpdatedAt.
    /// </summary>
    public async Task<DeckDto?> UpdateDeckAsync(Guid id, UpdateDeckRequest request)
    {
        var deck = await _context.Decks
            .Include(d => d.Cards)
                .ThenInclude(c => c.StudyProgress)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (deck is null) return null;

        deck.Title = request.Title.Trim();
        deck.Description = request.Description?.Trim();
        deck.Category = string.IsNullOrWhiteSpace(request.Category) ? "Chung" : request.Category.Trim();
        deck.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToDeckDto(deck);
    }

    /// <summary>
    /// Xóa bộ thẻ theo Id. Nhờ cấu hình Cascade Delete trong DbContext,
    /// các thẻ con và tiến độ học sẽ tự động được dọn dẹp sạch sẽ.
    /// </summary>
    public async Task<bool> DeleteDeckAsync(Guid id)
    {
        var deck = await _context.Decks.FindAsync(id);
        if (deck is null) return false;

        _context.Decks.Remove(deck);
        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Hàm tiện ích riêng (Private Helper): Ánh xạ thực thể Deck sang DeckDto
    /// và đếm chính xác số lượng thẻ theo từng nhóm trạng thái:
    /// - totalCards: Tổng số thẻ.
    /// - masteredCards: Số thẻ có status là Mastered.
    /// - learningCards: Số thẻ có status là Learning.
    /// - notStartedCards: Thẻ chưa từng học hoặc chưa chuyển trạng thái.
    /// </summary>
    private static DeckDto MapToDeckDto(Deck deck)
    {
        var totalCards = deck.Cards.Count;
        var masteredCards = deck.Cards.Count(c => c.StudyProgress?.Status == StudyStatus.Mastered);
        var learningCards = deck.Cards.Count(c => c.StudyProgress?.Status == StudyStatus.Learning);
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
