using System.ComponentModel.DataAnnotations;

namespace QuizCard.UI.Areas.Admin.Models;

/// <summary>
/// Yêu cầu đăng nhập dành riêng cho Quản trị viên (Admin).
/// </summary>
public class AdminLoginRequest
{
    [Required(ErrorMessage = "Tên đăng nhập hoặc Email không được để trống.")]
    public string UsernameOrEmail { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu quản trị viên không được để trống.")]
    public string Password { get; set; } = string.Empty;

    public bool RememberMe { get; set; } = true;
}

