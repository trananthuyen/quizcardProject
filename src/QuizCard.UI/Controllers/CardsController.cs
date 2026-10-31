using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.CardDTOs;

namespace QuizCard.UI.Controllers;

/// <summary>
/// RESTful API Controller quản lý các Thẻ Flashcard (Cards):
/// Cung cấp các endpoints cho Frontend:
/// - GET    /api/decks/{deckId}/cards       : Lấy danh sách thẻ của bộ
/// - GET    /api/cards/{id}                 : Lấy chi tiết một thẻ
/// - POST   /api/decks/{deckId}/cards       : Thêm một thẻ đơn lẻ
/// - POST   /api/decks/{deckId}/cards/batch : Thêm hàng loạt thẻ từ chuỗi văn bản
/// - POST   /api/decks/{deckId}/cards/bulk  : Thêm hàng loạt thẻ từ chuỗi văn bản (alias)
/// - PUT    /api/cards/{id}                 : Cập nhật thẻ
/// - DELETE /api/cards/{id}                 : Xóa thẻ
/// </summary>
[ApiController]
[Route("api")]
public class CardsController : ControllerBase
{
    private readonly ICardService _cardService;

    public CardsController(ICardService cardService)
    {
        _cardService = cardService;
    }

    /// <summary>
    /// Endpoint: Lấy danh sách toàn bộ thẻ thuộc về một bộ thẻ (theo deckId).
    /// </summary>
    [HttpGet("decks/{deckId:guid}/cards")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<CardDto>>> GetCardsByDeck(Guid deckId)
    {
        var cards = await _cardService.GetCardsByDeckIdAsync(deckId);
        return Ok(cards);
    }

    /// <summary>
    /// Endpoint: Lấy thông tin một thẻ theo Id.
    /// </summary>
    [HttpGet("cards/{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<CardDto>> GetById(Guid id)
    {
        var card = await _cardService.GetCardByIdAsync(id);
        if (card is null) return NotFound(new { message = "Không tìm thấy thẻ flashcard" });
        return Ok(card);
    }

    /// <summary>
    /// Endpoint: Thêm một thẻ đơn lẻ vào bộ thẻ.
    /// Tự động khởi tạo bản ghi tiến độ học NotStarted.
    /// </summary>
    [Authorize("AuthorizedForUser")]
    [HttpPost("decks/{deckId:guid}/cards")]
    public async Task<ActionResult<CardDto>> Create(Guid deckId, [FromBody] CreateCardRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var card = await _cardService.CreateCardAsync(deckId, request);
        if (card is null) return NotFound(new { message = "Không tìm thấy bộ thẻ tương ứng để thêm thẻ" });

        return CreatedAtAction(nameof(GetById), new { id = card.Id }, card);
    }

    /// <summary>
    /// Endpoint: Thêm hàng loạt thẻ Flashcard (Bulk Import từ chuỗi văn bản).
    /// Nhận vào mảng các đối tượng CreateCardRequest và lưu trong một transaction.
    /// Hỗ trợ cả 2 route /batch và /bulk để tương thích tuyệt đối giữa các client.
    /// </summary>
    [Authorize("AuthorizedForUser")]
    [HttpPost("decks/{deckId:guid}/cards/batch")]
    [HttpPost("decks/{deckId:guid}/cards/bulk")]
    public async Task<ActionResult<IEnumerable<CardDto>>> CreateBatch(Guid deckId, [FromBody] List<CreateCardRequest> requests)
    {
        if (requests == null || requests.Count == 0)
        {
            return BadRequest(new { message = "Danh sách thẻ không được rỗng" });
        }

        var cards = await _cardService.CreateCardsBatchAsync(deckId, requests);
        return Ok(cards);
    }

    /// <summary>
    /// Endpoint: Cập nhật nội dung Thuật ngữ, Định nghĩa hoặc Ví dụ của thẻ theo Id.
    /// </summary>
    [HttpPut("cards/{id:guid}")]
    [Authorize("AuthorizedForUser")]
    public async Task<ActionResult<CardDto>> Update(Guid id, [FromBody] UpdateCardRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var card = await _cardService.UpdateCardAsync(id, request);
        if (card is null) return NotFound(new { message = "Không tìm thấy thẻ flashcard cần cập nhật" });

        return Ok(card);
    }

    /// <summary>
    /// Endpoint: Xóa một thẻ Flashcard theo Id.
    /// </summary>
    [HttpDelete("cards/{id:guid}")]
    [Authorize("AuthorizedForUser")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _cardService.DeleteCardAsync(id);
        if (!success) return NotFound(new { message = "Không tìm thấy thẻ flashcard cần xóa" });
        return NoContent();
    }
}
