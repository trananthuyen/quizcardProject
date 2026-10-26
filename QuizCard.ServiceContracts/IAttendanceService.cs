using QuizCard.ServiceContracts.DTOs.AttendanceDTOs;

namespace QuizCard.ServiceContracts;

/// <summary>
/// Hợp đồng dịch vụ quản lý điểm danh, tính toán chuỗi lửa (Streak) và điểm năng lượng (Energy Points).
/// </summary>
public interface IAttendanceService
{
    /// <summary>
    /// Lấy thông tin trạng thái chuỗi lửa, năng lượng và lịch sử các ngày điểm danh.
    /// </summary>
    Task<AttendanceStatusDto> GetStatusAsync(Guid? userId);

    /// <summary>
    /// Thực hiện điểm danh trong ngày cho người dùng để duy trì/tăng chuỗi lửa.
    /// </summary>
    Task<CheckInResultDto> CheckInAsync(CheckInRequest request);
}

