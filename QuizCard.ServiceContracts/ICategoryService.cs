using QuizCard.ServiceContracts.DTOs.CategoryDTOs;

namespace QuizCard.ServiceContracts;

/// <summary>
/// Giao diện (Interface) định nghĩa các nghiệp vụ quản lý Phân loại bộ thẻ (Category Management).
/// </summary>
/// 
/// <summary>
/// Lấy danh sách toàn bộ các phân loại kèm số lượng bộ thẻ tương ứng.
/// </summary>
public interface ICategoryService
{
    Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync();

    /// <summary>
    /// Lấy chi tiết một phân loại theo Id.
    /// </summary>
    Task<CategoryDto?> GetCategoryByIdAsync(Guid id);

    /// <summary>
    /// Tạo một phân loại bộ thẻ mới.
    /// </summary>
    Task<CategoryDto> CreateCategoryAsync(CreateCategoryRequest request);

    /// <summary>
    /// Chỉnh sửa thông tin phân loại đã có.
    /// </summary>
    Task<CategoryDto?> UpdateCategoryAsync(Guid id, UpdateCategoryRequest request);

    /// <summary>
    /// Xóa một phân loại. Các bộ thẻ thuộc phân loại này sẽ tự động chuyển về phân loại "Chung".
    /// </summary>
    Task<bool> DeleteCategoryAsync(Guid id);
}

