using QuizCard.Entities;

namespace QuizCard.RepositoryContracts;

/// <summary>
/// Giao diện định nghĩa các hợp đồng truy vấn và thao tác dữ liệu cho thực thể Phân loại/Chủ đề (Category).
/// Thuộc tầng RepositoryContracts trong kiến trúc Clean Architecture.
/// </summary>
public interface ICategoriesRespository
{
    /// <summary>
    /// Tìm một phân loại theo tên (so khớp không phân biệt chữ hoa, chữ thường và khoảng trắng).
    /// </summary>
    /// <param name="name">Tên phân loại cần tìm kiếm.</param>
    /// <returns>Thực thể phân loại nếu tìm thấy, ngược lại trả về null.</returns>
    Task<Category?> FindCategoryByName(string name);

    /// <summary>
    /// Đếm số lượng bộ thẻ đang trực thuộc một phân loại cụ thể theo tên.
    /// </summary>
    /// <param name="name">Tên phân loại cần đếm số bộ thẻ.</param>
    /// <returns>Số lượng bộ thẻ thuộc phân loại đó.</returns>
    Task<int> CountDecksByCategoryName(string name);

    /// <summary>
    /// Thống kê số lượng bộ thẻ được nhóm theo từng tên phân loại (dạng chữ thường làm key).
    /// </summary>
    /// <returns>Dictionary với Key là tên phân loại viết thường và Value là số lượng bộ thẻ.</returns>
    Task<Dictionary<string, int>> GetDeckCountsGroupedByCategory();

    /// <summary>
    /// Thêm mới một phân loại vào cơ sở dữ liệu.
    /// </summary>
    /// <param name="category">Thực thể phân loại cần tạo.</param>
    /// <returns>Thực thể phân loại sau khi đã lưu.</returns>
    Task<Category> CreateCategory(Category category);

    /// <summary>
    /// Lấy danh sách toàn bộ các phân loại trong hệ thống, sắp xếp theo thời gian tạo tăng dần.
    /// </summary>
    /// <returns>Danh sách tất cả phân loại.</returns>
    Task<List<Category>> GetAllCategories();

    /// <summary>
    /// Tìm và lấy thông tin chi tiết một phân loại theo mã định danh (Id).
    /// </summary>
    /// <param name="id">Định danh duy nhất (Id) của phân loại.</param>
    /// <returns>Thực thể phân loại nếu tìm thấy, ngược lại trả về null.</returns>
    Task<Category?> GetCategoryById(Guid id);

    /// <summary>
    /// Kiểm tra xem tên phân loại đã tồn tại trong hệ thống hay chưa, có thể loại trừ một Id chỉ định (dùng khi cập nhật).
    /// </summary>
    /// <param name="name">Tên phân loại cần kiểm tra trùng lặp.</param>
    /// <param name="excludeId">Id của phân loại hiện tại cần bỏ qua kiểm tra trùng (tùy chọn).</param>
    /// <returns>True nếu tên đã tồn tại, ngược lại trả về False.</returns>
    Task<bool> CategoryExistsByName(string name, Guid? excludeId = null);

    /// <summary>
    /// Cập nhật thông tin phân loại đã có trong cơ sở dữ liệu.
    /// </summary>
    /// <param name="category">Thực thể phân loại chứa thông tin cập nhật.</param>
    /// <returns>Thực thể phân loại sau khi cập nhật.</returns>
    Task<Category?> UpdateCategory(Category category);

    /// <summary>
    /// Xóa một phân loại khỏi cơ sở dữ liệu.
    /// </summary>
    /// <param name="category">Thực thể phân loại cần xóa.</param>
    /// <returns>True nếu xóa thành công, ngược lại trả về False.</returns>
    Task<bool> DeleteCategory(Category category);

    /// <summary>
    /// Cập nhật đồng loạt tên phân loại của các bộ thẻ từ tên cũ sang tên mới.
    /// </summary>
    /// <param name="oldCategoryName">Tên phân loại cũ.</param>
    /// <param name="newCategoryName">Tên phân loại mới cần chuyển sang.</param>
    Task UpdateDecksCategory(string oldCategoryName, string newCategoryName);
}
