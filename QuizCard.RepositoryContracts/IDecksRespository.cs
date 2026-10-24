using QuizCard.Entities;

namespace QuizCard.RepositoryContracts;

/// <summary>
/// Giao diện định nghĩa các hợp đồng truy vấn và thao tác dữ liệu cho thực thể Bộ thẻ (Deck).
/// Thuộc tầng RepositoryContracts trong kiến trúc Clean Architecture.
/// </summary>
public interface IDecksRespository
{
    /// <summary>
    /// Lấy danh sách tất cả các bộ thẻ trong hệ thống, kèm theo danh sách thẻ và tiến độ học.
    /// Hỗ trợ lọc theo phân loại (Category) nếu được chỉ định và sắp xếp theo ngày tạo giảm dần.
    /// </summary>
    /// <param name="category">Tên phân loại cần lọc (tùy chọn, không bắt buộc).</param>
    /// <returns>Danh sách các bộ thẻ kèm dữ liệu liên quan.</returns>
    Task<List<Deck>> GetAllDecks(string? category = null);

    /// <summary>
    /// Tìm và lấy thông tin chi tiết một bộ thẻ theo Id, kèm theo danh sách thẻ và tiến độ học tập.
    /// </summary>
    /// <param name="id">Định danh duy nhất (Id) của bộ thẻ cần tìm.</param>
    /// <returns>Thực thể bộ thẻ nếu tìm thấy, ngược lại trả về null.</returns>
    Task<Deck?> GetDeckById(Guid id);

    /// <summary>
    /// Thêm mới một bộ thẻ vào cơ sở dữ liệu.
    /// </summary>
    /// <param name="deck">Thực thể bộ thẻ cần tạo.</param>
    /// <returns>Thực thể bộ thẻ vừa được lưu.</returns>
    Task<Deck> CreateDeck(Deck deck);

    /// <summary>
    /// Cập nhật thông tin của bộ thẻ đã tồn tại (tiêu đề, mô tả, phân loại, thời gian cập nhật).
    /// </summary>
    /// <param name="deck">Thực thể bộ thẻ chứa thông tin mới.</param>
    /// <returns>Thực thể bộ thẻ sau khi đã cập nhật.</returns>
    Task<Deck?> UpdateDeck(Deck deck);

    /// <summary>
    /// Xóa một bộ thẻ khỏi cơ sở dữ liệu (tự động xóa kèm các thẻ con theo cơ chế Cascade Delete).
    /// </summary>
    /// <param name="deck">Thực thể bộ thẻ cần xóa.</param>
    /// <returns>True nếu xóa thành công, ngược lại trả về False.</returns>
    Task<bool> DeleteDeck(Deck deck);

    /// <summary>
    /// Kiểm tra xem một bộ thẻ có tồn tại trong cơ sở dữ liệu hay không.
    /// </summary>
    /// <param name="id">Định danh duy nhất (Id) của bộ thẻ cần kiểm tra.</param>
    /// <returns>True nếu tồn tại, ngược lại trả về False.</returns>
    Task<bool> DeckExists(Guid id);
}
