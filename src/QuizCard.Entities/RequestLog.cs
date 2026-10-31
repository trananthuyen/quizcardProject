namespace QuizCard.Entities;

/// <summary>
/// Thực thể lưu vết toàn bộ các yêu cầu HTTP (Request Logs) gửi tới máy chủ từ người dùng hoặc khách.
/// Dùng để theo dõi hiệu năng, bảo mật, nhật ký lỗi và tần suất sử dụng các API.
/// </summary>
public class RequestLog
{
    /// <summary>
    /// Khóa chính định danh duy nhất cho mỗi bản ghi log.
    /// </summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// ID người dùng thực hiện (null nếu là khách vãng lai chưa đăng nhập).
    /// </summary>
    public Guid? UserId { get; set; }

    /// <summary>
    /// Email hoặc Tên tài khoản của người dùng (nếu đã xác thực).
    /// </summary>
    public string? UserEmail { get; set; }

    /// <summary>
    /// Địa chỉ IP của máy khách gửi yêu cầu (Client IP).
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// Phương thức HTTP (GET, POST, PUT, DELETE, PATCH, OPTIONS...).
    /// </summary>
    public string Method { get; set; } = "GET";

    /// <summary>
    /// Đường dẫn URL mà client yêu cầu (Path: ví dụ /api/decks, /api/cards...).
    /// </summary>
    public string Path { get; set; } = string.Empty;

    /// <summary>
    /// Tham số truy vấn trên URL (QueryString: ví dụ ?search=toeic&sort=date).
    /// </summary>
    public string? QueryString { get; set; }

    /// <summary>
    /// Mã trạng thái HTTP trả về từ server (200, 201, 400, 401, 403, 404, 500...).
    /// </summary>
    public int StatusCode { get; set; }

    /// <summary>
    /// Thời gian xử lý yêu cầu tính theo mili-giây (Execution Duration in ms).
    /// </summary>
    public double DurationMs { get; set; }

    /// <summary>
    /// Chuỗi User-Agent nhận dạng trình duyệt và thiết bị client.
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// Thông báo lỗi hoặc Exception StackTrace nếu xảy ra sự cố (Status >= 400 hoặc 500).
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Nội dung dữ liệu gửi lên (Request Body tóm tắt, đã lọc bỏ các trường nhạy cảm như mật khẩu).
    /// </summary>
    public string? RequestBody { get; set; }

    /// <summary>
    /// Thời điểm gửi yêu cầu (UTC).
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

