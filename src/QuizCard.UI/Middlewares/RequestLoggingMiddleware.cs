using System.Diagnostics;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using QuizCard.Entities;

namespace QuizCard.UI.Middlewares;

/// <summary>
/// Middleware tự động ghi nhận nhật ký (Request Logs) toàn bộ các yêu cầu HTTP từ người dùng gửi tới API.
/// Đo lường thời gian phản hồi, mã trạng thái HTTP, địa chỉ IP, User-Agent và lỗi ngoại lệ nếu có.
/// </summary>
public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    // Các biểu thức chính quy để ẩn mật khẩu hoặc dữ liệu nhạy cảm trong Request Body
    private static readonly Regex PasswordMaskRegex = new(
        @"(""(?:password|pwd|clientSecret|secret|token|accessToken)""\s*:\s*"")[^""]*("")",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public RequestLoggingMiddleware(
        RequestDelegate next,
        IServiceScopeFactory scopeFactory,
        ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? string.Empty;

        // Chỉ theo dõi các request gọi API (/api/...) và bỏ qua chính API lấy logs để tránh ghi đè đệ quy
        if (!path.StartsWith("/api", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/api/admin/logs", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        var stopwatch = Stopwatch.StartNew();
        string? requestBody = null;
        string? errorMessage = null;

        // Đọc dữ liệu Request Body nếu là POST / PUT / PATCH và là JSON
        if (HttpMethods.IsPost(context.Request.Method) ||
            HttpMethods.IsPut(context.Request.Method) ||
            HttpMethods.IsPatch(context.Request.Method))
        {
            if (context.Request.ContentType?.Contains("application/json", StringComparison.OrdinalIgnoreCase) == true)
            {
                try
                {
                    context.Request.EnableBuffering();
                    using var reader = new StreamReader(
                        context.Request.Body,
                        Encoding.UTF8,
                        detectEncodingFromByteOrderMarks: false,
                        bufferSize: 1024,
                        leaveOpen: true);

                    var body = await reader.ReadToEndAsync();
                    context.Request.Body.Position = 0;

                    if (!string.IsNullOrWhiteSpace(body))
                    {
                        // Giới hạn độ dài tối đa 2000 ký tự và ẩn mật khẩu nếu có
                        if (body.Length > 2000)
                        {
                            body = body[..2000] + "... [TRUNCATED]";
                        }
                        requestBody = PasswordMaskRegex.Replace(body, "$1***$2");
                    }
                }
                catch
                {
                    // Bỏ qua nếu không thể đọc body
                }
            }
        }

        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            errorMessage = $"{ex.GetType().Name}: {ex.Message}\n{ex.StackTrace}";
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            throw;
        }
        finally
        {
            stopwatch.Stop();
            var durationMs = Math.Round(stopwatch.Elapsed.TotalMilliseconds, 2);

            // Thu thập thông tin người dùng từ User Claims
            Guid? userId = null;
            var userIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(userIdClaim, out var parsedGuid))
            {
                userId = parsedGuid;
            }

            var userEmail = context.User.FindFirstValue(ClaimTypes.Email)
                         ?? context.User.Identity?.Name
                         ?? (context.User.FindFirstValue("preferred_username"));

            // Thu thập địa chỉ IP của client (xử lý cả reverse proxy / Cloudflare)
            var ipAddress = context.Request.Headers["X-Forwarded-For"].FirstOrDefault()
                         ?? context.Request.Headers["X-Real-IP"].FirstOrDefault()
                         ?? context.Connection.RemoteIpAddress?.ToString();

            if (ipAddress != null && ipAddress.Contains(','))
            {
                ipAddress = ipAddress.Split(',')[0].Trim();
            }

            var userAgent = context.Request.Headers.UserAgent.ToString();
            if (userAgent.Length > 950)
            {
                userAgent = userAgent[..950];
            }

            var queryString = context.Request.QueryString.HasValue
                ? context.Request.QueryString.Value
                : null;

            if (queryString != null && queryString.Length > 950)
            {
                queryString = queryString[..950];
            }

            // Ghi bản ghi RequestLog vào Database trong Scope riêng biệt
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                    var logEntry = new RequestLog
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        UserEmail = userEmail,
                        IpAddress = ipAddress,
                        Method = context.Request.Method,
                        Path = path.Length > 490 ? path[..490] : path,
                        QueryString = queryString,
                        StatusCode = context.Response.StatusCode,
                        DurationMs = durationMs,
                        UserAgent = userAgent,
                        ErrorMessage = errorMessage,
                        RequestBody = requestBody,
                        CreatedAt = DateTime.UtcNow
                    };

                    db.RequestLogs.Add(logEntry);
                    await db.SaveChangesAsync();
                }
                catch (Exception dbEx)
                {
                    _logger.LogError(dbEx, "Lỗi không thể lưu RequestLog vào Database: {Message}", dbEx.Message);
                }
            });
        }
    }
}

