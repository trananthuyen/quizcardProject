using Microsoft.EntityFrameworkCore;
using QuizCard.Entities;
using QuizCard.RepositoryContracts;

namespace QuizCard.Repositories;

public class CategoriesRespository : ICategoriesRespository
{
    private readonly ApplicationDbContext _db;

    public CategoriesRespository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Category?> FindCategoryByName(string name)
    {
        return await _db.Categories
            .FirstOrDefaultAsync(c => c.Name.ToLower() == name.Trim().ToLower());
    }

    public async Task<int> CountDecksByCategoryName(string name)
    {
        return await _db.Decks.CountAsync(d => d.Category.ToLower() == name.Trim().ToLower());
    }

    public async Task<Dictionary<string, int>> GetDeckCountsGroupedByCategory(Guid? userId = null)
    {
        IQueryable<Deck> query = _db.Decks;
        if (userId.HasValue && userId.Value != Guid.Empty)
        {
            query = query.Where(d => d.UserId == userId.Value || d.UserId == null);
        }

        return await query
            .GroupBy(d => d.Category.ToLower())
            .Select(g => new { CategoryLower = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.CategoryLower, x => x.Count);
    }

    public async Task<Category> CreateCategory(Category category)
    {
        _db.Categories.Add(category);
        await _db.SaveChangesAsync();
        return category;
    }

    public async Task<List<Category>> GetAllCategories(Guid? userId = null)
    {
        IQueryable<Category> query = _db.Categories;

        if (userId.HasValue && userId.Value != Guid.Empty)
        {
            // Trả về phân loại của người dùng này HOẶC phân loại mặc định hệ thống (UserId == null)
            query = query.Where(c => c.UserId == userId.Value || c.UserId == null);
        }
        else
        {
            // Người dùng vãng lai hoặc chưa đăng nhập: chỉ trả về các phân loại mặc định hệ thống
            query = query.Where(c => c.UserId == null);
        }

        return await query
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<Category?> GetCategoryById(Guid id)
    {
        return await _db.Categories.FindAsync(id);
    }

    public async Task<bool> CategoryExistsByName(string name, Guid? excludeId = null)
    {
        var lowerName = name.Trim().ToLower();
        if (excludeId.HasValue)
        {
            return await _db.Categories.AnyAsync(c => c.Id != excludeId.Value && c.Name.ToLower() == lowerName);
        }
        return await _db.Categories.AnyAsync(c => c.Name.ToLower() == lowerName);
    }

    public async Task<Category?> UpdateCategory(Category category)
    {
        _db.Categories.Update(category);
        await _db.SaveChangesAsync();
        return category;
    }

    public async Task<bool> DeleteCategory(Category category)
    {
        _db.Categories.Remove(category);
        int categoryDelete = await _db.SaveChangesAsync();
        return categoryDelete > 0;
    }

    public async Task UpdateDecksCategory(string oldCategoryName, string newCategoryName)
    {
        var relatedDecks = await _db.Decks
            .Where(d => d.Category.ToLower() == oldCategoryName.ToLower())
            .ToListAsync();

        foreach (var deck in relatedDecks)
        {
            deck.Category = newCategoryName;
        }

        await _db.SaveChangesAsync();
    }
}
