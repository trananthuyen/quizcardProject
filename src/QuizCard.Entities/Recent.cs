namespace QuizCard.Entities;

/// <summary>
/// Thực thể lưu vết các Bộ thẻ gần đây người dùng đã xem hoặc học tập qua (Recents).
/// </summary>
public class Recent
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Mã người dùng thực hiện xem hoặc học bộ thẻ (null nếu là khách).
    /// </summary>
    public Guid? UserId { get; set; }

    /// <summary>
    /// Mã bộ thẻ tương ứng.
    /// </summary>
    public Guid DeckId { get; set; }

    /// <summary>
    /// Điều hướng tới Bộ thẻ được xem hoặc học.
    /// </summary>
    public Deck? Deck { get; set; }

    /// <summary>
    /// Loại hành động gần nhất: "VIEW" (Xem trước), "STUDY" (Học lật thẻ), "QUIZ" (Thi trắc nghiệm).
    /// </summary>
    public string ActionType { get; set; } = "VIEW";

    /// <summary>
    /// Thời điểm truy cập gần nhất (UTC).
    /// </summary>
    public DateTime LastAccessedAt { get; set; } = DateTime.UtcNow;
}

