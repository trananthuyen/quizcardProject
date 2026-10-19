/**
 * Utility tts.ts: Trình phát âm từ vựng bằng API bên thứ 3 (Google TTS Engine)
 * =============================================================================
 * Thay thế hoàn toàn giọng đọc mặc định khô cứng, máy móc của Windows:
 * 1. Gọi backend endpoint /api/tts để phát luồng âm thanh chuẩn bản xứ (Google Neural Voice).
 * 2. Tự động nhận diện ngôn ngữ: Tiếng Anh ('en') cho thuật ngữ và Tiếng Việt ('vi') cho định nghĩa.
 * 3. Tự động lược bỏ chú thích trong ngoặc đơn (ví dụ "Deadline (hạn chót)" -> chỉ phát âm "Deadline").
 * 4. Dừng âm thanh cũ khi người dùng click phát âm từ mới liên tiếp.
 * 5. Tự động fallback sang Web Speech API nếu thiết bị mất kết nối mạng.
 */

let currentAudio: HTMLAudioElement | null = null;

/**
 * Phát âm một đoạn văn bản hoặc từ vựng
 * @param text Văn bản cần đọc
 * @param lang Ngôn ngữ ('en' | 'vi' | 'auto')
 */
export const playTts = (text: string, lang: 'en' | 'vi' | 'auto' = 'auto'): Promise<void> => {
  return new Promise((resolve) => {
    try {
      if (!text || !text.trim()) {
        resolve();
        return;
      }

      // Dừng âm thanh đang phát trước đó (nếu có)
      stopTts();

      // Lược bỏ phần chú thích trong ngoặc đơn nếu có
      let cleanText = text.trim();
      const bracketIdx = cleanText.indexOf('(');
      if (bracketIdx > 0) {
        cleanText = cleanText.substring(0, bracketIdx).trim();
      }

      // Tự động nhận diện ngôn ngữ dựa trên dấu tiếng Việt
      let targetLang = lang;
      if (lang === 'auto') {
        const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(cleanText);
        targetLang = hasVietnamese ? 'vi' : 'en';
      }

      const url = `/api/tts?text=${encodeURIComponent(cleanText)}&lang=${targetLang}`;
      const audio = new Audio(url);
      currentAudio = audio;

      audio.onended = () => {
        if (currentAudio === audio) {
          currentAudio = null;
        }
        resolve();
      };

      audio.onerror = () => {
        if (currentAudio === audio) {
          currentAudio = null;
        }
        // Fallback sang Web Speech API nếu có lỗi tải audio
        fallbackSpeech(cleanText, targetLang);
        resolve();
      };

      audio.play().catch(() => {
        fallbackSpeech(cleanText, targetLang);
        resolve();
      });
    } catch {
      fallbackSpeech(text, lang === 'vi' ? 'vi' : 'en');
      resolve();
    }
  });
};

/**
 * Dừng phát âm thanh hiện tại
 */
export const stopTts = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Phương án dự phòng (Fallback) sử dụng Web Speech API của trình duyệt khi mất mạng
 */
function fallbackSpeech(text: string, lang: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'vi' ? 'vi-VN' : 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
}

