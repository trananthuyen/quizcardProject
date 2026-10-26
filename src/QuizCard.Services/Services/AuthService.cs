using QuizCard.Entities.IdentifyEntities;
using QuizCard.RepositoryContracts;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.AuthDTOs;

namespace QuizCard.Services.Services;

/// <summary>
/// Cài đặt nghiệp vụ xác thực người dùng qua mạng xã hội (Google, Facebook)
/// tuân thủ Clean Architecture (chỉ tương tác dữ liệu qua IUsersRepository).
/// Hỗ trợ mỗi nhà cung cấp (Google, Facebook) là một tài khoản độc lập ngay cả khi dùng chung một địa chỉ Email.
/// </summary>
public class AuthService : IAuthService
{
    private readonly IUsersRepository _usersRepository;

    public AuthService(IUsersRepository usersRepository)
    {
        _usersRepository = usersRepository;
    }

    public async Task<AuthResponse> ExternalLoginAsync(ExternalAuthRequest request)
    {
        if (!request.TermsAccepted)
        {
            throw new InvalidOperationException("Bạn phải đồng ý với Điều khoản sử dụng của nền tảng để đăng nhập.");
        }

        var provider = request.Provider.Trim().ToLower();
        var email = request.Email.Trim().ToLower();
        var now = DateTime.UtcNow;

        // 1. Tìm kiếm tài khoản theo đúng Provider (Google hoặc Facebook riêng biệt)
        // Ưu tiên tìm theo Provider + ProviderKey, sau đó tìm theo Provider + Email.
        // Tuyệt đối không đối chiếu chéo provider để dù Google và Facebook cùng email vẫn là 2 tài khoản độc lập.
        var user = await _usersRepository.GetByProviderAsync(provider, request.ProviderKey)
                   ?? await _usersRepository.GetByProviderAndEmailAsync(provider, email);

        if (user == null)
        {
            // 2. Tự động tạo người dùng mới cho nhà cung cấp này
            var uniqueUserName = $"{provider}_{email}";
            user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                UserName = uniqueUserName,
                NormalizedUserName = uniqueUserName.ToUpper(),
                Email = email,
                NormalizedEmail = email.ToUpper(),
                EmailConfirmed = true,
                FullName = request.FullName,
                AvatarUrl = request.AvatarUrl,
                Provider = provider,
                ProviderKey = request.ProviderKey,
                TermsAccepted = true,
                TermsAcceptedAt = now,
                CreatedAt = now,
                SecurityStamp = Guid.NewGuid().ToString()
            };

            await _usersRepository.CreateUserAsync(user);
        }
        else
        {
            // 3. Cập nhật thông tin nếu có thay đổi
            bool changed = false;
            if (user.Provider != provider)
            {
                user.Provider = provider;
                changed = true;
            }
            if (string.IsNullOrEmpty(user.ProviderKey) && !string.IsNullOrEmpty(request.ProviderKey))
            {
                user.ProviderKey = request.ProviderKey;
                changed = true;
            }
            if (!string.IsNullOrEmpty(request.FullName) && user.FullName != request.FullName)
            {
                user.FullName = request.FullName;
                changed = true;
            }
            if (!string.IsNullOrEmpty(request.AvatarUrl) && user.AvatarUrl != request.AvatarUrl)
            {
                user.AvatarUrl = request.AvatarUrl;
                changed = true;
            }
            if (!user.TermsAccepted)
            {
                user.TermsAccepted = true;
                user.TermsAcceptedAt = now;
                changed = true;
            }

            if (changed)
            {
                await _usersRepository.UpdateUserAsync(user);
            }
        }

        // Tạo chuỗi token phiên đăng nhập dạng base64
        var token = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{user.Id}:{user.Email}:{now.Ticks}"));

        return new AuthResponse(
            user.Id,
            user.Email ?? email,
            user.FullName,
            user.AvatarUrl,
            user.Provider ?? provider,
            user.TermsAccepted,
            token
        );
    }

    public async Task<CurrentUserDto?> GetCurrentUserAsync(Guid userId)
    {
        var user = await _usersRepository.GetByIdAsync(userId);
        if (user == null) return null;

        return new CurrentUserDto(
            user.Id,
            user.Email ?? string.Empty,
            user.FullName,
            user.AvatarUrl,
            user.Provider ?? "google",
            user.TermsAccepted
        );
    }
}
