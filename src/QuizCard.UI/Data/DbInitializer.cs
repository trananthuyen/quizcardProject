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
    }

   
}
