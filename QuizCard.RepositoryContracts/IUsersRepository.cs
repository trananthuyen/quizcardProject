using QuizCard.Entities.IdentifyEntities;

namespace QuizCard.RepositoryContracts;

/// <summary>
/// Giao diện định nghĩa các hợp đồng truy vấn và thao tác dữ liệu người dùng Identity (ApplicationUser).
/// </summary>
public interface IUsersRepository
{
    Task<ApplicationUser> AccessIn(ApplicationUser user);
    Task<ApplicationUser?> GetByIdAsync(Guid id);
    Task<ApplicationUser?> GetByEmailAsync(string email);
    Task<ApplicationUser?> GetByProviderAsync(string provider, string providerKey);
    Task<ApplicationUser?> GetByProviderAndEmailAsync(string provider, string email);
    Task<ApplicationUser> CreateUserAsync(ApplicationUser user);
    Task<ApplicationUser> UpdateUserAsync(ApplicationUser user);
}
