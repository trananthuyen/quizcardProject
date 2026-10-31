using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.TrashDTOs;
using System.Security.Claims;

namespace QuizCard.UI.Controllers;

/// <summary>
/// RESTful API Controller quản lý Thùng rác (Trash):
/// - GET    /api/trash                      : Lấy danh sách các bộ thẻ và thẻ trong thùng rác
/// - GET    /api/trash/decks/{id}           : Xem chi tiết bộ thẻ trong thùng rác kèm danh sách thẻ
/// - POST   /api/trash/decks/{id}/restore   : Khôi phục bộ thẻ và toàn bộ thẻ con về hoạt động
/// - DELETE /api/trash/decks/{id}/permanent : Xóa vĩnh viễn bộ thẻ khỏi hệ thống
/// - DELETE /api/trash/empty                : Xóa sạch toàn bộ thùng rác
/// - POST   /api/trash/cards/{id}/restore   : Khôi phục thẻ đơn lẻ
/// - DELETE /api/trash/cards/{id}/permanent : Xóa vĩnh viễn thẻ đơn lẻ
/// </summary>
[ApiController]
[Route("api/trash")]
[Authorize("AuthorizedForUser")]
public class TrashController : ControllerBase
{
    private readonly ITrashService _trashService;

    public TrashController(ITrashService trashService)
    {
        _trashService = trashService;
    }

    /// <summary>
    /// Lấy danh sách các bộ thẻ và thẻ nằm trong Thùng rác.
    /// Tự động xóa sạch những mục đã quá 5 ngày trước khi trả về.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult> GetTrashItems([FromQuery] Guid? userId = null)
    {
        var targetUserId = ResolveUserId(userId);
        var decks = await _trashService.GetTrashDecksAsync(targetUserId);
        var cards = await _trashService.GetTrashCardsAsync(targetUserId);

        return Ok(new
        {
            decks,
            cards,
            totalItems = decks.Count + cards.Count
        });
    }

    /// <summary>
    /// Xem chi tiết một bộ thẻ trong thùng rác kèm danh sách các thẻ con.
    /// </summary>
    [HttpGet("decks/{id:guid}")]
    public async Task<ActionResult<DeletedDeckDto>> GetTrashDeckById(Guid id)
    {
        var deck = await _trashService.GetTrashDeckByIdAsync(id);
        if (deck is null) return NotFound(new { message = "Không tìm thấy bộ thẻ trong thùng rác hoặc đã hết hạn 5 ngày." });

        return Ok(deck);
    }

    /// <summary>
    /// Khôi phục một bộ thẻ từ thùng rác trở lại danh sách học tập.
    /// </summary>
    [HttpPost("decks/{id:guid}/restore")]
    public async Task<IActionResult> RestoreDeck(Guid id)
    {
        var success = await _trashService.RestoreDeckAsync(id);
        if (!success)
        {
            return NotFound(new { message = "Không tìm thấy bộ thẻ trong thùng rác để khôi phục." });
        }

        return Ok(new { message = "Khôi phục bộ thẻ thành công!" });
    }

    /// <summary>
    /// Xóa vĩnh viễn một bộ thẻ khỏi thùng rác. Không thể khôi phục sau khi xóa.
    /// </summary>
    [HttpDelete("decks/{id:guid}/permanent")]
    public async Task<IActionResult> PermanentlyDeleteDeck(Guid id)
    {
        var success = await _trashService.PermanentlyDeleteDeckAsync(id);
        if (!success)
        {
            return NotFound(new { message = "Không tìm thấy bộ thẻ trong thùng rác." });
        }

        return Ok(new { message = "Đã xóa vĩnh viễn bộ thẻ." });
    }

    /// <summary>
    /// Dọn sạch toàn bộ thùng rác của người dùng.
    /// </summary>
    [HttpDelete("empty")]
    public async Task<IActionResult> EmptyTrash([FromQuery] Guid? userId = null)
    {
        var targetUserId = ResolveUserId(userId);
        await _trashService.EmptyTrashAsync(targetUserId);
        return Ok(new { message = "Đã dọn sạch thùng rác thành công!" });
    }

    /// <summary>
    /// Khôi phục thẻ flashcard đơn lẻ về bộ thẻ gốc.
    /// </summary>
    [HttpPost("cards/{id:guid}/restore")]
    public async Task<IActionResult> RestoreCard(Guid id)
    {
        var success = await _trashService.RestoreCardAsync(id);
        if (!success)
        {
            return BadRequest(new { message = "Không thể khôi phục thẻ (bộ thẻ gốc có thể đã bị xóa)." });
        }

        return Ok(new { message = "Khôi phục thẻ flashcard thành công!" });
    }

    /// <summary>
    /// Xóa vĩnh viễn một thẻ flashcard đơn lẻ.
    /// </summary>
    [HttpDelete("cards/{id:guid}/permanent")]
    public async Task<IActionResult> PermanentlyDeleteCard(Guid id)
    {
        var success = await _trashService.PermanentlyDeleteCardAsync(id);
        if (!success)
        {
            return NotFound(new { message = "Không tìm thấy thẻ trong thùng rác." });
        }

        return Ok(new { message = "Đã xóa vĩnh viễn thẻ flashcard." });
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

