using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.DeckDTOs;
using System.Security.Claims;

namespace QuizCard.UI.Controllers;

/// <summary>
/// RESTful API Controller quản lý Bộ thẻ (Decks):
/// Cung cấp các endpoints cho Frontend gọi qua HTTP:
/// - GET    /api/decks        : Lấy danh sách tất cả các bộ thẻ (có thể lọc theo folder, tag hoặc userId)
/// - GET    /api/decks/{id}   : Lấy chi tiết một bộ thẻ
/// - POST   /api/decks        : Tạo một bộ thẻ mới (gán UserId người tạo, folder, tag)
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
    /// GET /api/decks/community?folder=...&tag=...
    /// </summary>
    [AllowAnonymous]
    [HttpGet("community")]
    public async Task<ActionResult<IEnumerable<DeckDto>>> GetCommunity([FromQuery] string? folder = null, [FromQuery] string? tag = null)
    {
        var decks = await _deckService.GetCommunityDecksAsync(folder, tag);
        return Ok(decks);
    }

    /// <summary>
    /// 2. Endpoint: Lấy danh sách bộ thẻ thuộc sở hữu của người dùng hiện tại ở My Resources (Kho học liệu).
    /// GET /api/decks/my-resources?userId=...&folder=...&tag=...
    /// Nếu chưa đăng nhập hoặc không có userId, trả về mảng rỗng.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("my-resources")]
    public async Task<ActionResult<IEnumerable<DeckDto>>> GetMyResources([FromQuery] Guid? userId = null, [FromQuery] string? folder = null, [FromQuery] string? tag = null)
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

        var decks = await _deckService.GetUserDecksAsync(targetUserId, folder, tag);
        return Ok(decks);
    }

    /// <summary>
    /// Endpoint: Lấy danh sách các bộ thẻ cùng thống kê tiến độ học.
    /// Hỗ trợ lọc theo thư mục (?folder=...), tag (?tag=...) hoặc theo người sở hữu (?userId=...).
    /// Trả về: HTTP 200 OK + mảng JSON các DeckDto.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DeckDto>>> GetAll([FromQuery] string? folder = null, [FromQuery] Guid? userId = null, [FromQuery] string? tag = null)
    {
        var decks = await _deckService.GetAllDecksAsync(folder, userId, tag);
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
    /// Endpoint: Tạo một bộ thẻ mới (tự động gán UserId người tạo từ request hoặc Claims, folder và tag).
    /// Trả về: HTTP 201 Created + header Location trỏ tới URL bộ thẻ vừa tạo.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<DeckDto>> Create([FromBody] CreateDeckRequest request)
    {
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
    /// Endpoint: Cập nhật tên, mô tả, thư mục hoặc tag của một bộ thẻ.
    /// Chỉ người sở hữu bộ thẻ mới có quyền cập nhật.
    /// Trả về: HTTP 200 OK kèm dữ liệu đã sửa, hoặc HTTP 404/403.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<DeckDto>> Update(Guid id, [FromBody] UpdateDeckRequest request, [FromQuery] Guid? userId = null)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var deck = await _deckService.GetDeckByIdAsync(id);
        if (deck is null) return NotFound(new { message = "Không tìm thấy bộ thẻ cần cập nhật" });

        // Không cho phép sửa bộ thẻ mặc định của hệ thống
        if (deck.UserId == null)
        {
            return BadRequest(new { message = "Không thể chỉnh sửa bộ thẻ mặc định của hệ thống." });
        }

        Guid? currentUserId = userId;
        if (!currentUserId.HasValue)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(userIdClaim, out var parsedGuid))
            {
                currentUserId = parsedGuid;
            }
        }

        if (!currentUserId.HasValue || currentUserId != deck.UserId)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Chỉ người sở hữu bộ thẻ mới có quyền chỉnh sửa bộ thẻ này." });
        }

        var updated = await _deckService.UpdateDeckAsync(id, request);
        if (updated is null) return NotFound(new { message = "Không tìm thấy bộ thẻ cần cập nhật" });
        return Ok(updated);
    }

    /// <summary>
    /// Endpoint: Xóa hoàn toàn một bộ thẻ và toàn bộ thẻ Flashcard bên trong nó (Cascade Delete).
    /// Chỉ người sở hữu bộ thẻ mới có quyền xóa bộ thẻ.
    /// Trả về: HTTP 204 No Content nếu xóa thành công, hoặc HTTP 404/403.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, [FromQuery] Guid? userId = null)
    {
        var deck = await _deckService.GetDeckByIdAsync(id);
        if (deck is null) return NotFound(new { message = "Không tìm thấy bộ thẻ cần xóa" });

        // Không cho phép xóa bộ thẻ mẫu hệ thống
        if (deck.UserId == null)
        {
            return BadRequest(new { message = "Không thể xóa bộ thẻ mặc định của hệ thống." });
        }

        Guid? currentUserId = userId;
        if (!currentUserId.HasValue)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(userIdClaim, out var parsedGuid))
            {
                currentUserId = parsedGuid;
            }
        }

        if (!currentUserId.HasValue || currentUserId != deck.UserId)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Chỉ người sở hữu bộ thẻ mới có quyền xóa bộ thẻ này." });
        }

        var success = await _deckService.DeleteDeckAsync(id);
        if (!success) return NotFound(new { message = "Không tìm thấy bộ thẻ cần xóa" });
        return NoContent();
    }
}
