using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.AttendanceDTOs;

namespace QuizCard.UI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService _attendanceService;

    public AttendanceController(IAttendanceService attendanceService)
    {
        _attendanceService = attendanceService;
    }

    /// <summary>
    /// Lấy trạng thái điểm danh hiện tại, chuỗi ngày liên tục (streak) và danh sách các ngày đã điểm danh.
    /// Cho phép truy cập khi chưa đăng nhập để xem thông tin mặc định.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("status")]
    public async Task<ActionResult<AttendanceStatusDto>> GetStatus([FromQuery] Guid? userId)
    {
        var status = await _attendanceService.GetStatusAsync(userId);
        return Ok(status);
    }

    /// <summary>
    /// Thực hiện điểm danh trong ngày cho người dùng để nhận điểm năng lượng và duy trì chuỗi lửa.
    /// Bắt buộc người dùng phải đăng nhập trước (chặn người dùng vãng lai / guest).
    /// </summary>
    [Authorize("AuthorizedForUser")]
    [HttpPost("check-in")]
    public async Task<ActionResult<CheckInResultDto>> CheckIn([FromBody] CheckInRequest request)
    {
        if (!request.UserId.HasValue || request.UserId.Value == Guid.Empty)
        {
            return Unauthorized(new { message = "Vui lòng đăng nhập tài khoản trước khi thực hiện điểm danh." });
        }

        var result = await _attendanceService.CheckInAsync(request);
        return Ok(result);
    }
}
