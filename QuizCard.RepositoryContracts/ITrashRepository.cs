using QuizCard.Entities;

namespace QuizCard.RepositoryContracts;

/// <summary>
/// Giao diện Repository quản lý dữ liệu trong Thùng rác (Trash):
/// - Lưu trữ các bộ thẻ (DeletedDecks) và thẻ (DeletedCards) đã bị xóa tạm thời.
/// - Khôi phục (Restore) bộ thẻ và thẻ flashcard kèm tiến độ học tập.
/// - Xóa vĩnh viễn (Permanent Delete) và tự động dọn dẹp sau 5 ngày (Purge Expired).
/// </summary>
public interface ITrashRepository
{
    /// <summary>
    /// Lấy danh sách các bộ thẻ đang nằm trong thùng rác (lọc theo người dùng nếu có).
    /// </summary>
    Task<List<DeletedDeck>> GetDeletedDecksAsync(Guid? userId = null);

    /// <summary>
    /// Lấy chi tiết bộ thẻ đã xóa theo Id kèm danh sách thẻ con.
    /// </summary>
    Task<DeletedDeck?> GetDeletedDeckByIdAsync(Guid id);

    /// <summary>
    /// Chuyển một bộ thẻ đang hoạt động và toàn bộ thẻ con của nó vào Thùng rác.
    /// </summary>
    Task<DeletedDeck> MoveDeckToTrashAsync(Deck deck);

    /// <summary>
    /// Khôi phục bộ thẻ từ Thùng rác trở lại danh sách hoạt động kèm đầy đủ các thẻ con.
    /// </summary>
    Task<Deck> RestoreDeckAsync(DeletedDeck deletedDeck);

    /// <summary>
    /// Xóa vĩnh viễn một bộ thẻ khỏi cơ sở dữ liệu.
    /// </summary>
    Task<bool> PermanentlyDeleteDeckAsync(Guid id);

    /// <summary>
    /// Dọn sạch toàn bộ thùng rác của người dùng.
    /// </summary>
    Task<bool> EmptyTrashAsync(Guid? userId = null);

    /// <summary>
    /// Tự động xóa vĩnh viễn các bộ thẻ và thẻ đã nằm trong thùng rác vượt quá số ngày quy định (mặc định 5 ngày).
    /// </summary>
    Task<int> PurgeExpiredItemsAsync(int retentionDays = 5);

    /// <summary>
    /// Lấy danh sách các thẻ bị xóa đơn lẻ (nếu có).
    /// </summary>
    Task<List<DeletedCard>> GetDeletedCardsAsync(Guid? userId = null);

    /// <summary>
    /// Lấy chi tiết một thẻ đã xóa theo Id.
    /// </summary>
    Task<DeletedCard?> GetDeletedCardByIdAsync(Guid id);

    /// <summary>
    /// Chuyển một thẻ đơn lẻ vào thùng rác.
    /// </summary>
    Task<DeletedCard> MoveCardToTrashAsync(Card card);

    /// <summary>
    /// Khôi phục một thẻ đơn lẻ vào bộ thẻ hoạt động gốc của nó.
    /// </summary>
    Task<Card?> RestoreCardAsync(DeletedCard deletedCard);

    /// <summary>
    /// Xóa vĩnh viễn một thẻ đơn lẻ.
    /// </summary>
    Task<bool> PermanentlyDeleteCardAsync(Guid id);
}

