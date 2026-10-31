using QuizCard.Entities;

namespace QuizCard.RepositoryContracts;

/// <summary>
/// Giao diện tầng truy xuất dữ liệu (Repository) cho bảng CloudinaryVideos
/// </summary>
public interface ICloudinaryVideosRepository
{
    /// <summary>
    /// Lấy danh sách tất cả các video đã lưu trữ (mới nhất lên đầu)
    /// </summary>
    Task<List<CloudinaryVideo>> GetAllVideosAsync(bool onlyActive = false, CancellationToken cancellationToken = default);

    /// <summary>
    /// Tìm video theo PublicId của Cloudinary
    /// </summary>
    Task<CloudinaryVideo?> GetByPublicIdAsync(string publicId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Tìm video theo Id (Guid)
    /// </summary>
    Task<CloudinaryVideo?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Lưu mới hoặc cập nhật một bản ghi video vào database
    /// </summary>
    Task<CloudinaryVideo> AddOrUpdateVideoAsync(CloudinaryVideo video, CancellationToken cancellationToken = default);

    /// <summary>
    /// Xóa một bản ghi video theo PublicId
    /// </summary>
    Task<bool> DeleteVideoAsync(string publicId, CancellationToken cancellationToken = default);
}

