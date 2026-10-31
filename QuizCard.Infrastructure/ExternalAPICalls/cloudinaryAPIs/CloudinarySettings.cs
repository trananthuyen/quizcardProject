namespace QuizCard.Infrastructure.ExternalAPICalls.cloudinaryAPIs;

/// <summary>
/// Cấu hình tham số kết nối dịch vụ Cloudinary để lưu trữ và phân phối video/hình ảnh.
/// </summary>
public class CloudinarySettings
{
    public const string SectionName = "Cloudinary";

    /// <summary>
    /// Tên đám mây Cloudinary (ví dụ: "dxyabc123")
    /// </summary>
    public string CloudName { get; set; } = string.Empty;

    /// <summary>
    /// API Key xác thực tài khoản Cloudinary
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// API Secret bảo mật dùng để ký chữ ký SHA-1/SHA-256
    /// </summary>
    public string ApiSecret { get; set; } = string.Empty;

    /// <summary>
    /// Tùy chọn: Upload preset không cần ký (Unsigned upload preset)
    /// </summary>
    public string? UploadPreset { get; set; }

    /// <summary>
    /// Thư mục mặc định trên Cloudinary lưu trữ video của dự án QuizCard
    /// </summary>
    public string Folder { get; set; } = "quizcard_videos";

    /// <summary>
    /// Kiểm tra xem cấu hình Cloudinary đã đủ điều kiện hoạt động hay chưa
    /// </summary>
    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(CloudName) &&
        ((!string.IsNullOrWhiteSpace(ApiKey) && !string.IsNullOrWhiteSpace(ApiSecret)) ||
         !string.IsNullOrWhiteSpace(UploadPreset));
}

