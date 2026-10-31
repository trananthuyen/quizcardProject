using QuizCard.ServiceContracts.DTOs.RecentDTOs;

namespace QuizCard.ServiceContracts;

public interface IRecentsService
{
    /// <summary>
    /// Lấy danh sách các bộ thẻ gần đây của người dùng.
    /// </summary>
    Task<List<RecentDeckDto>> GetRecentsAsync(Guid? userId, int limit = 50);

    /// <summary>
    /// Ghi nhận lịch sử xem hoặc học bộ thẻ.
    /// </summary>
    Task<RecentDeckDto> RecordRecentAsync(Guid deckId, Guid? userId, string? actionType);

    /// <summary>
    /// Xóa 1 mục khỏi danh sách gần đây theo ID bản ghi.
    /// </summary>
    Task<bool> RemoveRecentAsync(Guid recentId, Guid? userId);

    /// <summary>
    /// Xóa bộ thẻ khỏi danh sách gần đây theo DeckId.
    /// </summary>
    Task<bool> RemoveRecentByDeckAsync(Guid deckId, Guid? userId);

    /// <summary>
    /// Xóa toàn bộ danh sách gần đây của người dùng.
    /// </summary>
    Task<bool> ClearAllRecentsAsync(Guid? userId);
}

