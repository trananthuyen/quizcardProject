using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Facebook;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.EntityFrameworkCore;
using QuizCard.Entities;
using QuizCard.UI.Data;
using QuizCard.UI.StartupExtensions;

/// <summary>
/// File điểm nhập (Entry Point) của ứng dụng ASP.NET Core (.NET 10).
/// Chịu trách nhiệm:
/// 1. Cấu hình các dịch vụ vào IoC Container (Services Registration): Database, Repositories, DI Services, CORS, Controllers.
/// 2. Khởi tạo CSDL SQLite và nạp dữ liệu mẫu khi ứng dụng khởi chạy.
/// 3. Cấu hình chuỗi Middleware đường ống xử lý HTTP Request (Pipeline) và phục vụ SPA (React).
/// </summary>
var builder = WebApplication.CreateBuilder(args);

// ============================================================================
// 1. ĐĂNG KÝ CÁC DỊCH VỤ (DEPENDENCY INJECTION & CONFIGURATION)
// ============================================================================

// Đăng ký dịch vụ hỗ trợ Controller REST API
builder.Services.AddControllers();

// Cấu hình kết nối cơ sở dữ liệu MySQL:
// Đọc chuỗi kết nối từ appsettings.json
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySQL(connectionString)
);

// ================= SERVICES =================
builder.Services.ConfigureService(builder.Configuration);

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

// ============ DATABASE INITIALIZATION ============================

// Tạo một phạm vi (Scope) tạm thời để lấy DbContext và chạy migration/seed dữ liệu
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await DbInitializer.InitializeAsync(context);
}

// ========== CONFIGURE HTTP REQUEST PIPELINE (MIDDLEWARE) ===================

// Kích hoạt chính sách CORS
app.UseCors("AllowAll");

// Cho phép phục vụ các tập tin tĩnh trong thư mục wwwroot (bản build của React: index.html, JS, CSS)
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();

// Xác thực & Phân quyền Identity Middleware
app.UseAuthentication();
app.UseAuthorization();

// Định tuyến các yêu cầu API tới các Controller tương ứng (/api/decks, /api/cards, /api/study)
app.MapControllers();

// Cơ chế SPA Fallback: Khi người dùng truy cập các đường dẫn không phải API,
// server sẽ luôn trả về index.html để React Router / SPA xử lý chuyển trang
app.MapFallbackToFile("index.html");

// Khởi chạy ứng dụng Web
app.Run();
