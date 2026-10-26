using System.ComponentModel.DataAnnotations;

namespace QuizCard.Entities;

/// <summary>
/// Thực thể lưu lịch sử điểm danh của người dùng để tính điểm năng lượng và duy trì chuỗi lửa (Streak).
/// Hỗ trợ cả tài khoản thành viên (UserId) và người dùng vãng lai (GuestId).
/// </summary>
public class Attendance
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// ID tài khoản người dùng đăng nhập (ApplicationUser.Id). Null nếu chưa đăng nhập.
    /// </summary>
    public Guid? UserId { get; set; }

    /// <summary>
    /// Định danh trình duyệt khách (Guest ID) lưu trong localStorage khi chưa đăng nhập.
    /// </summary>
    [MaxLength(100)]
    public string? GuestId { get; set; }

    /// <summary>
    /// Ngày điểm danh (chỉ lấy phần Date: YYYY-MM-DD 00:00:00).
    /// </summary>
    public DateTime CheckInDate { get; set; }

    /// <summary>
    /// Chuỗi ngày điểm danh liên tục ghi nhận tại ngày này.
    /// </summary>
    public int StreakCount { get; set; } = 1;

    /// <summary>
    /// Số điểm năng lượng nhận được từ lần điểm danh này (mặc định +10 điểm, thưởng thêm theo chuỗi).
    /// </summary>
    public int PointsEarned { get; set; } = 10;

    /// <summary>
    /// Thời gian chính xác khi người dùng thực hiện điểm danh.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

