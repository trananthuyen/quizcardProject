using QuizCard.Entities;
using QuizCard.RepositoryContracts;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.FolderDTOs;

namespace QuizCard.Services;

/// <summary>
/// Lớp triển khai các thao tác CRUD cho Thư mục bộ thẻ (FolderService).
/// Sử dụng IFoldersRepository theo chuẩn Clean Architecture.
/// </summary>
public class FolderService : IFolderService
{
    private readonly IFoldersRepository _foldersRepository;

    public FolderService(IFoldersRepository foldersRepository)
    {
        _foldersRepository = foldersRepository;
    }

    /// <summary>
    /// Lấy danh sách toàn bộ các thư mục kèm số lượng bộ thẻ đang trực thuộc thư mục đó (DeckCount) dựa theo UserId.
    /// Sắp xếp theo ngày tạo tăng dần.
    /// </summary>
    public async Task<IEnumerable<FolderDto>> GetAllFoldersAsync(Guid? userId = null)
    {
        var folders = await _foldersRepository.GetAllFolders(userId);
        var deckCounts = await _foldersRepository.GetDeckCountsGroupedByFolder(userId);

        return folders.Select(f =>
        {
            var lower = f.Name.ToLower();
            var count = deckCounts.TryGetValue(lower, out var cnt) ? cnt : 0;
            return new FolderDto(
                f.Id,
                f.Name,
                f.Description,
                f.Icon,
                f.Color,
                count,
                f.CreatedAt,
                f.UserId
            );
        });
    }

    /// <summary>
    /// Lấy chi tiết một thư mục theo Id.
    /// </summary>
    public async Task<FolderDto?> GetFolderByIdAsync(Guid id)
    {
        var f = await _foldersRepository.GetFolderById(id);
        if (f is null) return null;

        var count = await _foldersRepository.CountDecksByFolderName(f.Name);
        return new FolderDto(f.Id, f.Name, f.Description, f.Icon, f.Color, count, f.CreatedAt, f.UserId);
    }

    /// <summary>
    /// Tạo một thư mục bộ thẻ mới.
    /// Kiểm tra nếu tên thư mục đã tồn tại (không phân biệt hoa thường) thì ném lỗi.
    /// </summary>
    public async Task<FolderDto> CreateFolderAsync(CreateFolderRequest request)
    {
        var trimmedName = request.Name.Trim();
        var existing = await _foldersRepository.FindFolderByName(trimmedName);

        if (existing is not null)
        {
            throw new InvalidOperationException($"Thư mục '{trimmedName}' đã tồn tại");
        }

        var folder = new Folder
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Name = trimmedName,
            Description = request.Description?.Trim(),
            Icon = string.IsNullOrWhiteSpace(request.Icon) ? "📁" : request.Icon.Trim(),
            Color = string.IsNullOrWhiteSpace(request.Color) ? "#3b82f6" : request.Color.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await _foldersRepository.CreateFolder(folder);

        var count = await _foldersRepository.CountDecksByFolderName(folder.Name);
        return new FolderDto(folder.Id, folder.Name, folder.Description, folder.Icon, folder.Color, count, folder.CreatedAt, folder.UserId);
    }

    /// <summary>
    /// Chỉnh sửa tên, mô tả, biểu tượng hoặc màu sắc của thư mục.
    /// Nếu đổi tên thư mục thì cập nhật đồng bộ các bộ thẻ đang dùng tên cũ sang tên mới.
    /// </summary>
    public async Task<FolderDto?> UpdateFolderAsync(Guid id, UpdateFolderRequest request)
    {
        var folder = await _foldersRepository.GetFolderById(id);
        if (folder is null) return null;

        var oldName = folder.Name;
        var newName = request.Name.Trim();

        if (!string.Equals(oldName, newName, StringComparison.OrdinalIgnoreCase))
        {
            var isDuplicate = await _foldersRepository.FolderExistsByName(newName, id);
            if (isDuplicate)
            {
                throw new InvalidOperationException($"Thư mục '{newName}' đã tồn tại");
            }

            // Đồng bộ tên thư mục mới cho tất cả các bộ thẻ liên quan
            await _foldersRepository.UpdateDecksFolder(oldName, newName);
        }

        folder.Name = newName;
        folder.Description = request.Description?.Trim();
        folder.Icon = string.IsNullOrWhiteSpace(request.Icon) ? "📁" : request.Icon.Trim();
        folder.Color = string.IsNullOrWhiteSpace(request.Color) ? "#3b82f6" : request.Color.Trim();

        await _foldersRepository.UpdateFolder(folder);

        var count = await _foldersRepository.CountDecksByFolderName(folder.Name);
        return new FolderDto(folder.Id, folder.Name, folder.Description, folder.Icon, folder.Color, count, folder.CreatedAt, folder.UserId);
    }

    /// <summary>
    /// Xóa một thư mục bộ thẻ.
    /// Các bộ thẻ trước đó thuộc thư mục này sẽ tự động chuyển sang thư mục "Chung".
    /// </summary>
    public async Task<bool> DeleteFolderAsync(Guid id)
    {
        var folder = await _foldersRepository.GetFolderById(id);
        if (folder is null) return false;

        // Chuyển các bộ thẻ liên quan sang thư mục "Chung"
        await _foldersRepository.UpdateDecksFolder(folder.Name, "Chung");

        return await _foldersRepository.DeleteFolder(folder);
    }
}

