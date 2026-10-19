using Microsoft.EntityFrameworkCore;
using QuizCard.Services.Data;
using QuizCard.Services.Services;
using QuizCard.UI.Data;

/// <summary>
/// File điểm nhập (Entry Point) của ứng dụng ASP.NET Core (.NET 10).
/// Chịu trách nhiệm:
/// 1. Cấu hình các dịch vụ vào IoC Container (Services Registration): Database, DI Services, CORS, Controllers.
/// 2. Khởi tạo CSDL SQLite và nạp dữ liệu mẫu khi ứng dụng khởi chạy.
/// 3. Cấu hình chuỗi Middleware đường ống xử lý HTTP Request (Pipeline) và phục vụ SPA (React).
/// </summary>
var builder = WebApplication.CreateBuilder(args);

// ============================================================================
// 1. ĐĂNG KÝ CÁC DỊCH VỤ (DEPENDENCY INJECTION & CONFIGURATION)
// ============================================================================

// Đăng ký dịch vụ hỗ trợ Controller REST API
builder.Services.AddControllers();

// Cấu hình kết nối cơ sở dữ liệu SQLite:
// Đọc chuỗi kết nối từ appsettings.json, nếu không có thì mặc định file "quizcard.db"
var rawConn = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=quizcard.db";

// Nếu chuỗi kết nối sử dụng đường dẫn tương đối, gắn với ContentRootPath của ứng dụng
// để đảm bảo dù ứng dụng được khởi chạy từ bất kỳ thư mục nào cũng đọc đúng file database cùng cấp
var connectionString = rawConn;
if (rawConn.StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase))
{
    var pathPart = rawConn.Substring("Data Source=".Length).Trim();
    if (!Path.IsPathRooted(pathPart))
    {
        var absolutePath = Path.Combine(builder.Environment.ContentRootPath, pathPart);
        connectionString = $"Data Source={absolutePath}";
    }
}

builder.Services.AddDbContext<QuizCardDbContext>(options =>
    options.UseSqlite(connectionString));

// Đăng ký các tầng nghiệp vụ (Business Services) theo vòng đời Scoped (mỗi HTTP request một instance):
// - IDeckService     -> DeckService     (Xử lý CRUD bộ thẻ)
// - ICardService     -> CardService     (Xử lý CRUD thẻ, tạo thẻ từ chuỗi)
// - IStudyService    -> StudyService    (Xử lý thuật toán Spaced Repetition, phiên học, trắc nghiệm)
// - ICategoryService -> CategoryService (Xử lý CRUD phân loại bộ thẻ)
// - ITtsService      -> TtsService      (Xử lý phát âm từ vựng bên thứ 3)
builder.Services.AddScoped<IDeckService, DeckService>();
builder.Services.AddScoped<ICardService, CardService>();
builder.Services.AddScoped<IStudyService, StudyService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddSingleton<ITtsService, TtsService>();

// Cấu hình chính sách CORS để cho phép máy chủ phát triển React Vite (port 5173) gọi API dễ dàng
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// ============================================================================
// 2. KHỞI TẠO CSDL & NẠP DỮ LIỆU MẪU (DATABASE INITIALIZATION)
// ============================================================================
// Tạo một phạm vi (Scope) tạm thời để lấy DbContext và chạy migration/seed dữ liệu
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<QuizCardDbContext>();
    await DbInitializer.InitializeAsync(context);
}

// ============================================================================
// 3. CẤU HÌNH HTTP REQUEST PIPELINE (MIDDLEWARE)
// ============================================================================

// Kích hoạt chính sách CORS
app.UseCors("AllowAll");

// Cho phép phục vụ các tập tin tĩnh trong thư mục wwwroot (bản build của React: index.html, JS, CSS)
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();

// Định tuyến các yêu cầu API tới các Controller tương ứng (/api/decks, /api/cards, /api/study)
app.MapControllers();

// Cơ chế SPA Fallback: Khi người dùng truy cập các đường dẫn không phải API,
// server sẽ luôn trả về index.html để React Router / SPA xử lý chuyển trang
app.MapFallbackToFile("index.html");

// Khởi chạy ứng dụng Web
app.Run();
