using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizCard.Entities;
using QuizCard.UI.Areas.Admin.Models;

namespace QuizCard.UI.Areas.Admin.Controllers;

/// <summary>
/// Controller Quản trị viên: Theo dõi, thống kê và quản lý nhật ký yêu cầu (Request Logs) từ người dùng.
/// </summary>
[Area("Admin")]
[Route("api/[area]/logs")]
[ApiController]
[Authorize(AuthenticationSchemes = "AdminScheme", Policy = "AuthorizedForAdmin")]
public class AdminLogsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AdminLogsController> _logger;

    public AdminLogsController(
        ApplicationDbContext context,
        ILogger<AdminLogsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Lấy số liệu phân tích và thống kê nhật ký (Analytics & Performance Stats)
    /// GET /api/admin/logs/stats
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<AdminLogStatsDto>> GetLogStats()
    {
        var todayUtc = DateTime.UtcNow.Date;

        var totalAllTime = await _context.RequestLogs.CountAsync();
        var todayLogs = await _context.RequestLogs
            .AsNoTracking()
            .Where(l => l.CreatedAt >= todayUtc)
            .ToListAsync();

        var totalToday = todayLogs.Count;
        var errorsToday = todayLogs.Count(l => l.StatusCode >= 400);
        var avgDurationToday = totalToday > 0 ? Math.Round(todayLogs.Average(l => l.DurationMs), 2) : 0;
        var successRate = totalToday > 0
            ? Math.Round((double)(totalToday - errorsToday) / totalToday * 100, 1)
            : 100.0;

        // Phân phối theo Method hôm nay
        var byMethod = todayLogs
            .GroupBy(l => l.Method.ToUpperInvariant())
            .ToDictionary(g => g.Key, g => g.Count());

        // Phân phối theo StatusCode hôm nay
        var byStatus = todayLogs
            .GroupBy(l => l.StatusCode.ToString())
            .ToDictionary(g => g.Key, g => g.Count());

        // Top 8 Endpoints được gọi nhiều nhất hôm nay
        var topEndpoints = todayLogs
            .GroupBy(l => new { l.Path, l.Method })
            .Select(g => new TopEndpointDto
            {
                Path = g.Key.Path,
                Method = g.Key.Method,
                TotalCalls = g.Count(),
                AvgDurationMs = Math.Round(g.Average(l => l.DurationMs), 1),
                ErrorCount = g.Count(l => l.StatusCode >= 400)
            })
            .OrderByDescending(e => e.TotalCalls)
            .Take(8)
            .ToList();

        return Ok(new AdminLogStatsDto
        {
            TotalRequestsToday = totalToday,
            TotalRequestsAllTime = totalAllTime,
            TotalErrorsToday = errorsToday,
            AvgDurationMsToday = avgDurationToday,
            SuccessRatePercent = successRate,
            RequestsByMethod = byMethod,
            StatusCodeDistribution = byStatus,
            TopEndpoints = topEndpoints
        });
    }

    /// <summary>
    /// Lấy danh sách nhật ký yêu cầu có phân trang và bộ lọc nâng cao
    /// GET /api/admin/logs?page=1&pageSize=25&search=...&method=...&onlyErrors=true
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedLogsResult<RequestLogDto>>> GetLogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? search = null,
        [FromQuery] string? method = null,
        [FromQuery] int? statusCode = null,
        [FromQuery] bool? onlyErrors = null,
        [FromQuery] Guid? userId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 5) pageSize = 5;
        if (pageSize > 100) pageSize = 100;

        IQueryable<RequestLog> query = _context.RequestLogs.AsNoTracking();

        // 1. Lọc theo từ khóa tìm kiếm
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(l =>
                l.Path.ToLower().Contains(term) ||
                (l.UserEmail != null && l.UserEmail.ToLower().Contains(term)) ||
                (l.IpAddress != null && l.IpAddress.Contains(term)) ||
                (l.ErrorMessage != null && l.ErrorMessage.ToLower().Contains(term)));
        }

        // 2. Lọc theo phương thức HTTP
        if (!string.IsNullOrWhiteSpace(method) && method != "ALL")
        {
            query = query.Where(l => l.Method == method.ToUpperInvariant());
        }

        // 3. Lọc theo mã trạng thái HTTP
        if (statusCode.HasValue)
        {
            query = query.Where(l => l.StatusCode == statusCode.Value);
        }

        // 4. Lọc chỉ lấy các request gặp lỗi (4xx, 5xx)
        if (onlyErrors == true)
        {
            query = query.Where(l => l.StatusCode >= 400);
        }

        // 5. Lọc theo ID người dùng cụ thể
        if (userId.HasValue && userId.Value != Guid.Empty)
        {
            query = query.Where(l => l.UserId == userId.Value);
        }

        // 6. Lọc theo khoảng thời gian
        if (fromDate.HasValue)
        {
            query = query.Where(l => l.CreatedAt >= fromDate.Value);
        }
        if (toDate.HasValue)
        {
            query = query.Where(l => l.CreatedAt <= toDate.Value);
        }

        var totalItems = await query.CountAsync();

        var logs = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new RequestLogDto
            {
                Id = l.Id,
                UserId = l.UserId,
                UserEmail = l.UserEmail,
                IpAddress = l.IpAddress,
                Method = l.Method,
                Path = l.Path,
                QueryString = l.QueryString,
                StatusCode = l.StatusCode,
                DurationMs = l.DurationMs,
                UserAgent = l.UserAgent,
                ErrorMessage = l.ErrorMessage,
                RequestBody = l.RequestBody,
                CreatedAt = l.CreatedAt
            })
            .ToListAsync();

        return Ok(new PagedLogsResult<RequestLogDto>
        {
            Items = logs,
            TotalItems = totalItems,
            Page = page,
            PageSize = pageSize
        });
    }

    /// <summary>
    /// Lấy chi tiết toàn bộ một bản ghi nhật ký (kèm full ErrorMessage và RequestBody)
    /// GET /api/admin/logs/{id}
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<RequestLogDto>> GetLogById(Guid id)
    {
        var log = await _context.RequestLogs
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == id);

        if (log == null)
        {
            return NotFound(new { message = "Không tìm thấy bản ghi nhật ký." });
        }

        return Ok(new RequestLogDto
        {
            Id = log.Id,
            UserId = log.UserId,
            UserEmail = log.UserEmail,
            IpAddress = log.IpAddress,
            Method = log.Method,
            Path = log.Path,
            QueryString = log.QueryString,
            StatusCode = log.StatusCode,
            DurationMs = log.DurationMs,
            UserAgent = log.UserAgent,
            ErrorMessage = log.ErrorMessage,
            RequestBody = log.RequestBody,
            CreatedAt = log.CreatedAt
        });
    }

    /// <summary>
    /// Dọn dẹp nhật ký yêu cầu (Xóa toàn bộ hoặc xóa các bản ghi cũ hơn X ngày)
    /// DELETE /api/admin/logs/clear?days=7
    /// </summary>
    [HttpDelete("clear")]
    public async Task<IActionResult> ClearLogs([FromQuery] int? days = null)
    {
        int deletedCount;

        if (days.HasValue && days.Value > 0)
        {
            var thresholdDate = DateTime.UtcNow.AddDays(-days.Value);
            deletedCount = await _context.RequestLogs
                .Where(l => l.CreatedAt < thresholdDate)
                .ExecuteDeleteAsync();

            _logger.LogInformation("Quản trị viên đã dọn dẹp {Count} bản ghi nhật ký cũ hơn {Days} ngày.", deletedCount, days.Value);
        }
        else
        {
            deletedCount = await _context.RequestLogs.ExecuteDeleteAsync();
            _logger.LogInformation("Quản trị viên đã xóa toàn bộ {Count} bản ghi nhật ký yêu cầu.", deletedCount);
        }

        return Ok(new
        {
            success = true,
            deletedCount,
            message = days.HasValue && days.Value > 0
                ? $"Đã xóa thành công {deletedCount} bản ghi nhật ký cũ hơn {days.Value} ngày."
                : $"Đã xóa toàn bộ {deletedCount} bản ghi nhật ký yêu cầu thành công."
        });
    }
}

