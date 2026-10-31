namespace QuizCard.Infrastructure.ExternalAPICalls.cloudinaryAPIs;

/// <summary>
/// Kết quả phản hồi từ Cloudinary sau khi tải video hoặc tài nguyên đa phương tiện lên.
/// </summary>
public class CloudinaryUploadResult
{
    /// <summary>
    /// Trạng thái upload thành công hay thất bại
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Định danh duy nhất của video trên Cloudinary (dùng để quản lý, xóa hoặc sinh URL biến đổi)
    /// </summary>
    public string? PublicId { get; set; }

    /// <summary>
    /// Đường dẫn HTTPS bảo mật để phát video trực tiếp trên trình duyệt
    /// </summary>
    public string? SecureUrl { get; set; }

    /// <summary>
    /// Đường dẫn HTTP thông thường
    /// </summary>
    public string? Url { get; set; }

    /// <summary>
    /// Định dạng file video (mp4, webm, mkv, mov,...)
    /// </summary>
    public string? Format { get; set; }

    /// <summary>
    /// Thời lượng video (tính bằng giây)
    /// </summary>
    public double Duration { get; set; }

    /// <summary>
    /// Chiều rộng video (pixels)
    /// </summary>
    public int Width { get; set; }

    /// <summary>
    /// Chiều cao video (pixels)
    /// </summary>
    public int Height { get; set; }

    /// <summary>
    /// Kích thước file video (bytes)
    /// </summary>
    public long Bytes { get; set; }

    /// <summary>
    /// Loại tài nguyên (thường là "video")
    /// </summary>
    public string? ResourceType { get; set; }

    /// <summary>
    /// URL thumbnail ảnh đại diện tự động sinh từ giây đầu tiên của video
    /// </summary>
    public string? ThumbnailUrl { get; set; }

    /// <summary>
    /// Thông báo lỗi (nếu có khi quá trình tải lên thất bại)
    /// </summary>
    public string? ErrorMessage { get; set; }
}

