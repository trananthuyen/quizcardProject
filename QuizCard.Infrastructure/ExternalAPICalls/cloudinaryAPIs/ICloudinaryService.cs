namespace QuizCard.Infrastructure.ExternalAPICalls.cloudinaryAPIs;

/// <summary>
/// Giao diện dịch vụ tương tác với Cloudinary Media API (Upload, Xóa, Tối ưu luồng video).
/// </summary>
public interface ICloudinaryService
{
    /// <summary>
    /// Cho biết dịch vụ Cloudinary đã được cấu hình hợp lệ trong appsettings chưa
    /// </summary>
    bool IsConfigured { get; }

    /// <summary>
    /// Tên đám mây Cloudinary hiện tại
    /// </summary>
    string CloudName { get; }

    /// <summary>
    /// Tải luồng video (Stream) từ máy người dùng lên máy chủ Cloudinary
    /// </summary>
    /// <param name="stream">Luồng dữ liệu của file video</param>
    /// <param name="fileName">Tên file ban đầu</param>
    /// <param name="contentType">MIME type (ví dụ: video/mp4)</param>
    /// <param name="customFolder">Thư mục chỉ định trên Cloudinary (nếu null sẽ dùng mặc định)</param>
    /// <param name="cancellationToken">Token hủy tác vụ</param>
    /// <returns>Thông tin video đã tải lên kèm URL https</returns>
    Task<CloudinaryUploadResult> UploadVideoAsync(
        Stream stream,
        string fileName,
        string? contentType = null,
        string? customFolder = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Tải video từ một đường dẫn URL bên ngoài (YouTube direct stream, link MP4, CDN khác) lên Cloudinary
    /// </summary>
    Task<CloudinaryUploadResult> UploadVideoFromUrlAsync(
        string videoUrl,
        string? customFolder = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Xóa một video khỏi Cloudinary dựa theo publicId
    /// </summary>
    Task<bool> DeleteVideoAsync(
        string publicId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Tải file thô (raw file như .vtt, .srt) lên Cloudinary
    /// </summary>
    Task<CloudinaryUploadResult> UploadRawFileAsync(
        Stream stream,
        string fileName,
        string? customFolder = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Xóa một file raw (.vtt, .srt) khỏi Cloudinary dựa theo publicId
    /// </summary>
    Task<bool> DeleteRawFileAsync(
        string publicId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Sinh URL phát video tối ưu (tự động điều chỉnh định dạng webm/mp4, chất lượng q_auto)
    /// </summary>
    string GetOptimizedVideoUrl(string publicId, string? extension = "mp4", string? transformations = null);

    /// <summary>
    /// Tự động sinh link ảnh thumbnail từ frame đầu tiên của video trên Cloudinary
    /// </summary>
    string GetVideoThumbnailUrl(string publicId, int width = 640, int height = 360);
}

