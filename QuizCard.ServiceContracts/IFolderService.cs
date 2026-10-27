using QuizCard.ServiceContracts.DTOs.FolderDTOs;

namespace QuizCard.ServiceContracts;

/// <summary>
/// Giao diện (Interface) định nghĩa các nghiệp vụ quản lý Thư mục bộ thẻ (Folder Management).
/// </summary>
public interface IFolderService
{
    /// <summary>
    /// Lấy danh sách các thư mục kèm số lượng bộ thẻ tương ứng dựa theo UserId.
    /// </summary>
    Task<IEnumerable<FolderDto>> GetAllFoldersAsync(Guid? userId = null);

    /// <summary>
    /// Lấy chi tiết một thư mục theo Id.
    /// </summary>
    Task<FolderDto?> GetFolderByIdAsync(Guid id);

    /// <summary>
    /// Tạo một thư mục bộ thẻ mới.
    /// </summary>
    Task<FolderDto> CreateFolderAsync(CreateFolderRequest request);

    /// <summary>
    /// Chỉnh sửa thông tin thư mục đã có.
    /// </summary>
    Task<FolderDto?> UpdateFolderAsync(Guid id, UpdateFolderRequest request);

    /// <summary>
    /// Xóa một thư mục. Các bộ thẻ thuộc thư mục này sẽ tự động chuyển về thư mục "Chung".
    /// </summary>
    Task<bool> DeleteFolderAsync(Guid id);
}

