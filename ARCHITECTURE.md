# KIẾN TRÚC HỆ THỐNG QUIZCARD (SYSTEM ARCHITECTURE)

Tài liệu này mô tả chi tiết kiến trúc giải pháp, tổ chức tầng (Clean Architecture / Layered Architecture), luồng dữ liệu, cấu trúc thư mục, mô hình dữ liệu và các thành phần chính của hệ thống **QuizCard**.


## 1. Cấu Trúc Thư Mục Dự Án (Project Directory Structure)

Cấu trúc cây thư mục chi tiết phản ánh chính xác cấu trúc mã nguồn hiện tại của solution:

```text
quizcardProject/
│
├── QuizCard.slnx                               # Solution file định dạng chuẩn mới của .NET 10
├── ARCHITECTURE.md                             # Tài liệu kiến trúc hệ thống
├── README.md                                   # Hướng dẫn cài đặt, cấu hình & chạy dự án
├── quizcard_mysql.sql                          # Script khởi tạo CSDL & dữ liệu mẫu cho MySQL
├── .gitignore                                  # Cấu hình loại trừ file build, database, node_modules
│
├── QuizCard.RepositoryContracts/               # Class Library: Hợp đồng giao tiếp tầng dữ liệu
│   ├── ICardsRespository.cs                    # Interface truy vấn thẻ Flashcard
│   ├── ICategoriesRespository.cs               # Interface truy vấn danh mục
│   └── QuizCard.RepositoryContracts.csproj
│
├── QuizCard.ServiceContracts/                  # Class Library: Hợp đồng tầng dịch vụ & DTOs
│   ├── ICardService.cs                         # Interface nghiệp vụ thẻ
│   ├── ICategoryService.cs                     # Interface nghiệp vụ danh mục
│   ├── IDeckService.cs                         # Interface nghiệp vụ bộ thẻ
│   ├── IStudyService.cs                        # Interface nghiệp vụ học & trắc nghiệm
│   ├── ITtsService.cs                          # Interface dịch vụ phát âm Text-to-Speech
│   ├── DTOs/                                   # Nhóm Data Transfer Objects
│   │   ├── CardDTOs/                           # DTOs liên quan đến thẻ
│   │   │   ├── CardDto.cs
│   │   │   ├── CreateCardRequest.cs
│   │   │   ├── UpdateCardRequest.cs
│   │   │   └── StudyProgressDto.cs
│   │   ├── CategoryDTOs/                       # DTOs liên quan đến danh mục
│   │   │   ├── CategoryDto.cs
│   │   │   ├── CreateCategoryRequest.cs
│   │   │   └── UpdateCategoryRequest.cs
│   │   ├── DeckDTOs/                           # DTOs liên quan đến bộ thẻ
│   │   │   ├── DeckDto.cs
│   │   │   ├── CreateDeckRequest.cs
│   │   │   └── UpdateDeckRequest.cs
│   │   └── StudyDTOs/                          # DTOs phiên học tập & trắc nghiệm
│   │       ├── StudyCardDto.cs
│   │       ├── AnswerCardRequest.cs
│   │       ├── AnswerCardResponse.cs
│   │       └── DeckStudyStatsDto.cs
│   ├── Enums/                                  # Enum dùng chung tầng hợp đồng
│   │   └── StudyStatusOptions.cs
│   └── QuizCard.ServiceContracts.csproj
│
└── src/
    ├── QuizCard.Entities/                      # Class Library: Domain Model & Entity Framework Core
    │   ├── ApplicationDbContext.cs             # EF Core DbContext cấu hình quan hệ thực thể
    │   ├── Deck.cs                             # Thực thể Bộ thẻ (Deck)
    │   ├── Card.cs                             # Thực thể Thẻ Flashcard (Card)
    │   ├── Category.cs                         # Thực thể Phân loại / Chủ đề (Category)
    │   ├── StudyProgress.cs                    # Thực thể Tiến độ học tập cá nhân của thẻ
    │   ├── StudyStatus.cs                      # Enum trạng thái học: NotStarted, Learning, Mastered
    │   └── QuizCard.Entities.csproj
    │
    ├── QuizCard.Repositories/                  # Class Library: Cài đặt Repository cụ thể
    │   ├── CardsRespository.cs                 # Cài đặt truy vấn bảng Cards
    │   ├── CategoriesRespository.cs            # Cài đặt truy vấn bảng Categories
    │   ├── DecksRespository.cs                 # Cài đặt truy vấn bảng Decks
    │   ├── StudyProgressesRespository.cs       # Cài đặt truy vấn bảng StudyProgresses
    │   └── QuizCard.Repositories.csproj
    │
    ├── QuizCard.Services/                      # Class Library: Cài đặt tầng nghiệp vụ (Business Logic)
    │   ├── Services/
    │   │   ├── CardService.cs                  # Xử lý CRUD thẻ, tạo thẻ hàng loạt từ văn bản
    │   │   ├── CategoryService.cs              # Xử lý CRUD danh mục & đếm số bộ thẻ
    │   │   ├── DeckService.cs                  # Xử lý CRUD bộ thẻ & tổng hợp số liệu
    │   │   ├── StudyService.cs                 # Thuật toán Spaced Repetition SM-2 & trắc nghiệm
    │   │   └── TtsService.cs                   # Tích hợp phát âm từ vựng Google TTS
    │   └── QuizCard.Services.csproj
    │
    └── QuizCard.UI/                            # ASP.NET Core 10 Web Host & React SPA
        ├── Controllers/                        # Các RESTful API Controllers
        │   ├── CardsController.cs              # Quản lý thẻ qua HTTP
        │   ├── CategoriesController.cs         # Quản lý danh mục qua HTTP
        │   ├── DecksController.cs              # Quản lý bộ thẻ qua HTTP
        │   ├── StudyController.cs              # Quản lý phiên học, nộp đáp án, lấy câu hỏi
        │   └── TtsController.cs                # Proxy âm thanh phát âm Text-to-Speech
        ├── Data/
        │   └── DbInitializer.cs                # Nạp schema & dữ liệu mẫu (Seeding) khi khởi động
        ├── Properties/
        │   └── launchSettings.json             # Cấu hình cổng chạy dev (HTTP 5030)
        ├── Program.cs                          # File khởi động, DI container, Middleware pipeline
        ├── appsettings.json                    # Connection String SQLite & cấu hình hệ thống
        ├── quizcard.db                         # Cơ sở dữ liệu SQLite cục bộ
        ├── QuizCard.UI.csproj                  # Cấu hình MSBuild tự build ClientApp ra wwwroot
        │
        ├── wwwroot/                            # Static Files: Thư mục chứa gói build của React
        │   ├── index.html
        │   └── assets/ (js, css, images)
        │
        └── ClientApp/                          # Mã nguồn Single Page Application (React 19)
            ├── index.html                      # Template HTML chính
            ├── vite.config.ts                  # Cấu hình Vite build ra wwwroot & proxy API
            ├── tsconfig.json                   # Cấu hình TypeScript
            ├── package.json                    # Danh sách package npm (lucide-react, canvas-confetti...)
            └── src/
                ├── main.tsx                    # Entry point React, bọc ThemeProvider
                ├── App.tsx                     # Điều hướng View chính (Tab/Hash Routing) & Layout
                ├── App.css                     # CSS biến toàn cục, header, streak, stats
                ├── index.css                   # Cấu hình CSS cơ bản & Theme mode (Dark/Light)
                ├── api.ts                      # Client gọi API Backend thống nhất
                ├── types.ts                    # TypeScript Interfaces tương ứng với backend DTOs
                ├── context/
                │   └── ThemeContext.tsx        # Quản lý Theme: Light / Dark / System Theme
                ├── utils/
                │   └── tts.ts                  # Hỗ trợ phát âm từ vựng (Audio API & Cache)
                └── components/                 # Các UI Components chuyên biệt
                    ├── Navbar.tsx              # Thanh điều hướng trên cùng, tìm kiếm & profile
                    ├── Sidebar.tsx             # Menu cạnh bên trái điều hướng tính năng
                    ├── UserMenu.tsx            # Popup thông tin tài khoản & menu đổi giao diện (Theme)
                    ├── HeroBanner.tsx          # Banner chào mừng, thống kê nhanh & nút thao tác
                    ├── FilterPills.tsx         # Thanh lọc nhanh danh mục và trạng thái bộ thẻ
                    ├── DeckList.tsx            # Danh sách lưới bộ thẻ & phân trang/lọc
                    ├── DeckCard.tsx            # Card hiển thị thông tin, tiến độ % của bộ thẻ
                    ├── DeckModal.tsx           # Modal thêm / sửa thông tin bộ thẻ
                    ├── CategoryModal.tsx       # Modal quản lý danh mục / chủ đề
                    ├── MyResources.tsx         # Trang thống kê toàn diện kho học liệu cá nhân
                    ├── FolderList.tsx          # Quản lý tài nguyên theo thư mục
                    ├── TrashView.tsx           # Thùng rác xem và khôi phục các bộ thẻ đã xóa
                    ├── VideoTutorials.tsx      # Danh sách video hướng dẫn học tập
                    ├── CardManager.tsx         # Quản lý danh sách thẻ, thêm thẻ lẻ / tạo nhanh
                    ├── StudyArena.tsx          # Không gian học thẻ lật 3D (Flashcard Flip)
                    ├── QuizArena.tsx           # Không gian thi đấu trắc nghiệm 4 phương án
                    └── HelpModal.tsx           # Modal hướng dẫn sử dụng phím tắt & tính năng
```



## 2. Danh Sách RESTful API Endpoints

| Phương Thức | Endpoint | Mô Tả |
| :--- | :--- | :--- |
| **GET** | `/api/decks` | Lấy danh sách bộ thẻ (hỗ trợ lọc theo `?category=...`) |
| **GET** | `/api/decks/{id}` | Lấy thông tin chi tiết một bộ thẻ |
| **POST** | `/api/decks` | Tạo mới một bộ thẻ |
| **PUT** | `/api/decks/{id}` | Cập nhật thông tin bộ thẻ |
| **DELETE** | `/api/decks/{id}` | Xóa bộ thẻ (kèm xóa toàn bộ thẻ con) |
| **GET** | `/api/cards/deck/{deckId}` | Lấy tất cả thẻ của một bộ kèm tiến độ học |
| **GET** | `/api/cards/{id}` | Lấy chi tiết một thẻ |
| **POST** | `/api/cards` | Tạo một thẻ mới đơn lẻ |
| **POST** | `/api/cards/deck/{deckId}/bulk` | Tạo hàng loạt thẻ từ chuỗi định dạng văn bản |
| **PUT** | `/api/cards/{id}` | Cập nhật nội dung mặt trước, mặt sau, ví dụ |
| **DELETE** | `/api/cards/{id}` | Xóa một thẻ |
| **GET** | `/api/categories` | Lấy danh sách danh mục & số lượng bộ thẻ |
| **POST** | `/api/categories` | Tạo mới phân loại |
| **PUT** | `/api/categories/{id}` | Cập nhật thông tin phân loại |
| **DELETE** | `/api/categories/{id}` | Xóa phân loại |
| **GET** | `/api/study/deck/{deckId}/stats` | Thống kê số lượng thẻ cần ôn, đã thuộc, đang học |
| **GET** | `/api/study/deck/{deckId}/cards` | Lấy danh sách thẻ tới hạn ôn tập (Spaced Repetition) |
| **POST** | `/api/study/answer` | Nộp kết quả ôn tập (Đúng/Sai) và cập nhật SM-2 |
| **GET** | `/api/study/deck/{deckId}/quiz` | Lấy danh sách câu hỏi trắc nghiệm 4 phương án |
| **GET** | `/api/tts` | Phát âm từ vựng (Query `?text=...&lang=...`) |
