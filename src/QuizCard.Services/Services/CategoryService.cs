using Microsoft.EntityFrameworkCore;
using QuizCard.Services.Data;
using QuizCard.Services.DTOs;
using QuizCard.Services.Models;

namespace QuizCard.Services.Services;

/// <summary>
/// Lớp triển khai các thao tác CRUD cho Phân loại bộ thẻ (CategoryService).
/// Sử dụng Entity Framework Core và lưu trữ trong SQLite.
/// </summary>
public class CategoryService : ICategoryService
{
    private readonly QuizCardDbContext _context;

    public CategoryService(QuizCardDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách toàn bộ các phân loại kèm số lượng bộ thẻ đang thuộc phân loại đó (DeckCount).
    /// Sắp xếp theo ngày tạo hoặc theo số lượng bộ thẻ giảm dần.
    /// </summary>
    public async Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync()
    {
        var categories = await _context.Categories
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        // Lấy danh sách số lượng bộ thẻ theo từng category
        var deckCounts = await _context.Decks
            .GroupBy(d => d.Category.ToLower())
            .Select(g => new { CategoryLower = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.CategoryLower, x => x.Count);

        return categories.Select(c =>
        {
            var lower = c.Name.ToLower();
            var count = deckCounts.TryGetValue(lower, out var cnt) ? cnt : 0;
            return new CategoryDto(
                c.Id,
                c.Name,
                c.Description,
                c.Icon,
                c.Color,
                count,
                c.CreatedAt
            );
        });
    }

    /// <summary>
    /// Lấy chi tiết một phân loại theo Id.
    /// </summary>
    public async Task<CategoryDto?> GetCategoryByIdAsync(Guid id)
    {
        var c = await _context.Categories.FindAsync(id);
        if (c is null) return null;

        var count = await _context.Decks.CountAsync(d => d.Category.ToLower() == c.Name.ToLower());
        return new CategoryDto(c.Id, c.Name, c.Description, c.Icon, c.Color, count, c.CreatedAt);
    }

    /// <summary>
    /// Tạo một phân loại bộ thẻ mới.
    /// Kiểm tra nếu tên phân loại đã tồn tại (không phân biệt hoa thường) thì ném lỗi hoặc trả về bản ghi cũ.
    /// </summary>
    public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryRequest request)
    {
        var trimmedName = request.Name.Trim();
        var existing = await _context.Categories
            .FirstOrDefaultAsync(c => c.Name.ToLower() == trimmedName.ToLower());

        if (existing is not null)
        {
            throw new InvalidOperationException($"Phân loại '{trimmedName}' đã tồn tại");
        }

        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = trimmedName,
            Description = request.Description?.Trim(),
            Icon = string.IsNullOrWhiteSpace(request.Icon) ? "📁" : request.Icon.Trim(),
            Color = string.IsNullOrWhiteSpace(request.Color) ? "#3b82f6" : request.Color.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        var count = await _context.Decks.CountAsync(d => d.Category.ToLower() == category.Name.ToLower());
        return new CategoryDto(category.Id, category.Name, category.Description, category.Icon, category.Color, count, category.CreatedAt);
    }

    /// <summary>
    /// Chỉnh sửa tên, mô tả, biểu tượng hoặc màu sắc của phân loại.
    /// Nếu đổi tên phân loại thì cập nhật đồng bộ các bộ thẻ đang dùng tên cũ sang tên mới.
    /// </summary>
    public async Task<CategoryDto?> UpdateCategoryAsync(Guid id, UpdateCategoryRequest request)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category is null) return null;

        var oldName = category.Name;
        var newName = request.Name.Trim();

        // Kiểm tra xem tên mới có bị trùng với phân loại khác không
        if (!string.Equals(oldName, newName, StringComparison.OrdinalIgnoreCase))
        {
            var isDuplicate = await _context.Categories
                .AnyAsync(c => c.Id != id && c.Name.ToLower() == newName.ToLower());
            if (isDuplicate)
            {
                throw new InvalidOperationException($"Phân loại '{newName}' đã tồn tại");
            }

            // Đồng bộ tên phân loại mới cho tất cả các bộ thẻ liên quan
            var relatedDecks = await _context.Decks
                .Where(d => d.Category.ToLower() == oldName.ToLower())
                .ToListAsync();

            foreach (var deck in relatedDecks)
            {
                deck.Category = newName;
            }
        }

        category.Name = newName;
        category.Description = request.Description?.Trim();
        category.Icon = string.IsNullOrWhiteSpace(request.Icon) ? "📁" : request.Icon.Trim();
        category.Color = string.IsNullOrWhiteSpace(request.Color) ? "#3b82f6" : request.Color.Trim();

        await _context.SaveChangesAsync();

        var count = await _context.Decks.CountAsync(d => d.Category.ToLower() == category.Name.ToLower());
        return new CategoryDto(category.Id, category.Name, category.Description, category.Icon, category.Color, count, category.CreatedAt);
    }

    /// <summary>
    /// Xóa một phân loại bộ thẻ.
    /// Các bộ thẻ trước đó thuộc phân loại này sẽ tự động chuyển sang phân loại "Chung".
    /// </summary>
    public async Task<bool> DeleteCategoryAsync(Guid id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category is null) return false;

        // Chuyển các bộ thẻ liên quan sang category "Chung"
        var relatedDecks = await _context.Decks
            .Where(d => d.Category.ToLower() == category.Name.ToLower())
            .ToListAsync();

        foreach (var deck in relatedDecks)
        {
            deck.Category = "Chung";
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        return true;
    }
}

