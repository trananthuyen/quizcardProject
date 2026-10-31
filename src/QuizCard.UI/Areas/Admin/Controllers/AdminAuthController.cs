using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using QuizCard.Entities.IdentifyEntities;
using QuizCard.UI.Areas.Admin.Models;
using QuizCard.UI.StartupExtensions;

namespace QuizCard.UI.Areas.Admin.Controllers;

[Area("Admin")]
[Route("api/[area]/auth")]
[ApiController]
public class AdminAuthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ILogger<AdminAuthController> _logger;

    public AdminAuthController(
        IConfiguration configuration,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ILogger<AdminAuthController> logger)
    {
        _configuration = configuration;
        _userManager = userManager;
        _signInManager = signInManager;
        _logger = logger;
    }

    /// <summary>
    /// Đăng nhập tài khoản Quản trị viên (Admin)
    /// Hỗ trợ cả tài khoản Admin mặc định trong cấu hình và tài khoản Admin trong CSDL
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting(ConfigureRateLimitingExtension.PolicyAuth)]
    public async Task<IActionResult> Login([FromBody] AdminLoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new AdminAuthResponse
            {
                Success = false,
                Message = "Dữ liệu đăng nhập không hợp lệ."
            });
        }

        var input = request.UsernameOrEmail.Trim();
        var password = request.Password;

        bool isValid = false;
        string adminId = Guid.NewGuid().ToString();
        string adminUsername = "";
        string adminEmail = "";


        // 2. Kiểm tra tài khoản Quản trị viên trong CSDL Identity
        var dbUser = await _userManager.FindByNameAsync(input) ?? await _userManager.FindByEmailAsync(input);
        if (dbUser != null)
        {
            var isPasswordCorrect = await _userManager.CheckPasswordAsync(dbUser, password);
            var isRoleAdmin = await _userManager.IsInRoleAsync(dbUser, "Admin");

            if (isPasswordCorrect && isRoleAdmin)
            {
                isValid = true;
                adminId = dbUser.Id.ToString();
                adminUsername = dbUser.UserName ?? input;
                adminEmail = dbUser.Email ?? input;
            }
        }


        if (!isValid)
        {
            _logger.LogWarning("Thử đăng nhập quản trị viên thất bại với định danh: {Input}", input);
            return Unauthorized(new AdminAuthResponse
            {
                Success = false,
                Message = "Tên đăng nhập hoặc mật khẩu quản trị viên không chính xác."
            });
        }

        // 3. Khởi tạo phiên đăng nhập Quản trị viên với Scheme AdminScheme
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, adminId),
            new Claim(ClaimTypes.Name, adminUsername),
            new Claim(ClaimTypes.Email, adminEmail),
            new Claim(ClaimTypes.Role, "Admin"),
            new Claim("IsAdmin", "true")
        };

        var identity = new ClaimsIdentity(claims, "AdminScheme");
        var principal = new ClaimsPrincipal(identity);

        var authProperties = new AuthenticationProperties
        {
            IsPersistent = request.RememberMe,
            ExpiresUtc = DateTimeOffset.UtcNow.AddHours(request.RememberMe ? 72 : 12),
            IssuedUtc = DateTimeOffset.UtcNow
        };

        await HttpContext.SignInAsync("AdminScheme", principal, authProperties);

        _logger.LogInformation("Quản trị viên '{Username}' đã đăng nhập thành công vào hệ thống.", adminUsername);

        return Ok(new AdminAuthResponse
        {
            Success = true,
            Message = "Đăng nhập Quản trị viên thành công.",
            Admin = new AdminProfileDto
            {
                Id = adminId,
                Username = adminUsername,
                Email = adminEmail,
                Role = "Admin",
                LoggedInAt = DateTime.UtcNow
            }
        });
    }

    /// <summary>
    /// Đăng xuất khỏi phiên quản trị viên
    /// </summary>
    [HttpPost("logout")]
    [HttpGet("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync("AdminScheme");
        await HttpContext.SignOutAsync(IdentityConstants.ApplicationScheme);

        // Xóa Cookie QuizCard_Admin_Token khỏi trình duyệt
        Response.Cookies.Delete("QuizCard_Admin_Token", new CookieOptions
        {
            Path = "/",
            HttpOnly = true,
            SameSite = SameSiteMode.Lax
        });
        Response.Cookies.Delete("QuizCard_Admin_Token");

        return Ok(new
        {
            success = true,
            message = "Đã đăng xuất khỏi tài khoản Quản trị viên thành công."
        });
    }

    /// <summary>
    /// Kiểm tra trạng thái phiên làm việc hiện tại của Quản trị viên
    /// </summary>
    [HttpGet("status")]
    [HttpGet("me")]
    [AllowAnonymous]
    public async Task<IActionResult> GetStatus()
    {
        var authResult = await HttpContext.AuthenticateAsync("AdminScheme");
        if (!authResult.Succeeded || authResult.Principal == null)
        {
            return Ok(new
            {
                isAuthenticated = false,
                message = "Chưa đăng nhập quyền Quản trị viên."
            });
        }

        var principal = authResult.Principal;
        var isAdmin = principal.IsInRole("Admin") || principal.HasClaim(ClaimTypes.Role, "Admin");

        if (!isAdmin)
        {
            return Ok(new
            {
                isAuthenticated = false,
                message = "Tài khoản hiện tại không có quyền Quản trị viên."
            });
        }

        return Ok(new
        {
            isAuthenticated = true,
            admin = new AdminProfileDto
            {
                Id = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? "",
                Username = principal.FindFirstValue(ClaimTypes.Name) ?? "admin",
                Email = principal.FindFirstValue(ClaimTypes.Email) ?? "",
                Role = "Admin",
                LoggedInAt = DateTime.UtcNow
            }
        });
    }
}

