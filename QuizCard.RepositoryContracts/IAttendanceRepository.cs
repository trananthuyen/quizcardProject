using QuizCard.Entities;

namespace QuizCard.RepositoryContracts;

/// <summary>
/// Giao diện định nghĩa các hợp đồng truy vấn và lưu trữ dữ liệu điểm danh, chuỗi lửa.
/// </summary>
public interface IAttendanceRepository
{
    /// <summary>
    /// Lấy bản ghi điểm danh của người dùng tại một ngày cụ thể (nếu có).
    /// </summary>
    Task<Attendance?> GetByDateAsync(Guid? userId, DateTime date);

    /// <summary>
    /// Lấy toàn bộ lịch sử điểm danh của người dùng, sắp xếp giảm dần theo ngày.
    /// </summary>
    Task<List<Attendance>> GetAllByUserAsync(Guid? userId);

    /// <summary>
    /// Lấy danh sách điểm danh trong một tháng/năm cụ thể để hiển thị trên Lịch điểm danh.
    /// </summary>
    Task<List<Attendance>> GetHistoryInMonthAsync(Guid? userId, int year, int month);

    /// <summary>
    /// Tạo mới một bản ghi điểm danh.
    /// </summary>
    Task<Attendance> CreateAsync(Attendance attendance);

}

