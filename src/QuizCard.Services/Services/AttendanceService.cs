using QuizCard.Entities;
using QuizCard.RepositoryContracts;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.AttendanceDTOs;

namespace QuizCard.Services.Services;

/// <summary>
/// Cài đặt nghiệp vụ điểm danh và tính toán chuỗi lửa (Streak), điểm năng lượng tia sét (Energy ⚡).
/// Tuân thủ Clean Architecture (chỉ tương tác dữ liệu qua IAttendanceRepository).
/// </summary>
public class AttendanceService : IAttendanceService
{
    private readonly IAttendanceRepository _attendanceRepository;

    public AttendanceService(IAttendanceRepository attendanceRepository)
    {
        _attendanceRepository = attendanceRepository;
    }

    /// <summary>
    /// Lấy ngày hôm nay theo múi giờ Việt Nam (UTC+7) để đảm bảo chuyển ngày chuẩn xác lúc 00:00.
    /// </summary>
    private static DateTime GetToday() => DateTime.UtcNow.AddHours(7).Date;

    /// <summary>
    /// Tính số điểm năng lượng tia sét (⚡) được thưởng theo mốc chuỗi điểm danh liên tục.
    /// Nghiệp vụ: Thay vì ngày nào cũng được cộng tia sét, chỉ những ngày đạt mốc streak nhất định mới được thưởng tia sét.
    /// </summary>
    public static int GetStreakRewardPoints(int streak)
    {
        return streak switch
        {
            3 => 1,    // Mốc chuỗi 3 ngày: +1 tia sét ⚡
            5 => 2,    // Mốc chuỗi 5 ngày: +2 tia sét ⚡
            7 => 3,    // Mốc chuỗi 7 ngày (1 tuần): +3 tia sét ⚡
            10 => 5,   // Mốc chuỗi 10 ngày: +5 tia sét ⚡
            14 => 8,   // Mốc chuỗi 14 ngày (2 tuần): +8 tia sét ⚡
            21 => 12,  // Mốc chuỗi 21 ngày (3 tuần): +12 tia sét ⚡
            30 => 20,  // Mốc chuỗi 30 ngày (1 tháng): +20 tia sét ⚡
            60 => 35,  // Mốc chuỗi 60 ngày: +35 tia sét ⚡
            100 => 50, // Mốc chuỗi 100 ngày: +50 tia sét ⚡
            _ when streak > 30 && streak % 30 == 0 => 20, // Mỗi 30 ngày tiếp theo
            _ when streak > 7 && streak % 7 == 0 => 3,    // Mỗi tuần tiếp theo
            _ => 0     // Các ngày bình thường: 0 tia sét (chỉ giữ chuỗi lửa)
        };
    }

    public async Task<AttendanceStatusDto> GetStatusAsync(Guid? userId)
    {
        var today = GetToday();
        var attendances = await _attendanceRepository.GetAllByUserAsync(userId);

        var dateSet = new HashSet<DateTime>(attendances.Select(a => a.CheckInDate.Date));
        bool hasCheckedInToday = dateSet.Contains(today);

        // 1. Tính chuỗi lửa hiện tại (Current Streak)
        int currentStreak = CalculateCurrentStreak(dateSet, today);

        // 2. Tính chuỗi lửa dài nhất từng đạt được (Longest Streak)
        int longestStreak = CalculateLongestStreak(dateSet);

        // 3. Tính tổng điểm năng lượng tia sét (Khởi điểm 20 điểm + các điểm thưởng mốc chuỗi đã nhận)
        int baseEnergy = 20;
        int earnedEnergy = attendances.Sum(a => a.PointsEarned);
        int totalEnergy = baseEnergy + earnedEnergy;

        // 4. Danh sách các ngày điểm danh dạng chuỗi "YYYY-MM-DD"
        var checkedInDates = dateSet
            .OrderBy(d => d)
            .Select(d => d.ToString("yyyy-MM-dd"))
            .ToList();

        var lastDate = attendances.FirstOrDefault()?.CheckInDate;

        return new AttendanceStatusDto(
            CurrentStreak: currentStreak,
            LongestStreak: longestStreak,
            EnergyPoints: totalEnergy,
            HasCheckedInToday: hasCheckedInToday,
            LastCheckInDate: lastDate,
            CheckedInDates: checkedInDates
        );
    }

    public async Task<CheckInResultDto> CheckInAsync(CheckInRequest request)
    {
        var today = GetToday();
        var yesterday = today.AddDays(-1);

        // Kiểm tra xem hôm nay đã điểm danh chưa
        var existing = await _attendanceRepository.GetByDateAsync(request.UserId, today);
        if (existing != null)
        {
            var status = await GetStatusAsync(request.UserId);
            return new CheckInResultDto(
                Success: true,
                Message: "Hôm nay bạn đã điểm danh và giữ chuỗi lửa rồi! Hãy quay lại vào ngày mai nhé.",
                CurrentStreak: status.CurrentStreak,
                EnergyPoints: status.EnergyPoints,
                PointsEarned: 0,
                IsNewCheckIn: false,
                CheckInDate: today
            );
        }

        // Lấy lịch sử để tính chuỗi ngày liên tiếp
        var attendances = await _attendanceRepository.GetAllByUserAsync(request.UserId);
        var dateSet = new HashSet<DateTime>(attendances.Select(a => a.CheckInDate.Date));

        int newStreak = 1;
        if (dateSet.Contains(yesterday))
        {
            // Điểm danh hôm qua -> Chuỗi tăng thêm 1
            newStreak = CalculateCurrentStreak(dateSet, yesterday) + 1;
        }

        // Điểm thưởng tia sét: Chỉ các ngày đạt mốc mới được cộng tia sét
        int pointsEarned = GetStreakRewardPoints(newStreak);

        var newRecord = new Attendance
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            GuestId = request.GuestId,
            CheckInDate = today,
            StreakCount = newStreak,
            PointsEarned = pointsEarned,
            CreatedAt = DateTime.UtcNow
        };

        await _attendanceRepository.CreateAsync(newRecord);

        // Tính lại tổng điểm
        int totalEnergy = attendances.Sum(a => a.PointsEarned) + pointsEarned;

        string message = pointsEarned > 0
            ? $"Tuyệt vời! Bạn đã đạt mốc chuỗi {newStreak} ngày liên tiếp và được thưởng +{pointsEarned} tia sét ⚡!"
            : $"Điểm danh thành công! Chuỗi lửa của bạn đạt {newStreak} ngày liên tục 🔥. Hãy tiếp tục duy trì để mở khóa mốc thưởng tia sét tiếp theo!";

        return new CheckInResultDto(
            Success: true,
            Message: message,
            CurrentStreak: newStreak,
            EnergyPoints: totalEnergy,
            PointsEarned: pointsEarned,
            IsNewCheckIn: true,
            CheckInDate: today
        );
    }

    private static int CalculateCurrentStreak(HashSet<DateTime> dateSet, DateTime referenceDate)
    {
        int streak = 0;
        var checkDate = referenceDate;

        while (dateSet.Contains(checkDate))
        {
            streak++;
            checkDate = checkDate.AddDays(-1);
        }

        return streak;
    }

    private static int CalculateLongestStreak(HashSet<DateTime> dateSet)
    {
        if (dateSet.Count == 0) return 0;

        var sortedDates = dateSet.OrderBy(d => d).ToList();
        int maxStreak = 1;
        int current = 1;

        for (int i = 1; i < sortedDates.Count; i++)
        {
            if (sortedDates[i] == sortedDates[i - 1].AddDays(1))
            {
                current++;
                if (current > maxStreak) maxStreak = current;
            }
            else
            {
                current = 1;
            }
        }

        return maxStreak;
    }
}
