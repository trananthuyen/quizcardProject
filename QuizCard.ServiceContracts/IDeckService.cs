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
    Task<IEnumerable<DeckDto>> GetCommunityDecksAsync(string? folder = null, string? tag = null);

    /// <summary>
    /// 2. Lấy tất cả các bộ thẻ của người dùng cụ thể ở My Resources (Kho học liệu cá nhân).
    /// </summary>
    Task<IEnumerable<DeckDto>> GetUserDecksAsync(Guid userId, string? folder = null, string? tag = null);

    /// <summary>
    /// Lấy toàn bộ danh sách bộ thẻ kèm thống kê số lượng thẻ (Tổng số, Đã thuộc, Đang học, Chưa học).
    /// Có thể lọc theo Thư mục (Folder), Tag, hoặc theo người dùng sở hữu (UserId).
    /// </summary>
    Task<IEnumerable<DeckDto>> GetAllDecksAsync(string? folder = null, Guid? userId = null, string? tag = null);

    /// <summary>
    /// Lấy thông tin chi tiết một bộ thẻ theo mã định danh (Id).
    /// </summary>
    Task<DeckDto?> GetDeckByIdAsync(Guid id);

    /// <summary>
    /// Tạo một bộ thẻ mới trong cơ sở dữ liệu kèm thư mục (Folder), tag và thông tin người sở hữu (UserId).
    /// </summary>
    Task<DeckDto> CreateDeckAsync(CreateDeckRequest request);

    /// <summary>
    /// Chỉnh sửa thông tin tên, mô tả, thư mục hoặc tag của một bộ thẻ hiện có.
    /// </summary>
    Task<DeckDto?> UpdateDeckAsync(Guid id, UpdateDeckRequest request);

    /// <summary>
    /// Xóa hoàn toàn một bộ thẻ và toàn bộ các thẻ con bên trong nó khỏi cơ sở dữ liệu.
    /// </summary>
    Task<bool> DeleteDeckAsync(Guid id);
}
