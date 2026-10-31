namespace QuizCard.UI.Areas.Admin.Models;

/// <summary>
/// Kết quả phản hồi trạng thái xác thực của Quản trị viên (Admin).
/// </summary>
public class AdminAuthResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public AdminProfileDto? Admin { get; set; }
}

public class AdminProfileDto
{
    public string Id { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "Admin";
    public DateTime LoggedInAt { get; set; } = DateTime.UtcNow;
}

