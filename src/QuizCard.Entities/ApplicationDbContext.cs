using Microsoft.EntityFrameworkCore;

namespace QuizCard.Entities;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions options) : base(options)
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
    /// Bảng lưu trữ danh sách các Phân loại bộ thẻ (Categories).
    /// </summary>
    public DbSet<Category> Categories => Set<Category>();

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
            entity.Property(d => d.Category).IsRequired().HasMaxLength(100).HasDefaultValue("Chung");

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

            // Quan hệ 1 - 1: Mỗi Card có duy nhất một bản ghi StudyProgress tương ứng.
            // Khi xóa Card -> Bản ghi tiến độ StudyProgress cũng bị xóa theo.
            entity.HasOne(c => c.StudyProgress)
                  .WithOne(sp => sp.Card)
                  .HasForeignKey<StudyProgress>(sp => sp.CardId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // 3. Cấu hình bảng StudyProgress (Tiến độ học)
        modelBuilder.Entity<StudyProgress>(entity =>
        {
            entity.HasKey(sp => sp.Id);
            // Đảm bảo mỗi CardId chỉ xuất hiện tối đa 1 lần (Unique Index).
            entity.HasIndex(sp => sp.CardId).IsUnique();
        });

        // 4. Cấu hình bảng Category (Phân loại bộ thẻ)
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).IsRequired().HasMaxLength(100);
            entity.Property(c => c.Description).HasMaxLength(500);
            entity.Property(c => c.Icon).HasMaxLength(50).HasDefaultValue("📁");
            entity.Property(c => c.Color).HasMaxLength(20).HasDefaultValue("#3b82f6");
            entity.HasIndex(c => c.Name).IsUnique();
        });
    }
}

