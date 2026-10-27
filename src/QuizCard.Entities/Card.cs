using System.ComponentModel.DataAnnotations.Schema;

namespace QuizCard.Entities;

/// <summary>
/// Đại diện cho một thẻ Flashcard đơn lẻ nằm trong một bộ thẻ (Deck).
/// Mỗi thẻ gồm Thuật ngữ (Term) và Định nghĩa (Definition) phục vụ việc ghi nhớ.
/// </summary>
public class Card
{
    /// <summary>
    /// Khóa chính định danh thẻ Flashcard.
    /// </summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Khóa ngoại liên kết tới bộ thẻ chứa thẻ này (DeckId).
    /// </summary>
    public Guid DeckId { get; set; }

    /// <summary>
    /// Navigation property: Bộ thẻ (Deck) sở hữu thẻ này.
    /// </summary>
    public Deck? Deck { get; set; }

    /// <summary>
    /// Thuật ngữ, từ vựng hoặc câu hỏi ở mặt trước của thẻ.
    /// </summary>
    public string Term { get; set; } = string.Empty;

    /// <summary>
    /// Định nghĩa, giải nghĩa, dịch nghĩa hoặc câu trả lời ở mặt sau của thẻ.
    /// </summary>
    public string Definition { get; set; } = string.Empty;

    /// <summary>
    /// Ví dụ ngữ cảnh minh họa cách áp dụng thuật ngữ/từ vựng vào thực tế (Tùy chọn).
    /// </summary>
    public string? Example { get; set; }

    /// <summary>
    /// Thời điểm tạo thẻ nhớ (UTC).
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Thời điểm cập nhật nội dung thẻ gần nhất (nếu có).
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Navigation property: Danh sách dữ liệu theo dõi tiến trình học tập của thẻ theo từng người dùng (Quan hệ 1 - Nhiều).
    /// </summary>
    public ICollection<StudyProgress> StudyProgresses { get; set; } = new List<StudyProgress>();

    /// <summary>
    /// Thuộc tính tiện ích không map vào DB (NotMapped):
    /// Trả về bản ghi tiến độ học đang được ngữ cảnh hiện tại chọn hoặc bản ghi đầu tiên trong StudyProgresses.
    /// </summary>
    [NotMapped]
    private StudyProgress? _studyProgress;

    [NotMapped]
    public StudyProgress? StudyProgress
    {
        get => _studyProgress ?? StudyProgresses.FirstOrDefault();
        set
        {
            _studyProgress = value;
            if (value != null && !StudyProgresses.Contains(value))
            {
                StudyProgresses.Add(value);
            }
        }
    }
}
