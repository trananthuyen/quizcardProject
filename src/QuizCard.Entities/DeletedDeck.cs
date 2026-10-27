namespace QuizCard.Entities;

/// <summary>
/// Thực thể lưu trữ Bộ thẻ (Deck) đã bị xóa tạm thời (nằm trong Thùng rác - Trash).
/// Tự động xóa vĩnh viễn sau 5 ngày kể từ thời điểm DeletedAt.
/// </summary>
public class DeletedDeck
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Folder { get; set; } = "Chung";
    public string? Tag { get; set; }
    public bool IsPublic { get; set; } = true;
    public DateTime OriginalCreatedAt { get; set; }
    public DateTime DeletedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Danh sách các thẻ flashcard con thuộc bộ thẻ này tại thời điểm bị xóa.
    /// </summary>
    public virtual ICollection<DeletedCard> DeletedCards { get; set; } = new List<DeletedCard>();
}

