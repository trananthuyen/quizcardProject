using QuizCard.Services.DTOs;

namespace QuizCard.Services.Services;

/// <summary>
/// Giao diện (Interface) quản lý các thao tác CRUD và nhập hàng loạt thẻ Flashcard.
/// </summary>
public interface ICardService
{
    /// <summary>
    /// Lấy toàn bộ danh sách các thẻ Flashcard thuộc về một bộ thẻ cụ thể (theo deckId).
    /// </summary>
    Task<IEnumerable<CardDto>> GetCardsByDeckIdAsync(Guid deckId);

    /// <summary>
    /// Lấy thông tin chi tiết một thẻ Flashcard theo Id.
    /// </summary>
    Task<CardDto?> GetCardByIdAsync(Guid id);

    /// <summary>
    /// Tạo một thẻ Flashcard đơn lẻ vào bộ thẻ tương ứng, đồng thời khởi tạo tiến trình học NotStarted.
    /// </summary>
    Task<CardDto?> CreateCardAsync(Guid deckId, CreateCardRequest request);

    /// <summary>
    /// Tạo hàng loạt nhiều thẻ Flashcard cùng lúc từ danh sách (phục vụ tính năng nhập từ chuỗi văn bản).
    /// Thực thi lưu toàn bộ trong một transaction duy nhất để tối ưu hiệu năng.
    /// </summary>
    Task<IEnumerable<CardDto>> CreateCardsBatchAsync(Guid deckId, IEnumerable<CreateCardRequest> requests);

    /// <summary>
    /// Cập nhật thông tin thuật ngữ, định nghĩa hoặc ví dụ của thẻ.
    /// </summary>
    Task<CardDto?> UpdateCardAsync(Guid id, UpdateCardRequest request);

    /// <summary>
    /// Xóa một thẻ Flashcard khỏi bộ thẻ.
    /// </summary>
    Task<bool> DeleteCardAsync(Guid id);
}
