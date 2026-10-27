namespace QuizCard.Entities;

/// <summary>
/// Thực thể lưu trữ Thẻ flashcard (Card) đã bị xóa (thuộc bộ thẻ đã xóa hoặc bị xóa lẻ).
/// Tự động xóa vĩnh viễn sau 5 ngày kể từ thời điểm DeletedAt.
/// </summary>
public class DeletedCard
{
    public Guid Id { get; set; }

    /// <summary>
    /// ID của bộ thẻ đã xóa nếu thẻ này bị xóa cùng bộ thẻ (Khóa ngoại tới DeletedDecks).
    /// </summary>
    public Guid? DeletedDeckId { get; set; }

    /// <summary>
    /// ID của bộ thẻ gốc nếu thẻ này bị xóa đơn lẻ trong một bộ thẻ đang hoạt động.
    /// </summary>
    public Guid? ActiveDeckId { get; set; }

    public string Term { get; set; } = string.Empty;
    public string Definition { get; set; } = string.Empty;
    public string? Example { get; set; }
    public DateTime OriginalCreatedAt { get; set; }
    public DateTime DeletedAt { get; set; } = DateTime.UtcNow;

    // Bảo tồn tiến độ học tập của thẻ khi khôi phục
    public StudyStatus StudyStatus { get; set; } = StudyStatus.NotStarted;
    public int CorrectCount { get; set; } = 0;
    public int IncorrectCount { get; set; } = 0;
    public int ConsecutiveCorrect { get; set; } = 0;
    public DateTime? NextReviewAt { get; set; }
    public DateTime? LastReviewedAt { get; set; }

    public virtual DeletedDeck? DeletedDeck { get; set; }
}

