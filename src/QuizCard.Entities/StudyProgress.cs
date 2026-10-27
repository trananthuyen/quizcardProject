namespace QuizCard.Entities;

/// <summary>
/// Đại diện cho tiến trình học tập của một thẻ Flashcard cụ thể theo từng người dùng.
/// Lưu trữ lịch sử ghi nhớ, chuỗi đúng/sai và tính toán thời điểm cần ôn tập tiếp theo
/// theo nguyên lý lặp lại ngắt quãng (Spaced Repetition System - SRS).
/// </summary>
public class StudyProgress
{
    /// <summary>
    /// Khóa chính định danh bản ghi tiến trình học tập.
    /// </summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Khóa ngoại liên kết duy nhất tới một thẻ Flashcard (CardId).
    /// </summary>
    public Guid CardId { get; set; }

    /// <summary>
    /// Khóa ngoại liên kết tới người dùng (UserId).
    /// Quản lý tiến độ học tập riêng biệt cho mỗi người dùng.
    /// Có thể null đối với bản ghi mẫu hệ thống hoặc khách chưa đăng nhập.
    /// </summary>
    public Guid? UserId { get; set; }

    /// <summary>
    /// Navigation property: Thẻ Flashcard tương ứng.
    /// </summary>
    public Card? Card { get; set; }

    /// <summary>
    /// Trạng thái học tập hiện tại của thẻ:
    /// - 0: NotStarted (Chưa học)
    /// - 1: Learning (Đang học)
    /// - 2: Mastered (Đã thuộc)
    /// </summary>
    public StudyStatus Status { get; set; } = StudyStatus.NotStarted;

    /// <summary>
    /// Tổng số lần người dùng trả lời ĐÚNG thẻ này trong toàn bộ lịch sử học tập.
    /// </summary>
    public int CorrectCount { get; set; } = 0;

    /// <summary>
    /// Tổng số lần người dùng trả lời SAI (hoặc bấm Chưa nhớ) thẻ này.
    /// </summary>
    public int IncorrectCount { get; set; } = 0;

    /// <summary>
    /// Số lần trả lời ĐÚNG LIÊN TIẾP trong chuỗi hiện tại:
    /// - Mỗi lần trả lời đúng: ConsecutiveCorrect tăng thêm 1.
    /// - Khi đạt đủ 3 lần: Thẻ được thăng cấp sang Mastered (Đã thuộc).
    /// - Nếu trả lời sai bất kỳ lúc nào: Chuỗi này lập tức reset về 0.
    /// </summary>
    public int ConsecutiveCorrect { get; set; } = 0;

    /// <summary>
    /// Thời điểm (UTC) người dùng nên ôn tập lại thẻ này.
    /// Thẻ càng thuộc lâu thì khoảng cách ôn tập càng giãn xa ra (ví dụ: +1 ngày, +3 ngày, +7 ngày).
    /// </summary>
    public DateTime? NextReviewAt { get; set; }

    /// <summary>
    /// Thời điểm (UTC) người dùng tương tác ôn tập thẻ này gần nhất.
    /// </summary>
    public DateTime? LastReviewedAt { get; set; }
}
