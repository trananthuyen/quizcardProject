using QuizCard.ServiceContracts;

namespace QuizCard.UI.BackgroundServices;

/// <summary>
/// Background Service tự động chạy ngầm định kỳ:
/// Quét và xóa vĩnh viễn các bộ thẻ và thẻ flashcard đã nằm trong Thùng rác (Trash) quá 5 ngày.
/// </summary>
public class TrashCleanupBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TrashCleanupBackgroundService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromHours(1);

    public TrashCleanupBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<TrashCleanupBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("TrashCleanupBackgroundService đã bắt đầu chạy.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var trashService = scope.ServiceProvider.GetRequiredService<ITrashService>();

                var deletedCount = await trashService.PurgeExpiredTrashAsync();
                if (deletedCount > 0)
                {
                    _logger.LogInformation("Đã tự động dọn dẹp vĩnh viễn {Count} bản ghi hết hạn 5 ngày trong Thùng rác.", deletedCount);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xảy ra trong quá trình dọn dẹp tự động Thùng rác.");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }
    }
}

