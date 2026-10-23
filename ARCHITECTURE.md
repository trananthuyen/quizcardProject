## Cấu Trúc Thư Mục Dự Án (Directory Structure)

```text
quizcardProject/
│
├── QuizCard.slnx                       # File giải pháp .NET 10 Solution (Cấu hình chuẩn mới)
├── ARCHITECTURE.md                     # Tài liệu kiến trúc hệ thống
├── README.md                           # Hướng dẫn cài đặt và sử dụng
├── .gitignore                          # Cấu hình loại trừ file build, database, node_modules
│
├── src/
│   ├── QuizCard.Services/              # Class Library: Domain Entities & Business Logic
│   │   ├── Data/
│   │   │   └── QuizCardDbContext.cs    # EF Core DbContext cho SQLite
│   │   ├── DTOs/                       # Các DTO trao đổi dữ liệu qua API
│   │   │   ├── DeckDtos.cs
│   │   │   ├── CardDtos.cs
│   │   │   ├── StudyDtos.cs
│   │   │   └── CategoryDtos.cs
│   │   ├── Models/                     # Các thực thể CSDL (Entities)
│   │   │   ├── Deck.cs
│   │   │   ├── Card.cs
│   │   │   ├── Category.cs
│   │   │   ├── StudyProgress.cs
│   │   │   └── StudyStatus.cs
│   │   └── Services/                   # Tầng nghiệp vụ xử lý nghiệp vụ
│   │       ├── IDeckService.cs / DeckService.cs
│   │       ├── ICardService.cs / CardService.cs
│   │       ├── IStudyService.cs / StudyService.cs
│   │       ├── ICategoryService.cs / CategoryService.cs
│   │       └── ITtsService.cs / TtsService.cs
│   │
│   └── QuizCard.UI/                    # Web API & Single Host Server
│       ├── Controllers/                # Các Controller RESTful API
│       │   ├── DecksController.cs
│       │   ├── CardsController.cs
│       │   ├── StudyController.cs
│       │   ├── CategoriesController.cs
│       │   └── TtsController.cs
│       ├── Data/
│       │   └── DbInitializer.cs        # Tự động khởi tạo DB, tạo bảng, nạp dữ liệu mẫu
│       ├── Properties/
│       │   └── launchSettings.json     # Cấu hình cổng chạy khi debug (Port 5030)
│       ├── Program.cs                  # Entry point, DI container, Middleware pipeline
│       ├── appsettings.json            # Cấu hình Connection String SQLite
│       ├── QuizCard.UI.csproj          # Cấu hình MSBuild, tự động build React khi Publish
│       │
│       ├── wwwroot/                    # Thư mục chứa gói build tĩnh của React SPA
│       │   ├── index.html
│       │   └── assets/ (js, css)
│       │
│       └── ClientApp/                  # Mã nguồn Frontend React SPA
│           ├── package.json
│           ├── vite.config.ts          # Cấu hình Vite build ra ../wwwroot & proxy API
│           ├── src/
│           │   ├── App.tsx             # Root component, điều phối Hash Router
│           │   ├── api.ts              # API Client gọi REST API
│           │   ├── types.ts            # Định nghĩa kiểu TypeScript
│           │   ├── utils/
│           │   │   └── tts.ts          # Tiện ích phát âm Google TTS
│           │   └── components/         # Các màn hình chính
│           │       ├── Navbar.tsx      # Thanh tiêu đề trên cùng
│           │       ├── DeckList.tsx    # Danh sách bộ thẻ & bộ lọc phân loại
│           │       ├── CardManager.tsx # Quản lý thẻ & Tạo thẻ từ chuỗi
│           │       ├── StudyArena.tsx  # Phòng học lật thẻ 3D
│           │       └── QuizArena.tsx   # Phòng thi trắc nghiệm 4 đáp án
```


