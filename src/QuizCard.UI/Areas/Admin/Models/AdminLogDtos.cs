namespace QuizCard.UI.Areas.Admin.Models;

/// <summary>
/// DTO chi tiết một bản ghi Request Log
/// </summary>
public class RequestLogDto
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string? IpAddress { get; set; }
    public string Method { get; set; } = "GET";
    public string Path { get; set; } = string.Empty;
    public string? QueryString { get; set; }
    public int StatusCode { get; set; }
    public double DurationMs { get; set; }
    public string? UserAgent { get; set; }
    public string? ErrorMessage { get; set; }
    public string? RequestBody { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO thống kê hiệu năng và tần suất yêu cầu hệ thống (Log Analytics)
/// </summary>
public class AdminLogStatsDto
{
    public int TotalRequestsToday { get; set; }
    public int TotalRequestsAllTime { get; set; }
    public int TotalErrorsToday { get; set; }
    public double AvgDurationMsToday { get; set; }
    public double SuccessRatePercent { get; set; }
    public Dictionary<string, int> RequestsByMethod { get; set; } = new();
    public Dictionary<string, int> StatusCodeDistribution { get; set; } = new();
    public List<TopEndpointDto> TopEndpoints { get; set; } = new();
}

public class TopEndpointDto
{
    public string Path { get; set; } = string.Empty;
    public string Method { get; set; } = "GET";
    public int TotalCalls { get; set; }
    public double AvgDurationMs { get; set; }
    public int ErrorCount { get; set; }
}

/// <summary>
/// Cấu trúc phân trang dữ liệu nhật ký
/// </summary>
public class PagedLogsResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalItems { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalItems / PageSize) : 0;
}

