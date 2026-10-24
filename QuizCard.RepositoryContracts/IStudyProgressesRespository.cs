using QuizCard.Entities;

namespace QuizCard.RepositoryContracts;

/// <summary>
/// Giao diện định nghĩa các hợp đồng truy vấn và cập nhật dữ liệu cho Tiến độ học tập của Thẻ (StudyProgress).
/// Phục vụ thuật toán học lặp lại ngắt quãng (Spaced Repetition SM-2) thuộc tầng RepositoryContracts.
/// </summary>
public interface IStudyProgressesRespository
{
    /// <summary>
    /// Thêm mới một bản ghi tiến độ học tập cho thẻ vào cơ sở dữ liệu.
    /// </summary>
    /// <param name="progress">Thực thể tiến độ học cần tạo mới.</param>
    /// <returns>Thực thể tiến độ học sau khi lưu thành công.</returns>
    Task<StudyProgress> CreateStudyProgress(StudyProgress progress);

    /// <summary>
    /// Lấy tiến độ học tập của một thẻ flashcard dựa theo mã thẻ (CardId).
    /// </summary>
    /// <param name="cardId">Định danh duy nhất của thẻ (CardId).</param>
    /// <returns>Thực thể tiến độ học nếu có, ngược lại trả về null.</returns>
    Task<StudyProgress?> GetStudyProgressByCardId(Guid cardId);

    /// <summary>
    /// Cập nhật thông tin tiến độ học tập của thẻ (trạng thái, số lần đúng/sai, chuỗi đúng liên tiếp, thời gian ôn tiếp theo).
    /// </summary>
    /// <param name="progress">Thực thể tiến độ học chứa dữ liệu mới.</param>
    /// <returns>Thực thể tiến độ học sau khi đã cập nhật.</returns>
    Task<StudyProgress?> UpdateStudyProgress(StudyProgress progress);

    /// <summary>
    /// Lấy danh sách tất cả các bản ghi tiến độ học tập của các thẻ thuộc về một bộ thẻ chỉ định.
    /// </summary>
    /// <param name="deckId">Định danh duy nhất (Id) của bộ thẻ.</param>
    /// <returns>Danh sách tiến độ học tập của các thẻ trong bộ.</returns>
    Task<List<StudyProgress>> GetStudyProgressesByDeckId(Guid deckId);

    /// <summary>
    /// Đặt lại toàn bộ tiến độ học tập của danh sách các bản ghi về trạng thái ban đầu (NotStarted, 0 đúng, 0 sai).
    /// </summary>
    /// <param name="progresses">Danh sách các bản ghi tiến độ học cần reset.</param>
    /// <returns>True nếu reset và lưu thành công, ngược lại trả về False.</returns>
    Task<bool> ResetProgresses(List<StudyProgress> progresses);
}
