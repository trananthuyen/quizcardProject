using QuizCard.ServiceContracts.DTOs.AuthDTOs;

namespace QuizCard.ServiceContracts;

/// <summary>
/// Hợp đồng dịch vụ xác thực tài khoản thông qua bên thứ ba (Google, Facebook).
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Xử lý đăng nhập hoặc tự động tạo tài khoản từ Google/Facebook kèm xác nhận điều khoản.
    /// </summary>
    Task<AuthResponse> ExternalLoginAsync(ExternalAuthRequest request);

    /// <summary>
    /// Lấy thông tin tài khoản người dùng theo Id.
    /// </summary>
    Task<CurrentUserDto?> GetCurrentUserAsync(Guid userId);
}

