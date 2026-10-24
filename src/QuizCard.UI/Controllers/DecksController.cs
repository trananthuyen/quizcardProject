using Microsoft.AspNetCore.Mvc;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.DeckDTOs;

namespace QuizCard.UI.Controllers;

/// <summary>
/// RESTful API Controller quản lý Bộ thẻ (Decks):
/// Cung cấp các endpoints cho Frontend gọi qua HTTP:
/// - GET    /api/decks        : Lấy danh sách tất cả các bộ thẻ
/// - GET    /api/decks/{id}   : Lấy chi tiết một bộ thẻ
/// - POST   /api/decks        : Tạo một bộ thẻ mới
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
    /// Endpoint: Lấy danh sách các bộ thẻ cùng thống kê tiến độ học (hỗ trợ lọc theo thể loại: ?category=...).
    /// Trả về: HTTP 200 OK + mảng JSON các DeckDto.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DeckDto>>> GetAll([FromQuery] string? category = null)
    {
        var decks = await _deckService.GetAllDecksAsync(category);
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
    /// Endpoint: Tạo một bộ thẻ mới.
    /// Trả về: HTTP 201 Created + header Location trỏ tới URL bộ thẻ vừa tạo.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<DeckDto>> Create([FromBody] CreateDeckRequest request)
    {
        // Kiểm tra hợp lệ của dữ liệu đầu vào (Data Annotations)
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var created = await _deckService.CreateDeckAsync(request);
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
    /// Endpoint: Xóa vĩnh viễn một bộ thẻ.
    /// Trả về: HTTP 204 NoContent khi xóa thành công.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _deckService.DeleteDeckAsync(id);
        if (!success) return NotFound(new { message = "Không tìm thấy bộ thẻ cần xóa" });
        return NoContent();
    }
}
