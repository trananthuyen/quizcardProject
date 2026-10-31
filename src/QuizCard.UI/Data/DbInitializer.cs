using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using QuizCard.Entities;
using QuizCard.Entities.IdentifyEntities;

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

        // 1.2.1 Đảm bảo Role "Admin" và "User" tồn tại trong bảng AspNetRoles
        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                INSERT IGNORE INTO `AspNetRoles` (`Id`, `Name`, `NormalizedName`, `ConcurrencyStamp`)
                VALUES 
                ('11111111-1111-1111-1111-111111111111', 'Admin', 'ADMIN', '11111111-1111-1111-1111-111111111111'),
                ('22222222-2222-2222-2222-222222222222', 'User', 'USER', '22222222-2222-2222-2222-222222222222');
            ");
        }
        catch { }

       

        // 1.3 Đảm bảo bảng Decks có cột UserId, Folder, Tag để liên kết người dùng và phân loại
        await AddColumnIfNotExistsAsync(context, "Decks", "UserId", "CHAR(36) NULL");
        await AddIndexIfNotExistsAsync(context, "Decks", "IX_Decks_UserId", "`UserId`");
        await AddColumnIfNotExistsAsync(context, "Decks", "Folder", "VARCHAR(100) NOT NULL DEFAULT 'Chung'");
        await AddColumnIfNotExistsAsync(context, "Decks", "Tag", "VARCHAR(500) NULL");
        await AddIndexIfNotExistsAsync(context, "Decks", "IX_Decks_Folder", "`Folder`");

        // 1.4 Đảm bảo bảng Folders tồn tại và hỗ trợ UserId
        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS `Folders` (
                    `Id` CHAR(36) NOT NULL,
                    `UserId` CHAR(36) NULL,
                    `Name` VARCHAR(100) NOT NULL,
                    `Description` VARCHAR(500) NULL,
                    `Icon` VARCHAR(50) NOT NULL DEFAULT '📁',
                    `Color` VARCHAR(20) NOT NULL DEFAULT '#3b82f6',
                    `CreatedAt` DATETIME NOT NULL,
                    PRIMARY KEY (`Id`),
                    INDEX `IX_Folders_UserId` (`UserId`),
                    UNIQUE INDEX `IX_Folders_Name` (`Name`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");
        }
        catch { }

        await AddColumnIfNotExistsAsync(context, "Folders", "UserId", "CHAR(36) NULL");
        await AddIndexIfNotExistsAsync(context, "Folders", "IX_Folders_UserId", "`UserId`");

        // Đảm bảo bảng Decks có cột IsPublic để quản lý quyền chia sẻ lên Community
        await AddColumnIfNotExistsAsync(context, "Decks", "IsPublic", "TINYINT(1) NOT NULL DEFAULT 1");
        await AddIndexIfNotExistsAsync(context, "Decks", "IX_Decks_IsPublic", "`IsPublic`");

        // 1.4.1 Đảm bảo bảng StudyProgresses có cột UserId để quản lý tiến độ học độc lập của mỗi người
        await AddColumnIfNotExistsAsync(context, "StudyProgresses", "UserId", "CHAR(36) NULL");
        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                ALTER TABLE `StudyProgresses` DROP INDEX `IX_StudyProgresses_CardId`;
            ");
        }
        catch { }
        await AddIndexIfNotExistsAsync(context, "StudyProgresses", "IX_StudyProgresses_CardId_UserId", "`CardId`, `UserId`");
        await AddIndexIfNotExistsAsync(context, "StudyProgresses", "IX_StudyProgresses_UserId", "`UserId`");

        // 1.5 Đảm bảo các bảng DeletedDecks và DeletedCards (Thùng rác - Trash) tồn tại trong MySQL
        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS `DeletedDecks` (
                    `Id` CHAR(36) NOT NULL,
                    `UserId` CHAR(36) NULL,
                    `Title` VARCHAR(200) NOT NULL,
                    `Description` VARCHAR(1000) NULL,
                    `Folder` VARCHAR(100) NOT NULL DEFAULT 'Chung',
                    `Tag` VARCHAR(500) NULL,
                    `IsPublic` TINYINT(1) NOT NULL DEFAULT 1,
                    `OriginalCreatedAt` DATETIME NOT NULL,
                    `DeletedAt` DATETIME NOT NULL,
                    PRIMARY KEY (`Id`),
                    INDEX `IX_DeletedDecks_UserId` (`UserId`),
                    INDEX `IX_DeletedDecks_DeletedAt` (`DeletedAt`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");
        }
        catch { }

        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS `DeletedCards` (
                    `Id` CHAR(36) NOT NULL,
                    `DeletedDeckId` CHAR(36) NULL,
                    `ActiveDeckId` CHAR(36) NULL,
                    `Term` VARCHAR(500) NOT NULL,
                    `Definition` VARCHAR(2000) NOT NULL,
                    `Example` VARCHAR(2000) NULL,
                    `OriginalCreatedAt` DATETIME NOT NULL,
                    `DeletedAt` DATETIME NOT NULL,
                    `StudyStatus` INT NOT NULL DEFAULT 0,
                    `CorrectCount` INT NOT NULL DEFAULT 0,
                    `IncorrectCount` INT NOT NULL DEFAULT 0,
                    `ConsecutiveCorrect` INT NOT NULL DEFAULT 0,
                    `NextReviewAt` DATETIME NULL,
                    `LastReviewedAt` DATETIME NULL,
                    PRIMARY KEY (`Id`),
                    INDEX `IX_DeletedCards_DeletedDeckId` (`DeletedDeckId`),
                    INDEX `IX_DeletedCards_ActiveDeckId` (`ActiveDeckId`),
                    INDEX `IX_DeletedCards_DeletedAt` (`DeletedAt`),
                    CONSTRAINT `FK_DeletedCards_DeletedDecks` FOREIGN KEY (`DeletedDeckId`) 
                        REFERENCES `DeletedDecks` (`Id`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");
        }
        catch { }

        // 1.6 Đảm bảo bảng Recents (Lịch sử các bộ thẻ đã xem/học gần đây) tồn tại trong MySQL
        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS `Recents` (
                    `Id` CHAR(36) NOT NULL,
                    `UserId` CHAR(36) NULL,
                    `DeckId` CHAR(36) NOT NULL,
                    `ActionType` VARCHAR(50) NOT NULL DEFAULT 'VIEW',
                    `LastAccessedAt` DATETIME NOT NULL,
                    PRIMARY KEY (`Id`),
                    UNIQUE INDEX `IX_Recents_UserId_DeckId` (`UserId`, `DeckId`),
                    INDEX `IX_Recents_UserId` (`UserId`),
                    INDEX `IX_Recents_LastAccessedAt` (`LastAccessedAt`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");
            await context.Database.ExecuteSqlRawAsync(@"
                ALTER TABLE `Recents` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
            ");
        }
        catch { }

        // 1.7 Đảm bảo bảng CloudinaryVideos (Lưu trữ đường dẫn và metadata video Cloudinary) tồn tại trong MySQL
        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS `CloudinaryVideos` (
                    `Id` CHAR(36) NOT NULL,
                    `PublicId` VARCHAR(255) NOT NULL,
                    `Title` VARCHAR(255) NOT NULL,
                    `Description` VARCHAR(2000) NULL,
                    `SecureUrl` VARCHAR(1000) NOT NULL,
                    `Url` VARCHAR(1000) NULL,
                    `Format` VARCHAR(20) NULL,
                    `Duration` DOUBLE NOT NULL DEFAULT 0,
                    `Bytes` BIGINT NOT NULL DEFAULT 0,
                    `Width` INT NULL,
                    `Height` INT NULL,
                    `Folder` VARCHAR(100) NULL DEFAULT 'quizcard_videos',
                    `ThumbnailUrl` VARCHAR(1000) NULL,
                    `VttEnText` LONGTEXT NULL,
                    `VttEnUrl` VARCHAR(1000) NULL,
                    `VttEnPublicId` VARCHAR(255) NULL,
                    `VttViText` LONGTEXT NULL,
                    `VttViUrl` VARCHAR(1000) NULL,
                    `VttViPublicId` VARCHAR(255) NULL,
                    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
                    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `CreatedBy` VARCHAR(100) NULL,
                    PRIMARY KEY (`Id`),
                    UNIQUE INDEX `IX_CloudinaryVideos_PublicId` (`PublicId`),
                    INDEX `IX_CloudinaryVideos_CreatedAt` (`CreatedAt`),
                    INDEX `IX_CloudinaryVideos_IsActive` (`IsActive`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");
        }
        catch { }

        // Đảm bảo các cột phụ đề VTT (text & link) luôn được bổ sung vào bảng CloudinaryVideos
        await AddColumnIfNotExistsAsync(context, "CloudinaryVideos", "VttEnText", "LONGTEXT NULL");
        await AddColumnIfNotExistsAsync(context, "CloudinaryVideos", "VttEnUrl", "VARCHAR(1000) NULL");
        await AddColumnIfNotExistsAsync(context, "CloudinaryVideos", "VttEnPublicId", "VARCHAR(255) NULL");
        await AddColumnIfNotExistsAsync(context, "CloudinaryVideos", "VttViText", "LONGTEXT NULL");
        await AddColumnIfNotExistsAsync(context, "CloudinaryVideos", "VttViUrl", "VARCHAR(1000) NULL");
        await AddColumnIfNotExistsAsync(context, "CloudinaryVideos", "VttViPublicId", "VARCHAR(255) NULL");

        // 1.8 Đảm bảo bảng RequestLogs (Theo dõi request từ người dùng) tồn tại trong MySQL
        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS `RequestLogs` (
                    `Id` CHAR(36) NOT NULL,
                    `UserId` CHAR(36) NULL,
                    `UserEmail` VARCHAR(255) NULL,
                    `IpAddress` VARCHAR(100) NULL,
                    `Method` VARCHAR(10) NOT NULL,
                    `Path` VARCHAR(500) NOT NULL,
                    `QueryString` VARCHAR(1000) NULL,
                    `StatusCode` INT NOT NULL,
                    `DurationMs` DOUBLE NOT NULL,
                    `UserAgent` VARCHAR(1000) NULL,
                    `ErrorMessage` TEXT NULL,
                    `RequestBody` TEXT NULL,
                    `CreatedAt` DATETIME NOT NULL,
                    PRIMARY KEY (`Id`),
                    INDEX `IX_RequestLogs_UserId` (`UserId`),
                    INDEX `IX_RequestLogs_CreatedAt` (`CreatedAt`),
                    INDEX `IX_RequestLogs_StatusCode` (`StatusCode`),
                    INDEX `IX_RequestLogs_Path` (`Path`),
                    INDEX `IX_RequestLogs_Method` (`Method`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");
        }
        catch { }

        // 1.7.1 Khởi tạo dữ liệu video mẫu nếu bảng CloudinaryVideos chưa có dữ liệu
        try
        {
            if (!await context.CloudinaryVideos.AnyAsync())
            {
                var sampleVideos = new List<CloudinaryVideo>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        PublicId = "quizcard_videos/sample_ai_podcast",
                        Title = "Podcast: AI & Thiết Kế Sản Phẩm Tương Lai",
                        Description = "Học từ vựng và hội thoại tự nhiên về chủ đề Trí tuệ nhân tạo (AI) và Tư duy thiết kế sản phẩm công nghệ.",
                        SecureUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
                        Format = "mp4",
                        Duration = 15.0,
                        Bytes = 3500000,
                        Width = 1280,
                        Height = 720,
                        Folder = "quizcard_videos",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddDays(-2),
                        CreatedBy = "Admin"
                    },
                    new()
                    {
                        Id = Guid.NewGuid(),
                        PublicId = "quizcard_videos/sample_tech_interview",
                        Title = "Phỏng Vấn Kỹ Thuật: Senior React & TypeScript",
                        Description = "Tình huống phỏng vấn thực tế vị trí Senior Frontend với các câu hỏi về tối ưu render, DOM và hiệu năng 60fps.",
                        SecureUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                        Format = "mp4",
                        Duration = 60.0,
                        Bytes = 8500000,
                        Width = 1280,
                        Height = 720,
                        Folder = "quizcard_videos",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow.AddDays(-1),
                        CreatedBy = "Admin"
                    },
                    new()
                    {
                        Id = Guid.NewGuid(),
                        PublicId = "quizcard_videos/sample_coffee_talk",
                        Title = "Trò Chuyện Cuối Tuần Tại Quán Cà Phê",
                        Description = "Luyện nghe nói tiếng Anh giao tiếp đời thường, phản xạ đặt câu và ngữ điệu tự nhiên qua cuộc hẹn cà phê.",
                        SecureUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                        Format = "mp4",
                        Duration = 45.0,
                        Bytes = 6200000,
                        Width = 1280,
                        Height = 720,
                        Folder = "quizcard_videos",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = "Admin"
                    }
                };

                await context.CloudinaryVideos.AddRangeAsync(sampleVideos);
                await context.SaveChangesAsync();
            }
        }
        catch { }

        // 1.7 Tự động phân loại và gán Folder, Tag thông minh cho các bộ thẻ hiện có
        var allExistingDecks = await context.Decks.ToListAsync();
        bool hasChanges = false;
        foreach (var d in allExistingDecks)
        {
            if (string.IsNullOrEmpty(d.Folder) || d.Folder == "Chung")
            {
                if (d.Title.Contains("Lập Trình", StringComparison.OrdinalIgnoreCase))
                {
                    d.Folder = "Lập trình";
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
                    d.Folder = "Tiếng Anh";
                    hasChanges = true;
                }
            }

            if (string.IsNullOrWhiteSpace(d.Tag))
            {
                if (d.Folder == "Lập trình" || d.Title.Contains("Lập Trình", StringComparison.OrdinalIgnoreCase))
                {
                    d.Tag = "programming, csharp, dotnet, coding";
                    hasChanges = true;
                }
                else if (d.Folder == "Tiếng Anh" || d.Title.Contains("English", StringComparison.OrdinalIgnoreCase) || d.Title.Contains("Tiếng Anh", StringComparison.OrdinalIgnoreCase))
                {
                    d.Tag = "english, toeic, ielts, vocabulary";
                    hasChanges = true;
                }
                else
                {
                    d.Tag = "general, flashcard";
                    hasChanges = true;
                }
            }
        }
        if (hasChanges)
        {
            await context.SaveChangesAsync();
        }

        // 3. Khởi tạo dữ liệu thư mục mẫu vào bảng Folders nếu chưa có
        if (!context.Folders.Any())
        {
            var defaultFolders = new List<Folder>
            {
                new Folder
                {
                    Id = Guid.NewGuid(),
                    Name = "Lập trình",
                    Description = "Các bộ thẻ thuật ngữ công nghệ, code và khoa học máy tính",
                    Icon = "💻",
                    Color = "#2563eb",
                    CreatedAt = DateTime.UtcNow
                },
                new Folder
                {
                    Id = Guid.NewGuid(),
                    Name = "Tiếng Anh",
                    Description = "Các bộ thẻ từ vựng, ngữ pháp và mẫu câu giao tiếp tiếng Anh",
                    Icon = "🇬🇧",
                    Color = "#7c3aed",
                    CreatedAt = DateTime.UtcNow
                },
                new Folder
                {
                    Id = Guid.NewGuid(),
                    Name = "Khoa học",
                    Description = "Các bộ thẻ kiến thức khoa học tự nhiên và xã hội",
                    Icon = "🔬",
                    Color = "#059669",
                    CreatedAt = DateTime.UtcNow
                },
                new Folder
                {
                    Id = Guid.NewGuid(),
                    Name = "Chung",
                    Description = "Thư mục chung cho các chủ đề khác",
                    Icon = "📁",
                    Color = "#64748b",
                    CreatedAt = DateTime.UtcNow
                }
            };

            context.Folders.AddRange(defaultFolders);
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
                Folder = "Lập trình",
                Tag = "programming, csharp, dotnet, coding",
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
                Folder = "Tiếng Anh",
                Tag = "english, toeic, ielts, communication",
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
                Folder = "Lập trình",
                Tag = "programming, csharp, dotnet, coding",
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
            existingDeck.Folder = "Lập trình";

            var englishDeck = new Deck
            {
                Id = Guid.NewGuid(),
                Title = "Từ Vựng Tiếng Anh Công Sở (Business English)",
                Description = "Các từ vựng tiếng Anh thông dụng và chuyên nghiệp trong môi trường làm việc",
                Folder = "Tiếng Anh",
                Tag = "english, toeic, ielts, communication",
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
