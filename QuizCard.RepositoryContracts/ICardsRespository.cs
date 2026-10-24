using QuizCard.Entities;

namespace QuizCard.RepositoryContracts;

/// <summary>
/// Giao diện định nghĩa các hợp đồng truy vấn và thao tác dữ liệu cho thực thể Thẻ Flashcard (Card).
/// Thuộc tầng RepositoryContracts, đóng vai trò trừu tượng hóa việc truy cập cơ sở dữ liệu.
/// </summary>
public interface ICardsRespository
{
    /// <summary>
    /// Thêm mới một thẻ Flashcard vào cơ sở dữ liệu (kèm tiến độ học nếu có).
    /// </summary>
    /// <param name="card">Thực thể thẻ cần tạo mới.</param>
    /// <returns>Thực thể thẻ vừa được lưu vào CSDL.</returns>
    Task<Card> CreateCard(Card card);

    /// <summary>
    /// Thêm hàng loạt nhiều thẻ Flashcard vào cơ sở dữ liệu trong cùng một giao tác (Batch Insert).
    /// </summary>
    /// <param name="cards">Danh sách các thực thể thẻ cần thêm.</param>
    /// <returns>Danh sách các thẻ đã được lưu thành công.</returns>
    Task<List<Card>> CreateCardsBatch(List<Card> cards);

    /// <summary>
    /// Lấy danh sách toàn bộ các thẻ thuộc về một bộ thẻ cụ thể,
    /// kèm theo thông tin tiến trình học tập (StudyProgress) và sắp xếp theo ngày tạo tăng dần.
    /// </summary>
    /// <param name="deckId">Định danh duy nhất (Id) của bộ thẻ.</param>
    /// <returns>Danh sách thẻ flashcard thuộc bộ thẻ.</returns>
    Task<List<Card>> GetAllCardsByDeckId(Guid deckId);

    /// <summary>
    /// Tìm và lấy thông tin chi tiết một thẻ Flashcard theo Id, kèm theo tiến trình học tập.
    /// </summary>
    /// <param name="id">Định danh duy nhất (Id) của thẻ cần tìm.</param>
    /// <returns>Thực thể thẻ nếu tìm thấy, hoặc null nếu không tồn tại.</returns>
    Task<Card?> GetCardById(Guid id);

    /// <summary>
    /// Cập nhật thông tin của một thẻ Flashcard đã tồn tại trong cơ sở dữ liệu.
    /// </summary>
    /// <param name="card">Thực thể thẻ chứa dữ liệu cập nhật.</param>
    /// <returns>Thực thể thẻ sau khi đã lưu cập nhật.</returns>
    Task<Card?> UpdateCard(Card card);

    /// <summary>
    /// Xóa một thẻ Flashcard khỏi cơ sở dữ liệu.
    /// </summary>
    /// <param name="card">Thực thể thẻ cần xóa.</param>
    /// <returns>True nếu xóa thành công, ngược lại trả về False.</returns>
    Task<bool> DeleteCard(Card card);

    /// <summary>
    /// Kiểm tra sự tồn tại của bộ thẻ theo mã định danh (deckId).
    /// </summary>
    /// <param name="deckId">Định danh duy nhất (Id) của bộ thẻ cần kiểm tra.</param>
    /// <returns>True nếu bộ thẻ tồn tại trong hệ thống, ngược lại trả về False.</returns>
    Task<bool> DeckExists(Guid deckId);
}
