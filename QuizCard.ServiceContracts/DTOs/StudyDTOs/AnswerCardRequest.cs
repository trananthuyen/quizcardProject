namespace QuizCard.ServiceContracts.DTOs.StudyDTOs;

/// <summary>
/// DTO gửi từ người dùng khi đánh giá kết quả một thẻ (Đúng hoặc Sai).
/// </summary>
/// <param name="IsCorrect">True nếu nhớ đúng; False nếu chưa nhớ hoặc chọn sai đáp án.</param>
public record AnswerCardRequest(
    bool IsCorrect
);
