using Microsoft.EntityFrameworkCore;
using QuizCard.Entities;
using QuizCard.RepositoryContracts;

namespace QuizCard.Repositories;

/// <summary>
/// Lớp triển khai các thao tác truy vấn và lưu trữ lịch sử điểm danh vào CSDL MySQL thông qua ApplicationDbContext.
/// Tuân thủ Clean Architecture (chỉ tầng Repositories được truy cập ApplicationDbContext).
/// </summary>
public class AttendanceRepository : IAttendanceRepository
{
    private readonly ApplicationDbContext _db;

    public AttendanceRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Attendance?> GetByDateAsync(Guid? userId, DateTime date)
    {
        var targetDate = date.Date;

        if (userId.HasValue && userId.Value != Guid.Empty)
        {
            return await _db.Attendances
                .FirstOrDefaultAsync(a => a.UserId == userId.Value && a.CheckInDate == targetDate);
        }

        return null;
    }

    public async Task<List<Attendance>> GetAllByUserAsync(Guid? userId)
    {
        if (userId.HasValue && userId.Value != Guid.Empty)
        {
            return await _db.Attendances
                .Where(a => a.UserId == userId.Value)
                .OrderByDescending(a => a.CheckInDate)
                .ToListAsync();
        }

        return new List<Attendance>();
    }

    public async Task<List<Attendance>> GetHistoryInMonthAsync(Guid? userId, int year, int month)
    {
        var startOfMonth = new DateTime(year, month, 1);
        var endOfMonth = startOfMonth.AddMonths(1);

        if (userId.HasValue && userId.Value != Guid.Empty)
        {
            return await _db.Attendances
                .Where(a => a.UserId == userId.Value && a.CheckInDate >= startOfMonth && a.CheckInDate < endOfMonth)
                .OrderBy(a => a.CheckInDate)
                .ToListAsync();
        }

        return new List<Attendance>();
    }

    public async Task<Attendance> CreateAsync(Attendance attendance)
    {
        attendance.CheckInDate = attendance.CheckInDate.Date;
        _db.Attendances.Add(attendance);
        await _db.SaveChangesAsync();
        return attendance;
    }

    
}

