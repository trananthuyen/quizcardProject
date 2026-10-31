using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using QuizCard.Entities.IdentifyEntities;

namespace QuizCard.Entities;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    /// <summary>
    /// Bảng lưu trữ danh sách các Bộ thẻ (Decks / Projects).
    /// </summary>
    public DbSet<Deck> Decks => Set<Deck>();

    /// <summary>
    /// Bảng lưu trữ danh sách các Thẻ Flashcard.
    /// </summary>
    public DbSet<Card> Cards => Set<Card>();

    /// <summary>
    /// Bảng lưu trữ tiến trình học tập, trí nhớ của từng thẻ Flashcard.
    /// </summary>
    public DbSet<StudyProgress> StudyProgresses => Set<StudyProgress>();

    /// <summary>
    /// Bảng lưu trữ danh sách các Thư mục bộ thẻ (Folders).
    /// </summary>
    public DbSet<Folder> Folders => Set<Folder>();

    /// <summary>
    /// Bảng lưu trữ lịch sử điểm danh và duy trì chuỗi lửa của người dùng.
    /// </summary>
    public DbSet<Attendance> Attendances => Set<Attendance>();

    /// <summary>
    /// Bảng lưu trữ danh sách các Bộ thẻ đã bị xóa tạm thời (Thùng rác - Trash).
    /// </summary>
    public DbSet<DeletedDeck> DeletedDecks => Set<DeletedDeck>();

    /// <summary>
    /// Bảng lưu trữ danh sách các Thẻ Flashcard đã bị xóa tạm thời (Thùng rác - Trash).
    /// </summary>
    public DbSet<DeletedCard> DeletedCards => Set<DeletedCard>();

    /// <summary>
    /// Bảng lưu trữ danh sách các Bộ thẻ người dùng đã xem hoặc học tập gần đây (Recents).
    /// </summary>
    public DbSet<Recent> Recents => Set<Recent>();

    /// <summary>
    /// Bảng lưu trữ danh sách và đường dẫn video được lưu trữ trên Cloudinary.
    /// </summary>
    public DbSet<CloudinaryVideo> CloudinaryVideos => Set<CloudinaryVideo>();

    /// <summary>
    /// Bảng lưu trữ toàn bộ nhật ký các yêu cầu (Request Logs) của người dùng gửi tới hệ thống.
    /// </summary>
    public DbSet<RequestLog> RequestLogs => Set<RequestLog>();

    /// <summary>
    /// Cấu hình chi tiết các bảng, độ dài cột và quan hệ giữa các bảng (Fluent API).
    /// </summary>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. Cấu hình bảng Deck (Bộ thẻ)
        modelBuilder.Entity<Deck>(entity =>
        {
            entity.HasKey(d => d.Id);
            entity.Property(d => d.Title).IsRequired().HasMaxLength(200);
            entity.Property(d => d.Description).HasMaxLength(1000);
            entity.Property(d => d.Folder).IsRequired().HasMaxLength(100).HasDefaultValue("Chung");
            entity.Property(d => d.Tag).HasMaxLength(500);
            entity.Property(d => d.IsPublic).IsRequired().HasDefaultValue(true);
            entity.HasIndex(d => d.UserId);
            entity.HasIndex(d => d.Folder);
            entity.HasIndex(d => d.IsPublic);

            // Quan hệ 1 - N: Một Deck có nhiều Cards.
            // Khi xóa Deck -> Toàn bộ Cards con sẽ tự động bị xóa theo (Cascade Delete).
            entity.HasMany(d => d.Cards)
                  .WithOne(c => c.Deck)
                  .HasForeignKey(c => c.DeckId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // 2. Cấu hình bảng Card (Thẻ Flashcard)
        modelBuilder.Entity<Card>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Term).IsRequired().HasMaxLength(500);
            entity.Property(c => c.Definition).IsRequired().HasMaxLength(2000);
            entity.Property(c => c.Example).HasMaxLength(2000);

            // Quan hệ 1 - Nhiều: Mỗi Card có thể có nhiều bản ghi StudyProgress (cho từng UserId khác nhau).
            // Khi xóa Card -> Toàn bộ bản ghi tiến độ StudyProgress tương ứng cũng bị xóa theo.
            entity.HasMany(c => c.StudyProgresses)
                  .WithOne(sp => sp.Card)
                  .HasForeignKey(sp => sp.CardId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Ignore(c => c.StudyProgress);
        });

        // 3. Cấu hình bảng StudyProgress (Tiến độ học)
        modelBuilder.Entity<StudyProgress>(entity =>
        {
            entity.HasKey(sp => sp.Id);
            // Một người dùng chỉ có tối đa 1 bản ghi tiến độ cho mỗi thẻ flashcard (Composite Unique Index)
            entity.HasIndex(sp => new { sp.CardId, sp.UserId }).IsUnique();
            entity.HasIndex(sp => sp.UserId);
        });

        // 4. Cấu hình bảng Folder (Thư mục chứa bộ thẻ)
        modelBuilder.Entity<Folder>(entity =>
        {
            entity.HasKey(f => f.Id);
            entity.Property(f => f.Name).IsRequired().HasMaxLength(100);
            entity.Property(f => f.Description).HasMaxLength(500);
            entity.Property(f => f.Icon).HasMaxLength(50).HasDefaultValue("📁");
            entity.Property(f => f.Color).HasMaxLength(20).HasDefaultValue("#3b82f6");
            entity.HasIndex(f => f.UserId);
            entity.HasIndex(f => f.Name).IsUnique();
        });

        // 5. Cấu hình bảng Attendance (Điểm danh và chuỗi lửa)
        modelBuilder.Entity<Attendance>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.Property(a => a.GuestId).HasMaxLength(100);
            entity.HasIndex(a => new { a.UserId, a.CheckInDate });
            entity.HasIndex(a => new { a.GuestId, a.CheckInDate });
        });

        // 7. Cấu hình bảng ApplicationUser (Người dùng xác thực qua Google & Facebook)
        modelBuilder.Entity<ApplicationUser>(entity =>
        {
            entity.HasIndex(u => new { u.Provider, u.ProviderKey });
            entity.HasIndex(u => new { u.Provider, u.Email });
        });

        // 8. Cấu hình bảng DeletedDeck (Bộ thẻ trong Thùng rác)
        modelBuilder.Entity<DeletedDeck>(entity =>
        {
            entity.HasKey(d => d.Id);
            entity.Property(d => d.Title).IsRequired().HasMaxLength(200);
            entity.Property(d => d.Description).HasMaxLength(1000);
            entity.Property(d => d.Folder).IsRequired().HasMaxLength(100).HasDefaultValue("Chung");
            entity.Property(d => d.Tag).HasMaxLength(500);
            entity.Property(d => d.IsPublic).IsRequired().HasDefaultValue(true);
            entity.HasIndex(d => d.UserId);
            entity.HasIndex(d => d.DeletedAt);

            entity.HasMany(d => d.DeletedCards)
                  .WithOne(c => c.DeletedDeck)
                  .HasForeignKey(c => c.DeletedDeckId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // 9. Cấu hình bảng DeletedCard (Thẻ Flashcard trong Thùng rác)
        modelBuilder.Entity<DeletedCard>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Term).IsRequired().HasMaxLength(500);
            entity.Property(c => c.Definition).IsRequired().HasMaxLength(2000);
            entity.Property(c => c.Example).HasMaxLength(2000);
            entity.HasIndex(c => c.DeletedDeckId);
            entity.HasIndex(c => c.ActiveDeckId);
            entity.HasIndex(c => c.DeletedAt);
        });

        // 10. Cấu hình bảng Recent (Bộ thẻ đã xem hoặc học gần đây)
        modelBuilder.Entity<Recent>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.Property(r => r.ActionType).IsRequired().HasMaxLength(50).HasDefaultValue("VIEW");
            entity.HasIndex(r => new { r.UserId, r.DeckId }).IsUnique();
            entity.HasIndex(r => r.UserId);
            entity.HasIndex(r => r.LastAccessedAt);

            entity.HasOne(r => r.Deck)
                  .WithMany()
                  .HasForeignKey(r => r.DeckId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // 11. Cấu hình bảng CloudinaryVideo (Lưu trữ đường dẫn và thông tin video Cloudinary)
        modelBuilder.Entity<CloudinaryVideo>(entity =>
        {
            entity.HasKey(v => v.Id);
            entity.Property(v => v.PublicId).IsRequired().HasMaxLength(255);
            entity.Property(v => v.Title).IsRequired().HasMaxLength(255);
            entity.Property(v => v.Description).HasMaxLength(2000);
            entity.Property(v => v.SecureUrl).IsRequired().HasMaxLength(1000);
            entity.Property(v => v.Url).HasMaxLength(1000);
            entity.Property(v => v.Format).HasMaxLength(20);
            entity.Property(v => v.Folder).HasMaxLength(100).HasDefaultValue("quizcard_videos");
            entity.Property(v => v.ThumbnailUrl).HasMaxLength(1000);
            entity.Property(v => v.VttEnText).HasColumnType("longtext");
            entity.Property(v => v.VttEnUrl).HasMaxLength(1000);
            entity.Property(v => v.VttEnPublicId).HasMaxLength(255);
            entity.Property(v => v.VttViText).HasColumnType("longtext");
            entity.Property(v => v.VttViUrl).HasMaxLength(1000);
            entity.Property(v => v.VttViPublicId).HasMaxLength(255);
            entity.Property(v => v.CreatedBy).HasMaxLength(100);
            entity.Property(v => v.IsActive).IsRequired().HasDefaultValue(true);

            entity.HasIndex(v => v.PublicId).IsUnique();
            entity.HasIndex(v => v.CreatedAt);
            entity.HasIndex(v => v.IsActive);
        });

        // 8. Cấu hình bảng RequestLog (Nhật ký yêu cầu người dùng)
        modelBuilder.Entity<RequestLog>(entity =>
        {
            entity.HasKey(l => l.Id);
            entity.Property(l => l.Method).IsRequired().HasMaxLength(10);
            entity.Property(l => l.Path).IsRequired().HasMaxLength(500);
            entity.Property(l => l.QueryString).HasMaxLength(1000);
            entity.Property(l => l.UserEmail).HasMaxLength(255);
            entity.Property(l => l.IpAddress).HasMaxLength(100);
            entity.Property(l => l.UserAgent).HasMaxLength(1000);
            entity.Property(l => l.ErrorMessage).HasColumnType("text");
            entity.Property(l => l.RequestBody).HasColumnType("text");

            entity.HasIndex(l => l.UserId);
            entity.HasIndex(l => l.CreatedAt);
            entity.HasIndex(l => l.StatusCode);
            entity.HasIndex(l => l.Path);
            entity.HasIndex(l => l.Method);
        });
    }
}
