using System.Net;
using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace QuizCard.UI.StartupExtensions;

/// <summary>
/// Lớp mở rộng cấu hình Rate Limiting (Giới hạn tần suất gửi yêu cầu) cho hệ thống QuizCard.
/// Ngăn chặn spam request liên tục, chống brute-force và bảo vệ tài nguyên máy chủ.
/// </summary>
public static class ConfigureRateLimitingExtension
{
    public const string PolicyGlobal = "global_sliding_policy";
    public const string PolicyAuth = "auth_strict_policy";
    public const string PolicySearch = "search_policy";

    public static IServiceCollection ConfigureRateLimiting(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddRateLimiter(options =>
        {
            // Thiết lập mã trạng thái từ chối mặc định là 429 (Too Many Requests)
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            // Xử lý sự kiện khi một yêu cầu bị vượt quá giới hạn tần suất
            options.OnRejected = async (context, token) =>
            {
                context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.HttpContext.Response.ContentType = "application/json; charset=utf-8";

                var retryAfterSeconds = 15;
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfterSpan))
                {
                    retryAfterSeconds = (int)Math.Max(1, Math.Ceiling(retryAfterSpan.TotalSeconds));
                }

                context.HttpContext.Response.Headers.RetryAfter = retryAfterSeconds.ToString();

                var clientIp = GetClientIp(context.HttpContext);
                var path = context.HttpContext.Request.Path.Value;

                var errorResponse = new
                {
                    statusCode = 429,
                    error = "Too Many Requests",
                    message = "Bạn đang gửi yêu cầu quá nhanh và liên tục. Vui lòng chờ ít giây rồi thử lại.",
                    retryAfterSeconds = retryAfterSeconds,
                    timestamp = DateTime.UtcNow
                };

                await context.HttpContext.Response.WriteAsJsonAsync(errorResponse, cancellationToken: token);
            };

            // =========================================================================
            // 1. GLOBAL LIMITER: Áp dụng tự động cho toàn bộ các API (/api/...)
            // Thuật toán: Sliding Window (Cửa sổ trượt) chia theo UserID hoặc Client IP
            // Tối đa 60 requests / 1 phút (chia thành 6 phân đoạn x 10 giây)
            // =========================================================================
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
            {
                var path = httpContext.Request.Path.Value ?? string.Empty;

                // Bỏ qua các file tĩnh hoặc request không bắt đầu bằng /api
                if (!path.StartsWith("/api", StringComparison.OrdinalIgnoreCase))
                {
                    return RateLimitPartition.GetNoLimiter("StaticFiles");
                }

                // Không áp dụng cho chính API admin quản lý logs
                if (path.StartsWith("/api/admin/logs", StringComparison.OrdinalIgnoreCase))
                {
                    return RateLimitPartition.GetNoLimiter("AdminLogs");
                }

                // Định danh người dùng theo UserId nếu đã đăng nhập, hoặc Client IP nếu là khách
                var userId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
                var partitionKey = !string.IsNullOrEmpty(userId)
                    ? $"user_{userId}"
                    : $"ip_{GetClientIp(httpContext)}";

                return RateLimitPartition.GetSlidingWindowLimiter(
                    partitionKey,
                    _ => new SlidingWindowRateLimiterOptions
                    {
                        PermitLimit = 60, // Tối đa 60 requests / 1 phút cho mỗi client
                        Window = TimeSpan.FromMinutes(1),
                        SegmentsPerWindow = 6, // Mỗi segment 10 giây
                        QueueLimit = 0 // Từ chối ngay lập tức, không xếp hàng đợi
                    });
            });

            // =========================================================================
            // 2. AUTH STRICT POLICY: Giới hạn nghiêm ngặt cho các thao tác Đăng nhập
            // Ngăn chặn dò mật khẩu (Brute-force): Tối đa 10 lần thử / 1 phút
            // =========================================================================
            options.AddPolicy(PolicyAuth, httpContext =>
            {
                var partitionKey = $"auth_{GetClientIp(httpContext)}";

                return RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey,
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 10,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0
                    });
            });

            // =========================================================================
            // 3. SEARCH POLICY: Giới hạn tần suất tìm kiếm / lọc nhanh
            // Tối đa 30 requests / 1 phút
            // =========================================================================
            options.AddPolicy(PolicySearch, httpContext =>
            {
                var partitionKey = $"search_{GetClientIp(httpContext)}";

                return RateLimitPartition.GetSlidingWindowLimiter(
                    partitionKey,
                    _ => new SlidingWindowRateLimiterOptions
                    {
                        PermitLimit = 30,
                        Window = TimeSpan.FromMinutes(1),
                        SegmentsPerWindow = 6,
                        QueueLimit = 0
                    });
            });
        });

        return services;
    }

    /// <summary>
    /// Lấy địa chỉ IP thực tế của máy khách (xử lý proxy, X-Forwarded-For)
    /// </summary>
    private static string GetClientIp(HttpContext context)
    {
        var ip = context.Request.Headers["X-Forwarded-For"].FirstOrDefault()
              ?? context.Request.Headers["X-Real-IP"].FirstOrDefault()
              ?? context.Connection.RemoteIpAddress?.ToString();

        if (string.IsNullOrWhiteSpace(ip))
        {
            return "127.0.0.1";
        }

        if (ip.Contains(','))
        {
            ip = ip.Split(',')[0].Trim();
        }

        return ip;
    }
}

