using QuizCard.Entities;

namespace QuizCard.RepositoryContracts;

/// <summary>
/// Giao diện định nghĩa các hợp đồng truy vấn và thao tác dữ liệu cho thực thể Thư mục (Folder).
/// Giúp người sở hữu dễ dàng quản lý và phân nhóm các bộ thẻ (decks).
/// </summary>
public interface IFoldersRepository
{
    /// <summary>
    /// Tìm một thư mục theo tên (so khớp không phân biệt chữ hoa, chữ thường và khoảng trắng).
    /// </summary>
    Task<Folder?> FindFolderByName(string name);

    /// <summary>
    /// Đếm số lượng bộ thẻ đang trực thuộc một thư mục cụ thể theo tên.
    /// </summary>
    Task<int> CountDecksByFolderName(string folderName);

    /// <summary>
    /// Thống kê số lượng bộ thẻ được nhóm theo từng tên thư mục.
    /// </summary>
    Task<Dictionary<string, int>> GetDeckCountsGroupedByFolder(Guid? userId = null);

    /// <summary>
    /// Thêm mới một thư mục vào cơ sở dữ liệu.
    /// </summary>
    Task<Folder> CreateFolder(Folder folder);

    /// <summary>
    /// Lấy danh sách các thư mục trong hệ thống:
    /// Nếu có userId: trả về thư mục của người dùng đó và thư mục hệ thống (UserId == null).
    /// Nếu không có userId: chỉ trả về thư mục mặc định của hệ thống (UserId == null).
    /// </summary>
    Task<List<Folder>> GetAllFolders(Guid? userId = null);

    /// <summary>
    /// Tìm và lấy thông tin chi tiết một thư mục theo mã định danh (Id).
    /// </summary>
    Task<Folder?> GetFolderById(Guid id);

    /// <summary>
    /// Kiểm tra xem tên thư mục đã tồn tại trong hệ thống hay chưa.
    /// </summary>
    Task<bool> FolderExistsByName(string name, Guid? excludeId = null);

    /// <summary>
    /// Cập nhật thông tin thư mục đã có trong cơ sở dữ liệu.
    /// </summary>
    Task<Folder?> UpdateFolder(Folder folder);

    /// <summary>
    /// Xóa một thư mục khỏi cơ sở dữ liệu.
    /// </summary>
    Task<bool> DeleteFolder(Folder folder);

    /// <summary>
    /// Cập nhật đồng loạt tên thư mục của các bộ thẻ từ tên cũ sang tên mới.
    /// </summary>
    Task UpdateDecksFolder(string oldFolderName, string newFolderName);
}

