using QuizCard.Entities;
using QuizCard.ServiceContracts.Enums;

namespace QuizCard.ServiceContracts.DTOs.CardDTOs;

/// <summary>
/// DTO chứa thông tin tiến độ học của một thẻ Flashcard trả về cho Frontend.
/// </summary>
/// <param name="Status">Trạng thái: 0 (Chưa học), 1 (Đang học), 2 (Đã thuộc).</param>
/// <param name="CorrectCount">Số lần đã nhớ đúng.</param>
/// <param name="IncorrectCount">Số lần đã nhớ sai.</param>
/// <param name="ConsecutiveCorrect">Số lần nhớ đúng liên tiếp hiện tại (đạt 3/3 là thuộc).</param>
/// <param name="NextReviewAt">Thời điểm cần ôn tập tiếp theo.</param>
/// <param name="LastReviewedAt">Thời điểm ôn tập lần gần nhất.</param>
public record StudyProgressDto(
    StudyStatus Status,
    int CorrectCount,
    int IncorrectCount,
    int ConsecutiveCorrect,
    DateTime? NextReviewAt,
    DateTime? LastReviewedAt
);

