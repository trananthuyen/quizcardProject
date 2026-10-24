using QuizCard.ServiceContracts.DTOs.DeckDTOs;

namespace QuizCard.ServiceContracts;

/// <summary>
/// Giao diện (Interface) định nghĩa các nghiệp vụ quản lý Bộ thẻ / Dự án (Deck Management).
/// </summary>
public interface IDeckService
{
    /// <summary>
    /// Lấy toàn bộ danh sách bộ thẻ kèm thống kê số lượng thẻ (Tổng số, Đã thuộc, Đang học, Chưa học).
    /// Có thể lọc theo phân loại (Category) nếu được truyền vào.
    /// </summary>
    /// <param name="category">Thể loại cần lọc (ví dụ: "Lập trình", "Tiếng Anh"...) hoặc null để lấy tất cả.</param>
    Task<IEnumerable<DeckDto>> GetAllDecksAsync(string? category = null);

    /// <summary>
    /// Lấy thông tin chi tiết một bộ thẻ theo mã định danh (Id).
    /// </summary>
    /// <param name="id">Mã Id của bộ thẻ.</param>
    Task<DeckDto?> GetDeckByIdAsync(Guid id);

    /// <summary>
    /// Tạo một bộ thẻ mới trong cơ sở dữ liệu kèm phân loại thể loại.
    /// </summary>
    /// <param name="request">Thông tin tiêu đề, mô tả và phân loại của bộ thẻ mới.</param>
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

