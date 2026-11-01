using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Facebook;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using QuizCard.Entities.IdentifyEntities;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.AuthDTOs;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.RateLimiting;
using QuizCard.UI.StartupExtensions;

namespace QuizCard.UI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly UserManager<ApplicationUser> _userManager;

    public AuthController(
        IAuthService authService,
        SignInManager<ApplicationUser> signInManager,
        UserManager<ApplicationUser> userManager)
    {
        _authService = authService;
        _signInManager = signInManager;
        _userManager = userManager;
    }

    /// <summary>
    /// Kích hoạt luồng xác thực đăng nhập Google OAuth.
    /// </summary>
    [HttpGet("login-google")]
    [AllowAnonymous]
    public IActionResult LoginWithGoogle([FromQuery] string? returnUrl = null)
    {
        var redirectUrl = Url.Action(nameof(GoogleCallback), "Auth", new { returnUrl });
        var properties = _signInManager.ConfigureExternalAuthenticationProperties(GoogleDefaults.AuthenticationScheme, redirectUrl);
        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    /// <summary>
    /// Điểm tiếp nhận phản hồi từ Google sau khi người dùng xác thực thành công.
    /// </summary>
    [HttpGet("google-callback")]
    [HttpGet("google-response")]
    [AllowAnonymous]
    public async Task<IActionResult> GoogleCallback([FromQuery] string? returnUrl = null)
    {
        var info = await _signInManager.GetExternalLoginInfoAsync();
        ClaimsPrincipal? principal = info?.Principal;

        if (principal == null)
        {
            var authResult = await HttpContext.AuthenticateAsync(IdentityConstants.ExternalScheme);
            if (!authResult.Succeeded || authResult.Principal == null)
            {
                authResult = await HttpContext.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);
            }
            principal = authResult.Principal;
        }

        var targetBase = !string.IsNullOrWhiteSpace(returnUrl) && (returnUrl.StartsWith("http://localhost:5173") || returnUrl.StartsWith("https://localhost:5173"))
            ? returnUrl.TrimEnd('/')
            : "";

        if (principal == null)
        {
            return Redirect($"{targetBase}/#/?auth_error=google_failed");
        }

        var email = principal.FindFirstValue(ClaimTypes.Email);
        var name = principal.FindFirstValue(ClaimTypes.Name)
                   ?? principal.FindFirst("name")?.Value
                   ?? principal.FindFirst(ClaimTypes.GivenName)?.Value
                   ?? (!string.IsNullOrEmpty(email) ? email.Split('@')[0] : "Google User");

        var providerKey = info?.ProviderKey
                          ?? principal.FindFirstValue(ClaimTypes.NameIdentifier)
                          ?? email;
        var avatar = principal.FindFirst("picture")?.Value
                     ?? principal.FindFirst("urn:google:picture")?.Value;

        if (string.IsNullOrEmpty(email))
        {
            return Redirect($"{targetBase}/#/?auth_error=missing_email");
        }

        var authRequest = new ExternalAuthRequest(
            Provider: "google",
            ProviderKey: providerKey ?? email,
            Email: email,
            FullName: name,
            AvatarUrl: avatar,
            TermsAccepted: true
        );

        var authResponse = await _authService.ExternalLoginAsync(authRequest);

        // Đăng nhập đúng phiên người dùng theo Id của tài khoản vừa xác thực
        var identityUser = await _userManager.FindByIdAsync(authResponse.Id.ToString());

        if (identityUser != null)
        {
            await _signInManager.SignInAsync(identityUser, isPersistent: true);
        }

        var json = JsonSerializer.Serialize(authResponse, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        var base64User = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(json));

        return Redirect($"{targetBase}/#/auth-callback?user={Uri.EscapeDataString(base64User)}");
    }

    /// <summary>
    /// Kích hoạt luồng xác thực đăng nhập Facebook OAuth.
    /// </summary>
    [HttpGet("login-facebook")]
    [AllowAnonymous]
    public IActionResult LoginWithFacebook([FromQuery] string? returnUrl = null)
    {
        var redirectUrl = Url.Action(nameof(FacebookCallback), "Auth", new { returnUrl });
        var properties = _signInManager.ConfigureExternalAuthenticationProperties(FacebookDefaults.AuthenticationScheme, redirectUrl);
        return Challenge(properties, FacebookDefaults.AuthenticationScheme);
    }

    /// <summary>
    /// Điểm tiếp nhận phản hồi từ Facebook sau khi người dùng xác thực thành công.
    /// </summary>
    [HttpGet("facebook-callback")]
    [HttpGet("facebook-response")]
    [AllowAnonymous]
    public async Task<IActionResult> FacebookCallback([FromQuery] string? returnUrl = null)
    {
        var info = await _signInManager.GetExternalLoginInfoAsync();
        ClaimsPrincipal? principal = info?.Principal;

        if (principal == null)
        {
            var authResult = await HttpContext.AuthenticateAsync(IdentityConstants.ExternalScheme);
            if (!authResult.Succeeded || authResult.Principal == null)
            {
                authResult = await HttpContext.AuthenticateAsync(FacebookDefaults.AuthenticationScheme);
            }
            principal = authResult.Principal;
        }

        var targetBase = !string.IsNullOrWhiteSpace(returnUrl) && (returnUrl.StartsWith("http://localhost:5173") || returnUrl.StartsWith("https://localhost:5173"))
            ? returnUrl.TrimEnd('/')
            : "";

        if (principal == null)
        {
            return Redirect($"{targetBase}/#/?auth_error=facebook_failed");
        }

        var providerKey = info?.ProviderKey
                          ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);

        var email = principal.FindFirstValue(ClaimTypes.Email)
                    ?? principal.FindFirst("email")?.Value
                    ?? (providerKey != null ? $"{providerKey}@facebook.com" : null);

        // Trích xuất họ tên người dùng từ các claims của Facebook
        var name = principal.FindFirstValue(ClaimTypes.Name)
                   ?? principal.FindFirst("name")?.Value
                   ?? principal.FindFirstValue("urn:facebook:name")
                   ?? principal.FindFirst(ClaimTypes.GivenName)?.Value
                   ?? principal.Claims.FirstOrDefault(c => c.Type.EndsWith("/name", StringComparison.OrdinalIgnoreCase))?.Value;

        if (string.IsNullOrWhiteSpace(name))
        {
            var first = principal.FindFirst(ClaimTypes.GivenName)?.Value ?? principal.FindFirst("first_name")?.Value;
            var last = principal.FindFirst(ClaimTypes.Surname)?.Value ?? principal.FindFirst("last_name")?.Value;
            if (!string.IsNullOrWhiteSpace(first) || !string.IsNullOrWhiteSpace(last))
            {
                name = $"{first} {last}".Trim();
            }
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            name = !string.IsNullOrWhiteSpace(email) && !email.EndsWith("@facebook.com")
                   ? email.Split('@')[0]
                   : "Facebook User";
        }

        var avatar = principal.FindFirst("picture")?.Value
                     ?? (providerKey != null ? $"https://graph.facebook.com/{providerKey}/picture?type=large" : null);

        if (string.IsNullOrEmpty(email))
        {
            return Redirect($"{targetBase}/#/?auth_error=missing_email");
        }

        var authRequest = new ExternalAuthRequest(
            Provider: "facebook",
            ProviderKey: providerKey ?? email,
            Email: email,
            FullName: name,
            AvatarUrl: avatar,
            TermsAccepted: true
        );

        var authResponse = await _authService.ExternalLoginAsync(authRequest);

        // Đăng nhập đúng phiên người dùng theo Id của tài khoản vừa xác thực
        var identityUser = await _userManager.FindByIdAsync(authResponse.Id.ToString());
        if (identityUser != null)
        {
            await _signInManager.SignInAsync(identityUser, isPersistent: true);
        }

        var json = JsonSerializer.Serialize(authResponse, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        var base64User = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(json));

        return Redirect($"{targetBase}/#/auth-callback?user={Uri.EscapeDataString(base64User)}");
    }

    /// <summary>
    /// API xử lý trực tiếp yêu cầu đăng nhập bên ngoài (External Auth) với xác nhận điều khoản.
    /// </summary>
    [HttpPost("external-login")]
    [EnableRateLimiting(ConfigureRateLimitingExtension.PolicyAuth)]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> ExternalLogin([FromBody] ExternalAuthRequest request)
    {
        if (!request.TermsAccepted)
        {
            return BadRequest(new { message = "Vui lòng xác nhận đồng ý với Điều khoản sử dụng của nền tảng trước khi đăng nhập." });
        }

        try
        {
            var result = await _authService.ExternalLoginAsync(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi trong quá trình xác thực.", detail = ex.Message });
        }
    }

    /// <summary>
    /// Lấy thông tin tài khoản hiện tại từ phiên đăng nhập (Cookie / Claims).
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult<CurrentUserDto>> GetCurrentSessionUser()
    {
        if (User.Identity?.IsAuthenticated != true)
        {
            return Unauthorized(new { message = "Chưa đăng nhập." });
        }

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "Không xác định được danh tính người dùng trong phiên." });
        }

        var user = await _authService.GetCurrentUserAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "Không tìm thấy người dùng." });
        }

        return Ok(user);
    }

    /// <summary>
    /// Lấy thông tin tài khoản hiện tại theo userId.
    /// </summary>
    [HttpGet("me/{userId:guid}")]
    [Authorize("AuthorizedForUser")]
    public async Task<ActionResult<CurrentUserDto>> GetCurrentUser(Guid userId)
    {
        var user = await _authService.GetCurrentUserAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "Không tìm thấy người dùng." });
        }

        return Ok(user);
    }

    /// <summary>
    /// Đăng xuất khỏi hệ thống.
    /// </summary>
    [HttpPost("logout")]
    [Authorize("AuthorizedForUser")]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return Ok(new { message = "Đăng xuất thành công." });
    }
}
