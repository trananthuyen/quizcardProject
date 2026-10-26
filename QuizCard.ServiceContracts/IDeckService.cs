using QuizCard.ServiceContracts.DTOs.DeckDTOs;

namespace QuizCard.ServiceContracts;

/// <summary>
/// Giao diện (Interface) định nghĩa các nghiệp vụ quản lý Bộ thẻ / Dự án (Deck Management).
/// </summary>
public interface IDeckService
{
    /// <summary>
    /// 1. Lấy tất cả các bộ thẻ hiển thị ở Community (Cộng đồng).
    /// </summary>
    /// <param name="category">Thể loại cần lọc hoặc null để lấy tất cả.</param>
    Task<IEnumerable<DeckDto>> GetCommunityDecksAsync(string? category = null);

    /// <summary>
    /// 2. Lấy tất cả các bộ thẻ của người dùng cụ thể ở My Resources (Kho học liệu cá nhân).
    /// </summary>
    /// <param name="userId">Mã định danh của người dùng sở hữu.</param>
    /// <param name="category">Thể loại cần lọc hoặc null để lấy tất cả.</param>
    Task<IEnumerable<DeckDto>> GetUserDecksAsync(Guid userId, string? category = null);

    /// <summary>
    /// Lấy toàn bộ danh sách bộ thẻ kèm thống kê số lượng thẻ (Tổng số, Đã thuộc, Đang học, Chưa học).
    /// Có thể lọc theo phân loại (Category) hoặc theo người dùng sở hữu (UserId) nếu được truyền vào.
    /// </summary>
    /// <param name="category">Thể loại cần lọc (ví dụ: "Lập trình", "Tiếng Anh"...) hoặc null để lấy tất cả.</param>
    /// <param name="userId">ID người dùng cần lấy danh sách bộ thẻ của riêng họ (tùy chọn).</param>
    Task<IEnumerable<DeckDto>> GetAllDecksAsync(string? category = null, Guid? userId = null);

    /// <summary>
    /// Lấy thông tin chi tiết một bộ thẻ theo mã định danh (Id).
    /// </summary>
    /// <param name="id">Mã Id của bộ thẻ.</param>
    Task<DeckDto?> GetDeckByIdAsync(Guid id);

    /// <summary>
    /// Tạo một bộ thẻ mới trong cơ sở dữ liệu kèm phân loại thể loại và thông tin người sở hữu (UserId).
    /// </summary>
    /// <param name="request">Thông tin tiêu đề, mô tả, phân loại và UserId người tạo bộ thẻ.</param>
    Task<DeckDto> CreateDeckAsync(CreateDeckRequest request);

    /// <summary>
    /// Chỉnh sửa thông tin tên, mô tả hoặc phân loại của một bộ thẻ hiện có.
    /// </summary>
    /// <param name="id">Mã Id bộ thẻ cần sửa.</param>
    /// <param name="request">Dữ liệu mới cần cập nhật.</param>
    Task<DeckDto?> UpdateDeckAsync(Guid id, UpdateDeckRequest request);

    /// <summary>
    /// Xóa hoàn toàn một bộ thẻ và toàn bộ các thẻ con bên trong nó khỏi cơ sở dữ liệu.
    /// </summary>
    /// <param name="id">Mã Id bộ thẻ cần xóa.</param>
    /// <returns>True nếu xóa thành công, False nếu không tìm thấy bộ thẻ.</returns>
    Task<bool> DeleteDeckAsync(Guid id);
}
