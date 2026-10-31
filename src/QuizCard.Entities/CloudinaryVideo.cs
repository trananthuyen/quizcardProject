namespace QuizCard.Entities;

/// <summary>
/// Đại diện cho bảng lưu trữ đường dẫn và thông tin video được lưu trữ trên Cloudinary.
/// Hỗ trợ quản lý video bài giảng, podcast, hướng dẫn phát âm, video tương tác...
/// </summary>
public class CloudinaryVideo
{
    /// <summary>
    /// Khóa chính định danh video trong cơ sở dữ liệu
    /// </summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Mã định danh duy nhất của video trên Cloudinary (vd: quizcard_videos/abc123xyz)
    /// Dùng để quản lý, xóa hoặc sinh URL biến đổi tối ưu
    /// </summary>
    public string PublicId { get; set; } = string.Empty;

    /// <summary>
    /// Tiêu đề video hiển thị cho người học hoặc admin
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Mô tả chi tiết nội dung video bài giảng hoặc ghi chú
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Đường dẫn HTTPS bảo mật để phát video trực tiếp trên trình duyệt
    /// </summary>
    public string SecureUrl { get; set; } = string.Empty;

    /// <summary>
    /// Đường dẫn HTTP thông thường từ Cloudinary (nếu có)
    /// </summary>
    public string? Url { get; set; }

    /// <summary>
    /// Định dạng file video (mp4, webm, mov, mkv...)
    /// </summary>
    public string? Format { get; set; }

    /// <summary>
    /// Thời lượng phát của video (tính theo giây)
    /// </summary>
    public double Duration { get; set; }

    /// <summary>
    /// Dung lượng file video tính theo byte
    /// </summary>
    public long Bytes { get; set; }

    /// <summary>
    /// Chiều rộng video (pixels)
    /// </summary>
    public int? Width { get; set; }

    /// <summary>
    /// Chiều cao video (pixels)
    /// </summary>
    public int? Height { get; set; }

    /// <summary>
    /// Thư mục lưu trữ trên Cloudinary (mặc định: quizcard_videos)
    /// </summary>
    public string? Folder { get; set; } = "quizcard_videos";

    /// <summary>
    /// URL ảnh đại diện thumbnail tự động tạo từ giây đầu tiên của video
    /// </summary>
    public string? ThumbnailUrl { get; set; }

    /// <summary>
    /// Toàn bộ nội dung phụ đề WebVTT tiếng Anh lưu dưới dạng text trong cơ sở dữ liệu
    /// </summary>
    public string? VttEnText { get; set; }

    /// <summary>
    /// Đường dẫn file phụ đề WebVTT tiếng Anh (trên Cloudinary hoặc URL ngoài)
    /// </summary>
    public string? VttEnUrl { get; set; }

    /// <summary>
    /// PublicId file phụ đề tiếng Anh trên Cloudinary
    /// </summary>
    public string? VttEnPublicId { get; set; }

    /// <summary>
    /// Toàn bộ nội dung phụ đề WebVTT tiếng Việt lưu dưới dạng text trong cơ sở dữ liệu
    /// </summary>
    public string? VttViText { get; set; }

    /// <summary>
    /// Đường dẫn file phụ đề WebVTT tiếng Việt (trên Cloudinary hoặc URL ngoài)
    /// </summary>
    public string? VttViUrl { get; set; }

    /// <summary>
    /// PublicId file phụ đề tiếng Việt trên Cloudinary
    /// </summary>
    public string? VttViPublicId { get; set; }

    /// <summary>
    /// Trạng thái hoạt động (true: hiển thị cho học sinh, false: ẩn/tạm khóa)
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Thời điểm video được tải lên và lưu vào hệ thống
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Tên hoặc mã của Admin đã tải lên video này
    /// </summary>
    public string? CreatedBy { get; set; }
}

