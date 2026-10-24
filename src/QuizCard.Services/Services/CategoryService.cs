using QuizCard.Entities;
using QuizCard.RepositoryContracts;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.CategoryDTOs;

namespace QuizCard.Services;

/// <summary>
/// Lớp triển khai các thao tác CRUD cho Phân loại bộ thẻ (CategoryService).
/// Sử dụng ICategoriesRespository theo chuẩn Clean Architecture.
/// </summary>
public class CategoryService : ICategoryService
{
    private readonly ICategoriesRespository _categoriesRespository;

    public CategoryService(ICategoriesRespository categoriesRespository)
    {
        _categoriesRespository = categoriesRespository;
    }

    /// <summary>
    /// Lấy danh sách toàn bộ các phân loại kèm số lượng bộ thẻ đang thuộc phân loại đó (DeckCount).
    /// Sắp xếp theo ngày tạo hoặc theo số lượng bộ thẻ giảm dần.
    /// </summary>
    public async Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync()
    {
        var categories = await _categoriesRespository.GetAllCategories();
        var deckCounts = await _categoriesRespository.GetDeckCountsGroupedByCategory();

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
        var c = await _categoriesRespository.GetCategoryById(id);
        if (c is null) return null;

        var count = await _categoriesRespository.CountDecksByCategoryName(c.Name);
        return new CategoryDto(c.Id, c.Name, c.Description, c.Icon, c.Color, count, c.CreatedAt);
    }

    /// <summary>
    /// Tạo một phân loại bộ thẻ mới.
    /// Kiểm tra nếu tên phân loại đã tồn tại (không phân biệt hoa thường) thì ném lỗi.
    /// </summary>
    public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryRequest request)
    {
        var trimmedName = request.Name.Trim();
        var existing = await _categoriesRespository.FindCategoryByName(trimmedName);

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

        await _categoriesRespository.CreateCategory(category);

        var count = await _categoriesRespository.CountDecksByCategoryName(category.Name);
        return new CategoryDto(category.Id, category.Name, category.Description, category.Icon, category.Color, count, category.CreatedAt);
    }

    /// <summary>
    /// Chỉnh sửa tên, mô tả, biểu tượng hoặc màu sắc của phân loại.
    /// Nếu đổi tên phân loại thì cập nhật đồng bộ các bộ thẻ đang dùng tên cũ sang tên mới.
    /// </summary>
    public async Task<CategoryDto?> UpdateCategoryAsync(Guid id, UpdateCategoryRequest request)
    {
        var category = await _categoriesRespository.GetCategoryById(id);
        if (category is null) return null;

        var oldName = category.Name;
        var newName = request.Name.Trim();

        // Kiểm tra xem tên mới có bị trùng với phân loại khác không
        if (!string.Equals(oldName, newName, StringComparison.OrdinalIgnoreCase))
        {
            var isDuplicate = await _categoriesRespository.CategoryExistsByName(newName, id);
            if (isDuplicate)
            {
                throw new InvalidOperationException($"Phân loại '{newName}' đã tồn tại");
            }

            // Đồng bộ tên phân loại mới cho tất cả các bộ thẻ liên quan
            await _categoriesRespository.UpdateDecksCategory(oldName, newName);
        }

        category.Name = newName;
        category.Description = request.Description?.Trim();
        category.Icon = string.IsNullOrWhiteSpace(request.Icon) ? "📁" : request.Icon.Trim();
        category.Color = string.IsNullOrWhiteSpace(request.Color) ? "#3b82f6" : request.Color.Trim();

        await _categoriesRespository.UpdateCategory(category);

        var count = await _categoriesRespository.CountDecksByCategoryName(category.Name);
        return new CategoryDto(category.Id, category.Name, category.Description, category.Icon, category.Color, count, category.CreatedAt);
    }

    /// <summary>
    /// Xóa một phân loại bộ thẻ.
    /// Các bộ thẻ trước đó thuộc phân loại này sẽ tự động chuyển sang phân loại "Chung".
    /// </summary>
    public async Task<bool> DeleteCategoryAsync(Guid id)
    {
        var category = await _categoriesRespository.GetCategoryById(id);
        if (category is null) return false;

        // Chuyển các bộ thẻ liên quan sang category "Chung"
        await _categoriesRespository.UpdateDecksCategory(category.Name, "Chung");

        return await _categoriesRespository.DeleteCategory(category);
    }
}
