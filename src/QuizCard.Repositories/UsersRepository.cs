using Microsoft.EntityFrameworkCore;
using QuizCard.Entities;
using QuizCard.Entities.IdentifyEntities;
using QuizCard.RepositoryContracts;

namespace QuizCard.Repositories;

/// <summary>
/// Lớp triển khai các thao tác truy vấn và lưu trữ người dùng vào CSDL MySQL thông qua ApplicationDbContext.
/// </summary>
public class UsersRepository : IUsersRepository
{
    private readonly ApplicationDbContext _db;

    public UsersRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public Task<ApplicationUser> AccessIn(ApplicationUser user)
    {
        return Task.FromResult(user);
    }

    public async Task<ApplicationUser?> GetByIdAsync(Guid id)
    {
        return await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<ApplicationUser?> GetByEmailAsync(string email)
    {
        var lower = email.Trim().ToLower();
        return await _db.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == lower.ToUpper() || u.Email == lower);
    }

    public async Task<ApplicationUser?> GetByProviderAsync(string provider, string providerKey)
    {
        var lowerProvider = provider.Trim().ToLower();
        return await _db.Users.FirstOrDefaultAsync(u => u.Provider == lowerProvider && u.ProviderKey == providerKey);
    }

    public async Task<ApplicationUser?> GetByProviderAndEmailAsync(string provider, string email)
    {
        var lowerProvider = provider.Trim().ToLower();
        var lowerEmail = email.Trim().ToLower();
        return await _db.Users.FirstOrDefaultAsync(u => 
            u.Provider == lowerProvider && 
            (u.Email == lowerEmail || u.NormalizedEmail == lowerEmail.ToUpper()));
    }

    public async Task<ApplicationUser> CreateUserAsync(ApplicationUser user)
    {
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return user;
    }

    public async Task<ApplicationUser> UpdateUserAsync(ApplicationUser user)
    {
        _db.Users.Update(user);
        await _db.SaveChangesAsync();
        return user;
    }
}
