using Microsoft.AspNetCore.Mvc;
using QuizCard.ServiceContracts;
using QuizCard.Services.Services;

namespace QuizCard.UI.Controllers;

/// <summary>
/// RESTful Controller phục vụ phát âm giọng đọc từ vựng (Text-To-Speech API).
/// Gọi tới dịch vụ TTS bên thứ 3 và trả về luồng âm thanh audio/mpeg (MP3)
/// giúp người học nghe phát âm chuẩn bản xứ thay vì giọng đọc mặc định của hệ điều hành.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class TtsController : ControllerBase
{
    private readonly ITtsService _ttsService;

    public TtsController(ITtsService ttsService)
    {
        _ttsService = ttsService;
    }

    /// <summary>
    /// Endpoint: Lấy file âm thanh MP3 phát âm từ vựng.
    /// URL: GET /api/tts?text={text}&lang={lang}
    /// Header Cache-Control: Lưu cache trình duyệt 1 ngày để tối ưu tốc độ.
    /// </summary>
    /// <param name="text">Nội dung từ vựng cần đọc.</param>
    /// <param name="lang">Mã ngôn ngữ: "en" (tiếng Anh) hoặc "vi" (tiếng Việt), mặc định "en".</param>
    [HttpGet]
    [HttpHead]
    [ResponseCache(Duration = 86400, Location = ResponseCacheLocation.Any)]
    public async Task<IActionResult> Speak([FromQuery] string text, [FromQuery] string lang = "en")
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return BadRequest(new { message = "Tham số text không được để trống" });
        }

        var audioBytes = await _ttsService.GetAudioSpeechAsync(text, lang);
        if (audioBytes is null || audioBytes.Length == 0)
        {
            return NotFound(new { message = "Không thể tạo giọng đọc cho từ vựng này" });
        }

        return File(audioBytes, "audio/mpeg", enableRangeProcessing: true);
    }
}
