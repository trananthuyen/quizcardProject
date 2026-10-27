using QuizCard.Entities;

namespace QuizCard.RepositoryContracts;

/// <summary>
/// Giao diện định nghĩa các hợp đồng truy vấn và thao tác dữ liệu cho thực thể Bộ thẻ (Deck).
/// Thuộc tầng RepositoryContracts trong kiến trúc Clean Architecture.
/// </summary>
public interface IDecksRespository
{
    /// <summary>
    /// 1. Lấy tất cả các bộ thẻ hiển thị ở Community (Cộng đồng).
    /// Hỗ trợ lọc theo thư mục (Folder) hoặc thẻ tag nếu được chỉ định và sắp xếp theo ngày tạo giảm dần.
    /// </summary>
    Task<List<Deck>> GetCommunityDecks(string? folder = null, string? tag = null);

    /// <summary>
    /// 2. Lấy tất cả các bộ thẻ của người dùng cụ thể ở My Resources (Kho học liệu cá nhân).
    /// </summary>
    Task<List<Deck>> GetUserDecks(Guid userId, string? folder = null, string? tag = null);

    /// <summary>
    /// Lấy danh sách tất cả các bộ thẻ trong hệ thống, kèm theo danh sách thẻ và tiến độ học.
    /// Hỗ trợ lọc theo thư mục (Folder), tag, hoặc người sở hữu (UserId).
    /// </summary>
    Task<List<Deck>> GetAllDecks(string? folder = null, Guid? userId = null, string? tag = null);

    /// <summary>
    /// Tìm và lấy thông tin chi tiết một bộ thẻ theo Id, kèm theo danh sách thẻ và tiến độ học tập.
    /// </summary>
    Task<Deck?> GetDeckById(Guid id);

    /// <summary>
    /// Thêm mới một bộ thẻ vào cơ sở dữ liệu.
    /// </summary>
    Task<Deck> CreateDeck(Deck deck);

    /// <summary>
    /// Cập nhật thông tin của bộ thẻ đã tồn tại (tiêu đề, mô tả, thư mục, tag, thời gian cập nhật).
    /// </summary>
    Task<Deck?> UpdateDeck(Deck deck);

    /// <summary>
    /// Xóa một bộ thẻ khỏi cơ sở dữ liệu (tự động xóa kèm các thẻ con theo cơ chế Cascade Delete).
    /// </summary>
    Task<bool> DeleteDeck(Deck deck);

    /// <summary>
    /// Kiểm tra xem một bộ thẻ có tồn tại trong cơ sở dữ liệu hay không.
    /// </summary>
    Task<bool> DeckExists(Guid id);
}
