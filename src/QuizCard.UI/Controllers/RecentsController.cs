using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.RecentDTOs;

namespace QuizCard.UI.Controllers;

/// <summary>
/// RESTful API Controller quản lý danh sách các Bộ thẻ đã xem hoặc học gần đây (Recents).
/// - GET    /api/recents                 : Lấy danh sách bộ thẻ gần đây của người dùng
/// - POST   /api/recents                 : Ghi nhận hoặc cập nhật lịch sử xem/học
/// - DELETE /api/recents/{id}            : Xóa 1 bản ghi gần đây theo ID
/// - DELETE /api/recents/deck/{deckId}   : Xóa bộ thẻ khỏi danh sách gần đây
/// - DELETE /api/recents/clear           : Xóa toàn bộ lịch sử gần đây của người dùng
/// </summary>
[ApiController]
[Route("api/recents")]
[Authorize("AllowAccessWithoutAuthorized")]
public class RecentsController : ControllerBase
{
    private readonly IRecentsService _recentsService;

    public RecentsController(IRecentsService recentsService)
    {
        _recentsService = recentsService;
    }

    /// <summary>
    /// Lấy danh sách các bộ thẻ gần đây của người dùng.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<RecentDeckDto>>> GetRecents(
        [FromQuery] Guid? userId = null,
        [FromQuery] int limit = 50)
    {
        var targetUserId = ResolveUserId(userId);
        if (!targetUserId.HasValue)
        {
            // Nếu người dùng chưa đăng nhập, trả về danh sách rỗng (khách sẽ dùng localStorage ở frontend)
            return Ok(new List<RecentDeckDto>());
        }

        var recents = await _recentsService.GetRecentsAsync(targetUserId.Value, limit);
        return Ok(recents);
    }

    /// <summary>
    /// Ghi nhận hoặc cập nhật lịch sử xem/học bộ thẻ cho người dùng đã đăng nhập.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<RecentDeckDto>> RecordRecent([FromBody] RecordRecentRequest request)
    {
        var targetUserId = ResolveUserId(request.UserId);
        if (!targetUserId.HasValue)
        {
            return BadRequest(new { message = "Cần đăng nhập để lưu lịch sử vào cơ sở dữ liệu." });
        }

        if (request.DeckId == Guid.Empty)
        {
            return BadRequest(new { message = "Mã bộ thẻ DeckId không hợp lệ." });
        }

        try
        {
            var result = await _recentsService.RecordRecentAsync(request.DeckId, targetUserId.Value, request.ActionType);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Xóa 1 mục khỏi danh sách gần đây theo ID.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> RemoveRecent(Guid id, [FromQuery] Guid? userId = null)
    {
        var targetUserId = ResolveUserId(userId);
        var success = await _recentsService.RemoveRecentAsync(id, targetUserId);
        if (!success)
        {
            return NotFound(new { message = "Không tìm thấy bản ghi trong danh sách gần đây." });
        }

        return Ok(new { message = "Đã xóa khỏi danh sách gần đây." });
    }

    /// <summary>
    /// Xóa bộ thẻ khỏi danh sách gần đây theo DeckId.
    /// </summary>
    [HttpDelete("deck/{deckId:guid}")]
    public async Task<IActionResult> RemoveRecentByDeck(Guid deckId, [FromQuery] Guid? userId = null)
    {
        var targetUserId = ResolveUserId(userId);
        var success = await _recentsService.RemoveRecentByDeckAsync(deckId, targetUserId);
        if (!success)
        {
            return NotFound(new { message = "Không tìm thấy bộ thẻ trong danh sách gần đây." });
        }

        return Ok(new { message = "Đã xóa bộ thẻ khỏi danh sách gần đây." });
    }

    /// <summary>
    /// Xóa toàn bộ danh sách bộ thẻ gần đây của người dùng.
    /// </summary>
    [HttpDelete("clear")]
    public async Task<IActionResult> ClearAllRecents([FromQuery] Guid? userId = null)
    {
        var targetUserId = ResolveUserId(userId);
        await _recentsService.ClearAllRecentsAsync(targetUserId);
        return Ok(new { message = "Đã xóa toàn bộ lịch sử xem/học gần đây." });
    }

    private Guid? ResolveUserId(Guid? queryUserId)
    {
        if (queryUserId.HasValue && queryUserId.Value != Guid.Empty)
        {
            return queryUserId;
        }

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(userIdClaim, out var parsedGuid))
        {
            return parsedGuid;
        }

        return null;
    }
}
