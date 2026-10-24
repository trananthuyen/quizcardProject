using System;
using System.Collections.Generic;
using System.Text;

namespace QuizCard.ServiceContracts
{
    /// <summary>
    /// Giao diện (Interface) định nghĩa dịch vụ phát âm từ vựng chất lượng cao (Text-To-Speech)
    /// gọi từ dịch vụ bên thứ 3 (Google Translate Neural TTS Engine), mang lại giọng đọc tự nhiên, chuẩn bản xứ.
    /// </summary>
    public interface ITtsService
    {
        /// <summary>
        /// Tạo hoặc lấy từ bộ nhớ đệm (Cache) dữ liệu âm thanh MP3 của văn bản yêu cầu.
        /// </summary>
        /// <param name="text">Thuật ngữ, từ vựng hoặc câu cần đọc.</param>
        /// <param name="lang">Mã ngôn ngữ: "en" (tiếng Anh), "vi" (tiếng Việt), v.v.</param>
        /// <returns>Mảng byte định dạng MP3 hoặc null nếu thất bại.</returns>
        Task<byte[]?> GetAudioSpeechAsync(string text, string lang = "en");
    }
}
