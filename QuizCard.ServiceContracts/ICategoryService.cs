using QuizCard.ServiceContracts.DTOs.CategoryDTOs;

namespace QuizCard.ServiceContracts;

/// <summary>
/// Giao diện (Interface) định nghĩa các nghiệp vụ quản lý Phân loại bộ thẻ (Category Management).
/// </summary>
public interface ICategoryService
{
    /// <summary>
    /// Lấy danh sách các phân loại kèm số lượng bộ thẻ tương ứng dựa theo UserId.
    /// Nếu có userId: trả về phân loại của người dùng đó và phân loại mặc định hệ thống.
    /// Nếu không có userId: chỉ trả về phân loại mặc định hệ thống.
    /// </summary>
    Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync(Guid? userId = null);

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
