namespace QuizCard.ServiceContracts.DTOs.AttendanceDTOs;

/// <summary>
/// Yêu cầu điểm danh từ client (hỗ trợ cả người dùng đăng nhập và người dùng khách).
/// </summary>
public record CheckInRequest(
    Guid? UserId,
    string? GuestId
);

/// <summary>
/// Kết quả phản hồi sau khi người dùng thực hiện điểm danh.
/// </summary>
public record CheckInResultDto(
    bool Success,
    string Message,
    int CurrentStreak,
    int EnergyPoints,
    int PointsEarned,
    bool IsNewCheckIn,
    DateTime CheckInDate
);

/// <summary>
/// Trạng thái chuỗi lửa, điểm năng lượng và lịch sử điểm danh của người dùng.
/// </summary>
public record AttendanceStatusDto(
    int CurrentStreak,
    int LongestStreak,
    int EnergyPoints,
    bool HasCheckedInToday,
    DateTime? LastCheckInDate,
    List<string> CheckedInDates // Danh sách các ngày điểm danh dạng chuỗi "YYYY-MM-DD"
);

