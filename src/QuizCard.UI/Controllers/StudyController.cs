using Microsoft.AspNetCore.Mvc;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.StudyDTOs;

namespace QuizCard.UI.Controllers;

/// <summary>
/// RESTful API Controller phục vụ cho Chế độ học Flashcard (Study Mode) và Luyện thi trắc nghiệm (Quiz Mode).
/// Cung cấp các endpoints:
/// - GET  /api/study/{deckId}/stats       : Lấy thống kê số lượng thẻ cần ôn hôm nay
/// - GET  /api/study/{deckId}/cards       : Lấy danh sách thẻ đưa vào phiên học / bài trắc nghiệm
/// - POST /api/study/cards/{cardId}/answer: Gửi kết quả đánh giá (Đúng/Sai) của người dùng
/// - POST /api/study/{deckId}/reset       : Đặt lại toàn bộ tiến độ học của bộ thẻ
/// </summary>
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
    /// Endpoint: Lấy thống kê học tập của một bộ thẻ (tổng số thẻ, thẻ đã thuộc, thẻ đến hạn ôn).
    /// </summary>
    [HttpGet("{deckId:guid}/stats")]
    public async Task<ActionResult<DeckStudyStatsDto>> GetStats(Guid deckId)
    {
        var stats = await _studyService.GetStudyStatsAsync(deckId);
        if (stats is null) return NotFound(new { message = "Không tìm thấy bộ thẻ" });
        return Ok(stats);
    }

    /// <summary>
    /// Endpoint: Lấy danh sách thẻ phục vụ cho phiên học Flashcard hoặc bài thi Trắc nghiệm.
    /// Có thể truyền tham số dueOnly=true để chỉ lấy các thẻ đã đến hạn ôn tập.
    /// </summary>
    [HttpGet("{deckId:guid}/cards")]
    public async Task<ActionResult<List<StudyCardDto>>> GetSessionCards(Guid deckId, [FromQuery] bool dueOnly = false)
    {
        var cards = await _studyService.GetSessionCardsAsync(deckId, dueOnly);
        return Ok(cards);
    }

    /// <summary>
    /// Endpoint: Ghi nhận kết quả trả lời (Đúng hoặc Sai) từ người dùng.
    /// Thực thi thuật toán Spaced Repetition, nâng cấp lên "Đã thuộc" nếu đúng 3 lần liên tiếp,
    /// hoặc yêu cầu lặp lại ở cuối phiên nếu trả lời sai.
    /// </summary>
    [HttpPost("cards/{cardId:guid}/answer")]
    public async Task<ActionResult<AnswerCardResponse>> AnswerCard(Guid cardId, [FromBody] AnswerCardRequest request)
    {
        var response = await _studyService.RecordAnswerAsync(cardId, request);
        if (response is null) return NotFound(new { message = "Không tìm thấy thẻ cần cập nhật" });
        return Ok(response);
    }

    /// <summary>
    /// Endpoint: Đặt lại (Reset) tiến trình học tập của toàn bộ thẻ trong bộ thẻ về 0.
    /// </summary>
    [HttpPost("{deckId:guid}/reset")]
    public async Task<IActionResult> ResetProgress(Guid deckId)
    {
        var success = await _studyService.ResetDeckProgressAsync(deckId);
        if (!success) return NotFound(new { message = "Không tìm thấy bộ thẻ để đặt lại tiến độ" });
        return Ok(new { message = "Đã đặt lại tiến độ học tập của bộ thẻ thành công" });
    }
}
