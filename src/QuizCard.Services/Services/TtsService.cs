using System.Collections.Concurrent;
using System.Text.RegularExpressions;

namespace QuizCard.Services.Services;

/// <summary>
/// Lớp triển khai dịch vụ phát âm từ vựng Text-to-Speech gọi API từ bên thứ 3 (Google TTS Engine).
/// Tích hợp bộ nhớ đệm trong RAM (In-Memory Cache) để:
/// 1. Giảm thiểu số lần gọi mạng ra ngoài.
/// 2. Phản hồi tức thì (0ms) cho các từ vựng lặp lại trong phiên học.
/// 3. Khắc phục triệt để giọng đọc mặc định khô cứng, máy móc của Windows.
/// </summary>
public class TtsService : ITtsService
{
    // Bộ nhớ đệm lưu trữ các file âm thanh đã tải theo khóa: "{lang}:{cleanText}"
    private static readonly ConcurrentDictionary<string, byte[]> _audioCache = new(StringComparer.OrdinalIgnoreCase);

    // HttpClient dùng chung để tối ưu Connection Pooling
    private static readonly HttpClient _httpClient = new()
    {
        Timeout = TimeSpan.FromSeconds(10)
    };

    static TtsService()
    {
        // Thiết lập User-Agent giả lập trình duyệt để yêu cầu Google TTS không bị chặn
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
        _httpClient.DefaultRequestHeaders.Add("Referer", "https://translate.google.com/");
    }

    /// <summary>
    /// Lấy dữ liệu âm thanh MP3 từ Google TTS hoặc từ bộ nhớ đệm
    /// </summary>
    public async Task<byte[]?> GetAudioSpeechAsync(string text, string lang = "en")
    {
        if (string.IsNullOrWhiteSpace(text)) return null;

        // Chuẩn hóa và làm sạch từ vựng cần đọc
        var cleanText = CleanTextForSpeech(text);
        if (string.IsNullOrWhiteSpace(cleanText)) return null;

        // Tự động nhận diện ngôn ngữ nếu truyền "auto" hoặc kiểm tra dấu tiếng Việt
        var targetLang = ResolveLanguage(cleanText, lang);

        // Khóa định danh trong bộ nhớ đệm
        var cacheKey = $"{targetLang}:{cleanText.ToLowerInvariant()}";

        // 1. Kiểm tra trong bộ nhớ đệm
        if (_audioCache.TryGetValue(cacheKey, out var cachedAudio))
        {
            return cachedAudio;
        }

        try
        {
            // 2. Gọi API bên thứ 3 (Google Translate TTS)
            var encodedText = Uri.EscapeDataString(cleanText);
            var url = $"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl={targetLang}&q={encodedText}";

            using var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var audioBytes = await response.Content.ReadAsByteArrayAsync();

            // Nếu lấy được âm thanh hợp lệ (trên 500 bytes) thì lưu vào Cache
            if (audioBytes.Length > 500)
            {
                // Giới hạn kích thước cache để tránh tràn RAM (tối đa 1000 từ vựng)
                if (_audioCache.Count > 1000)
                {
                    _audioCache.Clear();
                }
                _audioCache[cacheKey] = audioBytes;
                return audioBytes;
            }

            return null;
        }
        catch
        {
            // Trường hợp có lỗi mạng ngoại tuyến, trả về null để client kích hoạt fallback
            return null;
        }
    }

    /// <summary>
    /// Tiện ích làm sạch từ vựng: lược bỏ các ghi chú trong ngoặc đơn (ví dụ "Deadline (hạn chót)" -> "Deadline")
    /// </summary>
    private static string CleanTextForSpeech(string rawText)
    {
        var text = rawText.Trim();

        // Lược bỏ phần chú thích trong ngoặc đơn nếu có
        var bracketIndex = text.IndexOf('(');
        if (bracketIndex > 0)
        {
            text = text[..bracketIndex].Trim();
        }

        // Giới hạn độ dài tối đa 200 ký tự cho 1 lần đọc
        if (text.Length > 200)
        {
            text = text[..200].Trim();
        }

        return text;
    }

    /// <summary>
    /// Tự động phát hiện nếu văn bản chứa ký tự dấu tiếng Việt để chọn đúng giọng đọc tiếng Việt
    /// </summary>
    private static string ResolveLanguage(string text, string requestedLang)
    {
        if (requestedLang.Equals("vi", StringComparison.OrdinalIgnoreCase)) return "vi";
        if (requestedLang.Equals("en", StringComparison.OrdinalIgnoreCase)) return "en";

        // Kiểm tra xem có dấu tiếng Việt không
        var hasVietnameseAccent = Regex.IsMatch(text, @"[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]", RegexOptions.IgnoreCase);
        return hasVietnameseAccent ? "vi" : "en";
    }
}

