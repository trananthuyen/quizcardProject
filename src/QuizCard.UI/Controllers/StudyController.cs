using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.StudyDTOs;

namespace QuizCard.UI.Controllers;

/// <summary>
/// RESTful API Controller phục vụ cho Chế độ học Flashcard (Study Mode) và Luyện thi trắc nghiệm (Quiz Mode).
/// Cung cấp các endpoints:
/// - GET  /api/study/{deckId}/stats       : Lấy thống kê số lượng thẻ cần ôn hôm nay (theo UserId)
/// - GET  /api/study/{deckId}/cards       : Lấy danh sách thẻ đưa vào phiên học / bài trắc nghiệm (theo UserId)
/// - POST /api/study/cards/{cardId}/answer: Gửi kết quả đánh giá (Đúng/Sai) của người dùng (kèm UserId)
/// - POST /api/study/{deckId}/reset       : Đặt lại toàn bộ tiến độ học của bộ thẻ (theo UserId)
/// </summary>
[AllowAnonymous]
[ApiController]
[Route("api/[controller]")]
public class StudyController : ControllerBase
{
    private readonly IStudyService _studyService;

    public StudyController(IStudyService studyService)
    {
        _studyService = studyService;
    }

    /// <summary>
    /// Endpoint: Lấy thống kê học tập của một bộ thẻ (tổng số thẻ, thẻ đã thuộc, thẻ đến hạn ôn) theo UserId.
    /// </summary>
    [HttpGet("{deckId:guid}/stats")]
    public async Task<ActionResult<DeckStudyStatsDto>> GetStats(Guid deckId, [FromQuery] Guid? userId = null)
    {
        var targetUserId = ResolveUserId(userId);
        var stats = await _studyService.GetStudyStatsAsync(deckId, targetUserId);
        if (stats is null) return NotFound(new { message = "Không tìm thấy bộ thẻ" });
        return Ok(stats);
    }

    /// <summary>
    /// Endpoint: Lấy danh sách thẻ phục vụ cho phiên học Flashcard hoặc bài thi Trắc nghiệm theo UserId.
    /// Có thể truyền tham số dueOnly=true để chỉ lấy các thẻ đã đến hạn ôn tập.
    /// </summary>
    [HttpGet("{deckId:guid}/cards")]
    public async Task<ActionResult<List<StudyCardDto>>> GetSessionCards(
        Guid deckId,
        [FromQuery] bool dueOnly = false,
        [FromQuery] Guid? userId = null)
    {
        var targetUserId = ResolveUserId(userId);
        var cards = await _studyService.GetSessionCardsAsync(deckId, dueOnly, targetUserId);
        return Ok(cards);
    }

    /// <summary>
    /// Endpoint: Ghi nhận kết quả trả lời (Đúng hoặc Sai) từ người dùng.
    /// Thực thi thuật toán Spaced Repetition, nâng cấp lên "Đã thuộc" nếu đúng 3 lần liên tiếp,
    /// hoặc yêu cầu lặp lại ở cuối phiên nếu trả lời sai, gắn liền với UserId của người học.
    /// </summary>
    [HttpPost("cards/{cardId:guid}/answer")]
    public async Task<ActionResult<AnswerCardResponse>> AnswerCard(
        Guid cardId,
        [FromBody] AnswerCardRequest request,
        [FromQuery] Guid? userId = null)
    {
        var targetUserId = ResolveUserId(request.UserId ?? userId);
        var response = await _studyService.RecordAnswerAsync(cardId, request, targetUserId);
        if (response is null) return NotFound(new { message = "Không tìm thấy thẻ cần cập nhật" });
        return Ok(response);
    }

    /// <summary>
    /// Endpoint: Đặt lại (Reset) tiến trình học tập của toàn bộ thẻ trong bộ thẻ về 0 cho UserId.
    /// </summary>
    [HttpPost("{deckId:guid}/reset")]
    public async Task<IActionResult> ResetProgress(Guid deckId, [FromQuery] Guid? userId = null)
    {
        var targetUserId = ResolveUserId(userId);
        var success = await _studyService.ResetDeckProgressAsync(deckId, targetUserId);
        if (!success) return NotFound(new { message = "Không tìm thấy bộ thẻ để đặt lại tiến độ" });
        return Ok(new { message = "Đã đặt lại tiến độ học tập của bộ thẻ thành công" });
    }

    private Guid? ResolveUserId(Guid? requestedUserId)
    {
        if (requestedUserId.HasValue && requestedUserId.Value != Guid.Empty)
        {
            return requestedUserId.Value;
        }

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(userIdClaim, out var parsedGuid) && parsedGuid != Guid.Empty)
        {
            return parsedGuid;
        }

        return null;
    }
}
