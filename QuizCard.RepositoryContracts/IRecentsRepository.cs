using QuizCard.Entities;

namespace QuizCard.RepositoryContracts;

/// <summary>
/// Hợp đồng tương tác dữ liệu cho bảng Recents (Lịch sử các bộ thẻ đã xem / học gần đây).
/// </summary>
public interface IRecentsRepository
{
    /// <summary>
    /// Lấy danh sách các bộ thẻ được xem/học gần đây của người dùng, sắp xếp mới nhất lên trước.
    /// </summary>
    Task<List<Recent>> GetRecentsAsync(Guid? userId, int limit = 50);

    /// <summary>
    /// Ghi nhận hoặc cập nhật thời gian xem/học một bộ thẻ (Upsert theo UserId và DeckId).
    /// </summary>
    Task<Recent> AddOrUpdateRecentAsync(Guid? userId, Guid deckId, string actionType);

    /// <summary>
    /// Xóa một bản ghi lịch sử theo mã Recent.
    /// </summary>
    Task<bool> DeleteRecentAsync(Guid recentId, Guid? userId);

    /// <summary>
    /// Xóa bản ghi lịch sử theo mã DeckId.
    /// </summary>
    Task<bool> DeleteRecentByDeckAsync(Guid deckId, Guid? userId);

    /// <summary>
    /// Xóa toàn bộ lịch sử xem/học của người dùng.
    /// </summary>
    Task<bool> ClearAllRecentsAsync(Guid? userId);
}

