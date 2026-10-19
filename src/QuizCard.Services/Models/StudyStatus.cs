namespace QuizCard.Services.Models;

/// <summary>
/// Trạng thái học tập của một thẻ Flashcard theo phương pháp ghi nhớ:
/// - NotStarted: Thẻ mới tạo, người dùng chưa từng tương tác ôn tập.
/// - Learning: Thẻ đang trong quá trình học và rèn luyện trí nhớ.
/// - Mastered: Thẻ đã thuộc (đạt đủ số lần trả lời đúng liên tiếp theo thuật toán).
/// </summary>
public enum StudyStatus
{
    /// <summary>
    /// Chưa học: Thẻ mới thêm vào bộ thẻ, chưa có lượt ôn nào.
    /// </summary>
    NotStarted = 0,

    /// <summary>
    /// Đang học: Người dùng đã ôn tập thẻ nhưng chưa đạt chuẩn thuộc bài (chưa đủ 3 lần đúng liên tiếp).
    /// </summary>
    Learning = 1,

    /// <summary>
    /// Đã thuộc: Người dùng đã trả lời đúng liên tiếp 3 lần trở lên, kiến thức đã vào trí nhớ dài hạn.
    /// </summary>
    Mastered = 2
}
