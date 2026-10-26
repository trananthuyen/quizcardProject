using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.DeckDTOs;
using System.Security.Claims;

namespace QuizCard.UI.Controllers;

/// <summary>
/// RESTful API Controller quản lý Bộ thẻ (Decks):
/// Cung cấp các endpoints cho Frontend gọi qua HTTP:
/// - GET    /api/decks        : Lấy danh sách tất cả các bộ thẻ (có thể lọc theo category hoặc userId)
/// - GET    /api/decks/{id}   : Lấy chi tiết một bộ thẻ
/// - POST   /api/decks        : Tạo một bộ thẻ mới (gán UserId người tạo)
/// - PUT    /api/decks/{id}   : Cập nhật thông tin bộ thẻ
/// - DELETE /api/decks/{id}   : Xóa bộ thẻ
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class DecksController : ControllerBase
{
    private readonly IDeckService _deckService;

    public DecksController(IDeckService deckService)
    {
        _deckService = deckService;
    }

    /// <summary>
    /// 1. Endpoint: Lấy tất cả các bộ thẻ hiển thị ở Community (Cộng đồng).
    /// GET /api/decks/community?category=...
    /// </summary>
    [HttpGet("community")]
    public async Task<ActionResult<IEnumerable<DeckDto>>> GetCommunity([FromQuery] string? category = null)
    {
        var decks = await _deckService.GetCommunityDecksAsync(category);
        return Ok(decks);
    }

    /// <summary>
    /// 2. Endpoint: Lấy danh sách bộ thẻ thuộc sở hữu của người dùng hiện tại ở My Resources (Kho học liệu).
    /// GET /api/decks/my-resources?userId=...&category=...
    /// Nếu chưa đăng nhập hoặc không có userId, trả về mảng rỗng.
    /// </summary>
    [Authorize("AuthorizedForUser")]
    [HttpGet("my-resources")]
    public async Task<ActionResult<IEnumerable<DeckDto>>> GetMyResources([FromQuery] Guid? userId = null, [FromQuery] string? category = null)
    {
        Guid targetUserId = userId ?? Guid.Empty;
        if (targetUserId == Guid.Empty)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(userIdClaim, out var parsedGuid))
            {
                targetUserId = parsedGuid;
            }
        }

        if (targetUserId == Guid.Empty)
        {
            return Ok(Enumerable.Empty<DeckDto>());
        }

        var decks = await _deckService.GetUserDecksAsync(targetUserId, category);
        return Ok(decks);
    }

    /// <summary>
    /// Endpoint: Lấy danh sách các bộ thẻ cùng thống kê tiến độ học.
    /// Hỗ trợ lọc theo thể loại: ?category=... hoặc theo người sở hữu: ?userId=...
    /// Trả về: HTTP 200 OK + mảng JSON các DeckDto.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DeckDto>>> GetAll([FromQuery] string? category = null, [FromQuery] Guid? userId = null)
    {
        var decks = await _deckService.GetAllDecksAsync(category, userId);
        return Ok(decks);
    }

    /// <summary>
    /// Endpoint: Lấy chi tiết một bộ thẻ theo Id.
    /// Trả về: HTTP 200 OK nếu tìm thấy, hoặc HTTP 404 NotFound nếu không tồn tại.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DeckDto>> GetById(Guid id)
    {
        var deck = await _deckService.GetDeckByIdAsync(id);
        if (deck is null) return NotFound(new { message = "Không tìm thấy bộ thẻ" });
        return Ok(deck);
    }

    /// <summary>
    /// Endpoint: Tạo một bộ thẻ mới (tự động gán UserId người tạo từ request hoặc Claims).
    /// Trả về: HTTP 201 Created + header Location trỏ tới URL bộ thẻ vừa tạo.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<DeckDto>> Create([FromBody] CreateDeckRequest request)
    {
        // Kiểm tra hợp lệ của dữ liệu đầu vào (Data Annotations)
        if (!ModelState.IsValid) return BadRequest(ModelState);

        Guid? userId = request.UserId;
        if (!userId.HasValue || userId == Guid.Empty)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(userIdClaim, out var parsedGuid))
            {
                userId = parsedGuid;
            }
        }

        var deckWithUser = request with { UserId = userId };
        var created = await _deckService.CreateDeckAsync(deckWithUser);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>
    /// Endpoint: Cập nhật tên hoặc mô tả của một bộ thẻ.
    /// Trả về: HTTP 200 OK kèm dữ liệu đã sửa, hoặc HTTP 404 NotFound.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<DeckDto>> Update(Guid id, [FromBody] UpdateDeckRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var updated = await _deckService.UpdateDeckAsync(id, request);
        if (updated is null) return NotFound(new { message = "Không tìm thấy bộ thẻ cần cập nhật" });
        return Ok(updated);
    }

    /// <summary>
    /// Endpoint: Xóa hoàn toàn một bộ thẻ và toàn bộ thẻ Flashcard bên trong nó (Cascade Delete).
    /// Trả về: HTTP 204 No Content nếu xóa thành công, hoặc HTTP 404 NotFound nếu không tìm thấy bộ thẻ.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _deckService.DeleteDeckAsync(id);
        if (!success) return NotFound(new { message = "Không tìm thấy bộ thẻ cần xóa" });
        return NoContent();
    }
}
