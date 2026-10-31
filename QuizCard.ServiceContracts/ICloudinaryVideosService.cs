using QuizCard.ServiceContracts.DTOs.VideoDTOs;

namespace QuizCard.ServiceContracts;

/// <summary>
/// Giao diện dịch vụ nghiệp vụ xử lý lưu trữ, truy vấn và quản lý đường dẫn video Cloudinary
/// </summary>
public interface ICloudinaryVideosService
{
    /// <summary>
    /// Lấy danh sách video (cho Admin hoặc cho người dùng)
    /// </summary>
    Task<List<CloudinaryVideoDto>> GetAllVideosAsync(bool onlyActive = false, CancellationToken cancellationToken = default);

    /// <summary>
    /// Lấy chi tiết một video theo PublicId
    /// </summary>
    Task<CloudinaryVideoDto?> GetVideoByPublicIdAsync(string publicId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Lưu đường dẫn và siêu dữ liệu video sau khi upload lên Cloudinary
    /// </summary>
    Task<CloudinaryVideoDto> SaveVideoAsync(SaveCloudinaryVideoRequest request, string? createdBy = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Cập nhật thông tin hiển thị của video
    /// </summary>
    Task<CloudinaryVideoDto?> UpdateVideoAsync(string publicId, UpdateCloudinaryVideoRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Xóa bản ghi video khỏi cơ sở dữ liệu
    /// </summary>
    Task<bool> DeleteVideoAsync(string publicId, CancellationToken cancellationToken = default);
}

