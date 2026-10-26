using Microsoft.EntityFrameworkCore;
using QuizCard.Entities;

namespace QuizCard.UI.Data;
/// <summary>
/// Lớp khởi tạo cơ sở dữ liệu ban đầu (Database Initializer).
/// Tự động tạo bảng SQLite nếu chưa có, cập nhật cấu trúc cột mới và chèn dữ liệu mẫu đa dạng theo các phân loại:
/// - Bộ thẻ Lập trình (Programming)
/// - Bộ thẻ Học Tiếng Anh (English)
/// - Bộ thẻ đã có tiến trình học (đã thuộc / đang học) để kiểm thử tính năng lọc "Bộ thẻ đã học"
/// </summary>
public static class DbInitializer
{
    public static async Task InitializeAsync(ApplicationDbContext context)
    {
        // 1. Tự động tạo cơ sở dữ liệu và bảng nếu chưa tồn tại
        await context.Database.EnsureCreatedAsync();

        // 1.1 Đảm bảo bảng Attendances tồn tại trong MySQL
        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS `Attendances` (
                    `Id` CHAR(36) NOT NULL,
                    `UserId` CHAR(36) NULL,
                    `GuestId` VARCHAR(100) NULL,
                    `CheckInDate` DATETIME NOT NULL,
                    `StreakCount` INT NOT NULL DEFAULT 1,
                    `PointsEarned` INT NOT NULL DEFAULT 10,
                    `CreatedAt` DATETIME NOT NULL,
                    PRIMARY KEY (`Id`),
                    INDEX `IX_Attendances_UserId_CheckInDate` (`UserId`, `CheckInDate`),
                    INDEX `IX_Attendances_GuestId_CheckInDate` (`GuestId`, `CheckInDate`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");
        }
        catch { }

        // 1.2 Đảm bảo bảng AspNetUsers hỗ trợ Provider, ProviderKey, FullName, AvatarUrl...
        await AddColumnIfNotExistsAsync(context, "AspNetUsers", "Provider", "VARCHAR(50) NULL");
        await AddColumnIfNotExistsAsync(context, "AspNetUsers", "ProviderKey", "VARCHAR(255) NULL");
        await AddColumnIfNotExistsAsync(context, "AspNetUsers", "FullName", "VARCHAR(255) NULL");
        await AddColumnIfNotExistsAsync(context, "AspNetUsers", "AvatarUrl", "VARCHAR(500) NULL");
        await AddColumnIfNotExistsAsync(context, "AspNetUsers", "TermsAccepted", "TINYINT(1) NOT NULL DEFAULT 1");
        await AddColumnIfNotExistsAsync(context, "AspNetUsers", "TermsAcceptedAt", "DATETIME NULL");
        await AddColumnIfNotExistsAsync(context, "AspNetUsers", "CreatedAt", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");

        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                ALTER TABLE `AspNetUsers` DROP INDEX `EmailIndex`;
            ");
        }
        catch { }

        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE INDEX `EmailIndex` ON `AspNetUsers` (`NormalizedEmail`);
            ");
        }
        catch { }

        await AddIndexIfNotExistsAsync(context, "AspNetUsers", "IX_AspNetUsers_Provider_Key", "`Provider`, `ProviderKey`");
        await AddIndexIfNotExistsAsync(context, "AspNetUsers", "IX_AspNetUsers_Provider_Email", "`Provider`, `Email`");

        // 1.3 Đảm bảo bảng Decks có cột UserId để liên kết người dùng tạo và sở hữu
        await AddColumnIfNotExistsAsync(context, "Decks", "UserId", "CHAR(36) NULL");
        await AddIndexIfNotExistsAsync(context, "Decks", "IX_Decks_UserId", "`UserId`");

        // 1.4 Đảm bảo bảng Categories có cột UserId để liên kết người dùng tạo
        await AddColumnIfNotExistsAsync(context, "Categories", "UserId", "CHAR(36) NULL");
        await AddIndexIfNotExistsAsync(context, "Categories", "IX_Categories_UserId", "`UserId`");

        // Tự động phân loại thông minh các bộ thẻ hiện có (nếu chưa được phân loại hoặc đang là Chung)
        var allExistingDecks = await context.Decks.ToListAsync();
        bool hasChanges = false;
        foreach (var d in allExistingDecks)
        {
            if (string.IsNullOrEmpty(d.Category) || d.Category == "Chung")
            {
                if (d.Title.Contains("Lập Trình", StringComparison.OrdinalIgnoreCase))
                {
                    d.Category = "Lập trình";
                    hasChanges = true;
                }
                else if (d.Title.Contains("IDIOMS", StringComparison.OrdinalIgnoreCase)
                      || d.Title.Contains("FAMILY", StringComparison.OrdinalIgnoreCase)
                      || d.Title.Contains("BODY", StringComparison.OrdinalIgnoreCase)
                      || d.Title.Contains("MUSIC", StringComparison.OrdinalIgnoreCase)
                      || d.Title.Contains("COMMUNITY", StringComparison.OrdinalIgnoreCase)
                      || d.Title.Contains("INVENTIONS", StringComparison.OrdinalIgnoreCase)
                      || d.Title.Contains("GENDER", StringComparison.OrdinalIgnoreCase)
                      || d.Title.Contains("CULTURAL", StringComparison.OrdinalIgnoreCase)
                      || d.Title.Contains("ENVIRONMENT", StringComparison.OrdinalIgnoreCase)
                      || d.Title.Contains("LEARN", StringComparison.OrdinalIgnoreCase)
                      || d.Title.Contains("GENERATION", StringComparison.OrdinalIgnoreCase)
                      || d.Title.Contains("RELATIONSHIPS", StringComparison.OrdinalIgnoreCase)
                      || d.Title.Contains("INDEPENDENT", StringComparison.OrdinalIgnoreCase)
                      || d.Title.Contains("CARING", StringComparison.OrdinalIgnoreCase)
                      || d.Title.Contains("ASEAN", StringComparison.OrdinalIgnoreCase)
                      || d.Title.Contains("English", StringComparison.OrdinalIgnoreCase)
                      || d.Title.Contains("Tiếng Anh", StringComparison.OrdinalIgnoreCase))
                {
                    d.Category = "Tiếng Anh";
                    hasChanges = true;
                }
            }
        }
        if (hasChanges)
        {
            await context.SaveChangesAsync();
        }

        // 3. Khởi tạo dữ liệu phân loại mẫu vào bảng Categories nếu chưa có
        if (!context.Categories.Any())
        {
            var defaultCategories = new List<Category>
            {
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Lập trình",
                    Description = "Các bộ thẻ thuật ngữ công nghệ, code và khoa học máy tính",
                    Icon = "💻",
                    Color = "#2563eb",
                    CreatedAt = DateTime.UtcNow
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Tiếng Anh",
                    Description = "Các bộ thẻ từ vựng, ngữ pháp và mẫu câu giao tiếp tiếng Anh",
                    Icon = "🇬🇧",
                    Color = "#7c3aed",
                    CreatedAt = DateTime.UtcNow
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Khoa học",
                    Description = "Các bộ thẻ kiến thức khoa học tự nhiên và xã hội",
                    Icon = "🔬",
                    Color = "#059669",
                    CreatedAt = DateTime.UtcNow
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "Chung",
                    Description = "Phân loại chung cho các chủ đề khác",
                    Icon = "📁",
                    Color = "#64748b",
                    CreatedAt = DateTime.UtcNow
                }
            };

            context.Categories.AddRange(defaultCategories);
            await context.SaveChangesAsync();
        }

        // Nếu đã có dữ liệu từ 2 bộ thẻ trở lên thì giữ nguyên
        if (context.Decks.Count() >= 2) return;

        // Nếu DB rỗng hoàn toàn, chèn 3 bộ thẻ mẫu thuộc các nhóm danh mục khác nhau:
        if (!context.Decks.Any())
        {
            // ========================================================================
            // BỘ THẺ 1: LẬP TRÌNH (Chưa học nhiều, trạng thái NotStarted)
            // ========================================================================
            var programmingDeck = new Deck
            {
                Id = Guid.NewGuid(),
                Title = "Thuật ngữ Lập Trình Cơ Bản",
                Description = "Tổng hợp các khái niệm cốt lõi trong phát triển phần mềm và khoa học máy tính",
                Category = "Lập trình",
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            };

            var progCards = new List<Card>
            {
                new Card
                {
                    Id = Guid.NewGuid(),
                    DeckId = programmingDeck.Id,
                    Term = "API (Application Programming Interface)",
                    Definition = "Giao diện lập trình ứng dụng cho phép các phần mềm hoặc dịch vụ giao tiếp và trao đổi dữ liệu với nhau.",
                    Example = "RESTful API trả về dữ liệu dạng JSON cho ứng dụng di động hoặc web frontend.",
                    CreatedAt = DateTime.UtcNow
                },
                new Card
                {
                    Id = Guid.NewGuid(),
                    DeckId = programmingDeck.Id,
                    Term = "ORM (Object-Relational Mapping)",
                    Definition = "Kỹ thuật lập trình ánh xạ cấu trúc bảng trong cơ sở dữ liệu quan hệ sang các đối tượng (objects) trong mã nguồn.",
                    Example = "Entity Framework Core trong .NET tự động chuyển câu lệnh C# LINQ thành SQL queries.",
                    CreatedAt = DateTime.UtcNow
                },
                new Card
                {
                    Id = Guid.NewGuid(),
                    DeckId = programmingDeck.Id,
                    Term = "Spaced Repetition (Lặp lại ngắt quãng)",
                    Definition = "Phương pháp học tập dựa trên việc ôn tập lại kiến thức vào các khoảng thời gian tăng dần để tối ưu hoá trí nhớ dài hạn.",
                    Example = "Hệ thống Leitner hoặc thuật toán SuperMemo (SM-2) trong các app Anki, Quizlet, OpenQuiz.",
                    CreatedAt = DateTime.UtcNow
                },
                new Card
                {
                    Id = Guid.NewGuid(),
                    DeckId = programmingDeck.Id,
                    Term = "Dependency Injection (DI)",
                    Definition = "Kỹ thuật thiết kế phần mềm trong đó một đối tượng nhận các đối tượng phụ thuộc khác từ bên ngoài thay vì tự khởi tạo chúng.",
                    Example = "Đăng ký IDeckService vào IServiceCollection trong Program.cs của ASP.NET Core.",
                    CreatedAt = DateTime.UtcNow
                },
                new Card
                {
                    Id = Guid.NewGuid(),
                    DeckId = programmingDeck.Id,
                    Term = "State Management",
                    Definition = "Quá trình theo dõi và cập nhật trạng thái dữ liệu của ứng dụng người dùng qua các sự kiện hoặc tương tác.",
                    Example = "Sử dụng useState, useReducer hoặc Zustand trong ứng dụng React.",
                    CreatedAt = DateTime.UtcNow
                }
            };

            foreach (var card in progCards)
            {
                card.StudyProgress = new StudyProgress
                {
                    Id = Guid.NewGuid(),
                    CardId = card.Id,
                    Status = StudyStatus.NotStarted,
                    CorrectCount = 0,
                    IncorrectCount = 0,
                    ConsecutiveCorrect = 0,
                    NextReviewAt = DateTime.UtcNow
                };
            }
            programmingDeck.Cards = progCards;

            // ========================================================================
            // BỘ THẺ 2: TIẾNG ANH (Bộ thẻ học tiếng Anh giao tiếp)
            // ========================================================================
            var englishDeck = new Deck
            {
                Id = Guid.NewGuid(),
                Title = "Từ Vựng Tiếng Anh Công Sở (Business English)",
                Description = "Các từ vựng tiếng Anh thông dụng và chuyên nghiệp trong môi trường làm việc",
                Category = "Tiếng Anh",
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            };

            var englishCards = new List<Card>
            {
                new Card
                {
                    Id = Guid.NewGuid(),
                    DeckId = englishDeck.Id,
                    Term = "Deadline",
                    Definition = "Hạn chót hoặc thời điểm cuối cùng phải hoàn thành một công việc, dự án.",
                    Example = "We must submit the project proposal before tomorrow's deadline.",
                    CreatedAt = DateTime.UtcNow
                },
                new Card
                {
                    Id = Guid.NewGuid(),
                    DeckId = englishDeck.Id,
                    Term = "Collaboration",
                    Definition = "Sự hợp tác, cùng nhau làm việc giữa nhiều người hoặc các phòng ban để đạt mục tiêu chung.",
                    Example = "Effective collaboration between developers and designers produces great products.",
                    CreatedAt = DateTime.UtcNow
                },
                new Card
                {
                    Id = Guid.NewGuid(),
                    DeckId = englishDeck.Id,
                    Term = "Milestone",
                    Definition = "Cột mốc quan trọng đánh dấu một giai đoạn hoàn thành trong tiến độ dự án.",
                    Example = "Launching the beta version next month is our biggest milestone.",
                    CreatedAt = DateTime.UtcNow
                },
                new Card
                {
                    Id = Guid.NewGuid(),
                    DeckId = englishDeck.Id,
                    Term = "Brainstorming",
                    Definition = "Buổi họp động não thảo luận tự do nhằm nảy ra nhiều ý tưởng mới và sáng tạo.",
                    Example = "Let's organize a brainstorming session to solve this user experience issue.",
                    CreatedAt = DateTime.UtcNow
                },
                new Card
                {
                    Id = Guid.NewGuid(),
                    DeckId = englishDeck.Id,
                    Term = "Feedback",
                    Definition = "Ý kiến đóng góp, nhận xét và phản hồi mang tính xây dựng về sản phẩm hoặc hiệu suất.",
                    Example = "Customer feedback helped us improve the mobile app significantly.",
                    CreatedAt = DateTime.UtcNow
                }
            };

            foreach (var card in englishCards)
            {
                card.StudyProgress = new StudyProgress
                {
                    Id = Guid.NewGuid(),
                    CardId = card.Id,
                    Status = StudyStatus.NotStarted,
                    CorrectCount = 0,
                    IncorrectCount = 0,
                    ConsecutiveCorrect = 0,
                    NextReviewAt = DateTime.UtcNow
                };
            }
            englishDeck.Cards = englishCards;

            // ========================================================================
            // BỘ THẺ 3: BỘ THẺ ĐÃ HỌC (Đã có tiến độ, thẻ đã thuộc và đang học)
            // Giúp người dùng kiểm tra ngay chức năng lọc "Bộ thẻ đã học"
            // ========================================================================
            var studiedDeck = new Deck
            {
                Id = Guid.NewGuid(),
                Title = "Clean Code & Quy Tắc Refactoring",
                Description = "Bộ quy tắc viết mã nguồn sạch sẽ, dễ đọc, dễ bảo trì và mở rộng",
                Category = "Lập trình",
                CreatedAt = DateTime.UtcNow
            };

            var studiedCards = new List<Card>
            {
                new Card
                {
                    Id = Guid.NewGuid(),
                    DeckId = studiedDeck.Id,
                    Term = "DRY (Don't Repeat Yourself)",
                    Definition = "Nguyên lý không lặp lại code: mỗi mẩu tri thức hoặc logic xử lý chỉ nên tồn tại duy nhất ở một nơi trong hệ thống.",
                    Example = "Tách đoạn mã tính thuế bị lặp lại nhiều lần thành một hàm dùng chung TaxCalculator.",
                    CreatedAt = DateTime.UtcNow
                },
                new Card
                {
                    Id = Guid.NewGuid(),
                    DeckId = studiedDeck.Id,
                    Term = "KISS (Keep It Simple, Stupid)",
                    Definition = "Nguyên lý giữ cho thiết kế và thuật toán luôn đơn giản, tránh phức tạp hóa vấn đề không cần thiết.",
                    Example = "Viết hàm rõ ràng dễ đọc thay vì dùng các cú pháp một dòng quá tối nghĩa.",
                    CreatedAt = DateTime.UtcNow
                },
                new Card
                {
                    Id = Guid.NewGuid(),
                    DeckId = studiedDeck.Id,
                    Term = "Single Responsibility Principle (SRP)",
                    Definition = "Một lớp (class) hoặc module chỉ nên có duy nhất một lý do để thay đổi (chỉ đảm nhiệm một trách nhiệm duy nhất).",
                    Example = "Tách UserService (xử lý logic người dùng) và EmailSenderService (gửi email) thành 2 class riêng.",
                    CreatedAt = DateTime.UtcNow
                }
            };

            // Đặt thẻ này ở trạng thái Mastered (Đã thuộc) và Learning (Đang học)
            studiedCards[0].StudyProgress = new StudyProgress
            {
                Id = Guid.NewGuid(),
                CardId = studiedCards[0].Id,
                Status = StudyStatus.Mastered,
                CorrectCount = 4,
                IncorrectCount = 0,
                ConsecutiveCorrect = 3,
                NextReviewAt = DateTime.UtcNow.AddDays(7),
                LastReviewedAt = DateTime.UtcNow
            };

            studiedCards[1].StudyProgress = new StudyProgress
            {
                Id = Guid.NewGuid(),
                CardId = studiedCards[1].Id,
                Status = StudyStatus.Mastered,
                CorrectCount = 3,
                IncorrectCount = 1,
                ConsecutiveCorrect = 3,
                NextReviewAt = DateTime.UtcNow.AddDays(5),
                LastReviewedAt = DateTime.UtcNow
            };

            studiedCards[2].StudyProgress = new StudyProgress
            {
                Id = Guid.NewGuid(),
                CardId = studiedCards[2].Id,
                Status = StudyStatus.Learning,
                CorrectCount = 1,
                IncorrectCount = 1,
                ConsecutiveCorrect = 1,
                NextReviewAt = DateTime.UtcNow.AddHours(4),
                LastReviewedAt = DateTime.UtcNow
            };

            studiedDeck.Cards = studiedCards;

            context.Decks.AddRange(programmingDeck, englishDeck, studiedDeck);
            await context.SaveChangesAsync();
        }
        else if (context.Decks.Count() == 1)
        {
            // Nếu mới chỉ có 1 bộ thẻ, thêm bộ thẻ Tiếng Anh để người dùng có đầy đủ các phân loại thử nghiệm
            var existingDeck = await context.Decks.FirstAsync();
            existingDeck.Category = "Lập trình";

            var englishDeck = new Deck
            {
                Id = Guid.NewGuid(),
                Title = "Từ Vựng Tiếng Anh Công Sở (Business English)",
                Description = "Các từ vựng tiếng Anh thông dụng và chuyên nghiệp trong môi trường làm việc",
                Category = "Tiếng Anh",
                CreatedAt = DateTime.UtcNow
            };

            var englishCards = new List<Card>
            {
                new Card
                {
                    Id = Guid.NewGuid(),
                    DeckId = englishDeck.Id,
                    Term = "Deadline",
                    Definition = "Hạn chót hoặc thời điểm cuối cùng phải hoàn thành một công việc, dự án.",
                    Example = "We must submit the project proposal before tomorrow's deadline.",
                    CreatedAt = DateTime.UtcNow
                },
                new Card
                {
                    Id = Guid.NewGuid(),
                    DeckId = englishDeck.Id,
                    Term = "Collaboration",
                    Definition = "Sự hợp tác, cùng nhau làm việc giữa nhiều người hoặc các phòng ban để đạt mục tiêu chung.",
                    Example = "Effective collaboration between developers and designers produces great products.",
                    CreatedAt = DateTime.UtcNow
                },
                new Card
                {
                    Id = Guid.NewGuid(),
                    DeckId = englishDeck.Id,
                    Term = "Milestone",
                    Definition = "Cột mốc quan trọng đánh dấu một giai đoạn hoàn thành trong tiến độ dự án.",
                    Example = "Launching the beta version next month is our biggest milestone.",
                    CreatedAt = DateTime.UtcNow
                }
            };

            foreach (var card in englishCards)
            {
                card.StudyProgress = new StudyProgress
                {
                    Id = Guid.NewGuid(),
                    CardId = card.Id,
                    Status = StudyStatus.NotStarted,
                    CorrectCount = 0,
                    IncorrectCount = 0,
                    ConsecutiveCorrect = 0,
                    NextReviewAt = DateTime.UtcNow
                };
            }
            englishDeck.Cards = englishCards;

            context.Decks.Add(englishDeck);
            await context.SaveChangesAsync();
        }
    }

    private static async Task AddColumnIfNotExistsAsync(ApplicationDbContext context, string tableName, string columnName, string columnDefinition)
    {
        try
        {
            var conn = context.Database.GetDbConnection();
            var databaseName = conn.Database;
            if (conn.State != System.Data.ConnectionState.Open)
            {
                await conn.OpenAsync();
            }

            using var cmd = conn.CreateCommand();
            cmd.CommandText = @"
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_schema = @p0 AND table_name = @p1 AND column_name = @p2;";

            var p0 = cmd.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = databaseName; cmd.Parameters.Add(p0);
            var p1 = cmd.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = tableName; cmd.Parameters.Add(p1);
            var p2 = cmd.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = columnName; cmd.Parameters.Add(p2);

            var result = await cmd.ExecuteScalarAsync();
            var count = result != null && result != DBNull.Value ? Convert.ToInt32(result) : 0;
            if (count == 0)
            {
                using var alterCmd = conn.CreateCommand();
                alterCmd.CommandText = $"ALTER TABLE `{tableName}` ADD COLUMN `{columnName}` {columnDefinition};";
                await alterCmd.ExecuteNonQueryAsync();
            }
        }
        catch { }
    }

    private static async Task AddIndexIfNotExistsAsync(ApplicationDbContext context, string tableName, string indexName, string columnList)
    {
        try
        {
            var conn = context.Database.GetDbConnection();
            var databaseName = conn.Database;
            if (conn.State != System.Data.ConnectionState.Open)
            {
                await conn.OpenAsync();
            }

            using var cmd = conn.CreateCommand();
            cmd.CommandText = @"
                SELECT COUNT(*) 
                FROM information_schema.statistics 
                WHERE table_schema = @p0 AND table_name = @p1 AND index_name = @p2;";

            var p0 = cmd.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = databaseName; cmd.Parameters.Add(p0);
            var p1 = cmd.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = tableName; cmd.Parameters.Add(p1);
            var p2 = cmd.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = indexName; cmd.Parameters.Add(p2);

            var result = await cmd.ExecuteScalarAsync();
            var count = result != null && result != DBNull.Value ? Convert.ToInt32(result) : 0;
            if (count == 0)
            {
                using var idxCmd = conn.CreateCommand();
                idxCmd.CommandText = $"CREATE INDEX `{indexName}` ON `{tableName}` ({columnList});";
                await idxCmd.ExecuteNonQueryAsync();
            }
        }
        catch { }
    }
}
