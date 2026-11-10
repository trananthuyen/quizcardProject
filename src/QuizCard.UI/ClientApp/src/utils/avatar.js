/**
 * Tiện ích tạo Avatar chữ cái + màu nền nhất quán cho người dùng
 * khi chưa có ảnh đại diện hoặc đường dẫn ảnh bị lỗi.
 */

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)', // Indigo -> Cyan
  'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)', // Blue -> Sky
  'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)', // Violet -> Pink
  'linear-gradient(135deg, #059669 0%, #10b981 100%)', // Emerald
  'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)', // Amber
  'linear-gradient(135deg, #e11d48 0%, #fb7185 100%)', // Rose
  'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)', // Sky -> Indigo
  'linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%)', // Teal
];

/**
 * Trích xuất ký tự viết tắt từ tên hoặc email người dùng.
 * Ví dụ: "An trần" -> "AT" (maxChars = 2), hoặc "A" (maxChars = 1).
 */
export function getAvatarInitials(name = '', email = '', maxChars = 2) {
  const source = String(name || email || 'U').trim();
  if (!source) return 'U';

  const words = source.split(/\s+/).filter(Boolean);
  if (maxChars === 1 || words.length <= 1) {
    const cleaned = source.replace(/[^a-zA-Z0-9À-ỹ]/g, '');
    return (cleaned.slice(0, maxChars) || source.charAt(0) || 'U').toUpperCase();
  }

  const firstChar = words[0].replace(/[^a-zA-Z0-9À-ỹ]/g, '').charAt(0) || words[0].charAt(0);
  const lastChar =
    words[words.length - 1].replace(/[^a-zA-Z0-9À-ỹ]/g, '').charAt(0) ||
    words[words.length - 1].charAt(0);

  return `${firstChar}${lastChar}`.toUpperCase();
}

/**
 * Sinh màu nền gradient ổn định dựa trên thông tin người dùng (ID / email / tên).
 */
export function getAvatarGradient(seed = '') {
  const key = String(seed || 'QuizLibrary').trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}
