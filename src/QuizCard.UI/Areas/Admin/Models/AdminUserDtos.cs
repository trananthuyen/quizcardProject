namespace QuizCard.UI.Areas.Admin.Models;

/// <summary>
/// Thống kê tổng quan toàn bộ hệ thống dành cho Quản trị viên (Dashboard Stats)
/// </summary>
public class AdminOverviewStatsDto
{
    public int TotalUsers { get; set; }
    public int TotalDecks { get; set; }
    public int TotalCards { get; set; }
    public int TotalSystemDecks { get; set; }
    public int TotalSystemCards { get; set; }
    public int ActiveUsersCount { get; set; }
    public double AverageDecksPerUser { get; set; }
    public double AverageCardsPerDeck { get; set; }
}

/// <summary>
/// Thống kê chi tiết tài khoản người dùng kèm số lượng Decks và Cards sở hữu
/// </summary>
public class AdminUserSummaryDto
{
    public Guid Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? FullName { get; set; }
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = "User";
    public string? Provider { get; set; }
    public DateTime CreatedAt { get; set; }
    public int TotalDecks { get; set; }
    public int TotalCards { get; set; }
    public int PublicDecks { get; set; }
    public int PrivateDecks { get; set; }
    public DateTime? LastDeckCreatedAt { get; set; }
}

/// <summary>
/// Danh sách các bộ thẻ chi tiết thuộc sở hữu của một tài khoản cụ thể
/// </summary>
public class AdminUserDeckDetailDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Folder { get; set; } = "Chung";
    public string? Tag { get; set; }
    public bool IsPublic { get; set; }
    public int TotalCards { get; set; }
    public DateTime CreatedAt { get; set; }
}

