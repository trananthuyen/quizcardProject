namespace QuizCard.ServiceContracts.DTOs.AuthDTOs;

/// <summary>
/// Yêu cầu đăng nhập hoặc đăng ký thông qua OAuth Provider (Google / Facebook).
/// </summary>
public record ExternalAuthRequest(
    string Provider,            // "google" hoặc "facebook"
    string ProviderKey,         // ID người dùng từ Google/Facebook (sub/id)
    string Email,               // Email nhận được từ OAuth
    string? FullName,           // Họ tên người dùng
    string? AvatarUrl,          // Ảnh đại diện
    bool TermsAccepted          // Bắt buộc xác nhận đã đọc điều khoản nền tảng
);

/// <summary>
/// Thông tin phản hồi sau khi xác thực thành công.
/// </summary>
public record AuthResponse(
    Guid Id,
    string Email,
    string? FullName,
    string? AvatarUrl,
    string Provider,
    bool TermsAccepted,
    string Token
);

/// <summary>
/// DTO chứa thông tin người dùng hiện tại đang đăng nhập.
/// </summary>
public record CurrentUserDto(
    Guid Id,
    string Email,
    string? FullName,
    string? AvatarUrl,
    string Provider,
    bool TermsAccepted
);

