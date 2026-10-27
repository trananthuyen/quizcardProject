using QuizCard.ServiceContracts.DTOs.TrashDTOs;

namespace QuizCard.ServiceContracts;

public interface ITrashService
{
    /// <summary>
    /// Lấy danh sách các bộ thẻ trong thùng rác (tự động dọn dẹp các mục quá 5 ngày trước khi trả về).
    /// </summary>
    Task<List<DeletedDeckDto>> GetTrashDecksAsync(Guid? userId = null);

    /// <summary>
    /// Lấy chi tiết bộ thẻ trong thùng rác kèm danh sách các thẻ con.
    /// </summary>
    Task<DeletedDeckDto?> GetTrashDeckByIdAsync(Guid id);

    /// <summary>
    /// Đưa bộ thẻ vào thùng rác.
    /// </summary>
    Task<DeletedDeckDto?> MoveDeckToTrashAsync(Guid deckId);

    /// <summary>
    /// Khôi phục bộ thẻ từ thùng rác về danh sách hoạt động.
    /// </summary>
    Task<bool> RestoreDeckAsync(Guid deckId);

    /// <summary>
    /// Xóa vĩnh viễn bộ thẻ khỏi cơ sở dữ liệu.
    /// </summary>
    Task<bool> PermanentlyDeleteDeckAsync(Guid deckId);

    /// <summary>
    /// Xóa vĩnh viễn toàn bộ mục trong thùng rác của người dùng.
    /// </summary>
    Task<bool> EmptyTrashAsync(Guid? userId = null);

    /// <summary>
    /// Quét và xóa vĩnh viễn các mục đã nằm trong thùng rác quá 5 ngày.
    /// </summary>
    Task<int> PurgeExpiredTrashAsync();

    /// <summary>
    /// Lấy danh sách thẻ bị xóa đơn lẻ (nếu có).
    /// </summary>
    Task<List<DeletedCardDto>> GetTrashCardsAsync(Guid? userId = null);

    /// <summary>
    /// Đưa thẻ đơn lẻ vào thùng rác.
    /// </summary>
    Task<DeletedCardDto?> MoveCardToTrashAsync(Guid cardId);

    /// <summary>
    /// Khôi phục thẻ đơn lẻ về bộ thẻ hoạt động.
    /// </summary>
    Task<bool> RestoreCardAsync(Guid cardId);

    /// <summary>
    /// Xóa vĩnh viễn một thẻ đơn lẻ.
    /// </summary>
    Task<bool> PermanentlyDeleteCardAsync(Guid cardId);
}

