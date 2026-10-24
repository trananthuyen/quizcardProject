namespace QuizCard.ServiceContracts.DTOs.StudyDTOs;

/// <summary>
/// DTO thống kê nhanh về các thẻ trong bộ phục vụ màn hình ôn tập.
/// </summary>
/// <param name="DeckId">Mã bộ thẻ.</param>
/// <param name="DeckTitle">Tên bộ thẻ.</param>
/// <param name="TotalCards">Tổng số thẻ.</param>
/// <param name="DueCards">Số thẻ đã đến hạn cần ôn tập hôm nay.</param>
/// <param name="NotStartedCards">Số thẻ chưa từng học.</param>
/// <param name="LearningCards">Số thẻ đang trong quá trình học.</param>
/// <param name="MasteredCards">Số thẻ đã thuộc bài.</param>
public record DeckStudyStatsDto(
    Guid DeckId,
    string DeckTitle,
    int TotalCards,
    int DueCards,
    int NotStartedCards,
    int LearningCards,
    int MasteredCards
);
