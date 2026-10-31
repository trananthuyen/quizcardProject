using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizCard.Entities;
using QuizCard.Entities.IdentifyEntities;
using QuizCard.UI.Areas.Admin.Models;

namespace QuizCard.UI.Areas.Admin.Controllers;

/// <summary>
/// Controller Quản trị viên: Quản lý số lượng người dùng và số lượng Decks, Cards mà mỗi tài khoản tạo ra.
/// </summary>
[Area("Admin")]
[Route("api/[area]/users")]
[ApiController]
[Authorize(AuthenticationSchemes = "AdminScheme", Policy = "AuthorizedForAdmin")]
public class AdminUsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<AdminUsersController> _logger;

    public AdminUsersController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        ILogger<AdminUsersController> logger)
    {
        _context = context;
        _userManager = userManager;
        _logger = logger;
    }

    /// <summary>
    /// Lấy số liệu thống kê tổng quan (Tổng số người dùng, tổng decks, tổng cards, trung bình)
    /// GET /api/admin/users/stats
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<AdminOverviewStatsDto>> GetStats()
    {
        var totalUsers = await _context.Users.CountAsync();
        var totalDecks = await _context.Decks.CountAsync();
        var totalCards = await _context.Cards.CountAsync();

        var systemDecks = await _context.Decks
            .Where(d => d.UserId == null)
            .Include(d => d.Cards)
            .ToListAsync();

        var totalSystemDecks = systemDecks.Count;
        var totalSystemCards = systemDecks.Sum(d => d.Cards.Count);

        var activeUsersCount = await _context.Decks
            .Where(d => d.UserId != null)
            .Select(d => d.UserId)
            .Distinct()
            .CountAsync();

        var avgDecksPerUser = totalUsers > 0 ? Math.Round((double)totalDecks / totalUsers, 1) : 0;
        var avgCardsPerDeck = totalDecks > 0 ? Math.Round((double)totalCards / totalDecks, 1) : 0;

        return Ok(new AdminOverviewStatsDto
        {
            TotalUsers = totalUsers,
            TotalDecks = totalDecks,
            TotalCards = totalCards,
            TotalSystemDecks = totalSystemDecks,
            TotalSystemCards = totalSystemCards,
            ActiveUsersCount = activeUsersCount,
            AverageDecksPerUser = avgDecksPerUser,
            AverageCardsPerDeck = avgCardsPerDeck
        });
    }

    /// <summary>
    /// Lấy danh sách toàn bộ người dùng kèm số lượng Decks và Cards từng tài khoản tạo ra
    /// GET /api/admin/users?search=...&sort=...
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<AdminUserSummaryDto>>> GetUsers(
        [FromQuery] string? search = null,
        [FromQuery] string? sort = "decks_desc")
    {
        // 1. Tải danh sách người dùng từ AspNetUsers
        IQueryable<ApplicationUser> usersQuery = _context.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            usersQuery = usersQuery.Where(u =>
                (u.UserName != null && u.UserName.ToLower().Contains(term)) ||
                (u.Email != null && u.Email.ToLower().Contains(term)) ||
                (u.FullName != null && u.FullName.ToLower().Contains(term)));
        }

        var users = await usersQuery.ToListAsync();

        // 2. Thống kê Decks và Cards gom nhóm theo UserId
        var deckStats = await _context.Decks
            .AsNoTracking()
            .GroupBy(d => d.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                TotalDecks = g.Count(),
                PublicDecks = g.Count(d => d.IsPublic),
                PrivateDecks = g.Count(d => !d.IsPublic),
                TotalCards = g.SelectMany(d => d.Cards).Count(),
                LastDeckCreatedAt = g.Max(d => (DateTime?)d.CreatedAt)
            })
            .ToListAsync();

        var statsDict = deckStats
            .Where(s => s.UserId.HasValue)
            .ToDictionary(s => s.UserId!.Value);

        // 3. Lấy thông tin Role của từng người dùng
        var userRoles = await (from ur in _context.UserRoles.AsNoTracking()
                               join r in _context.Roles.AsNoTracking() on ur.RoleId equals r.Id
                               select new { ur.UserId, RoleName = r.Name })
                              .ToListAsync();

        var rolesDict = userRoles
            .GroupBy(ur => ur.UserId)
            .ToDictionary(g => g.Key, g => string.Join(", ", g.Select(x => x.RoleName)));

        // 4. Ánh xạ thành danh sách DTO
        var dtos = users.Select(u =>
        {
            statsDict.TryGetValue(u.Id, out var stat);
            rolesDict.TryGetValue(u.Id, out var roleName);

            return new AdminUserSummaryDto
            {
                Id = u.Id,
                UserName = u.UserName ?? "user",
                Email = u.Email,
                FullName = u.FullName ?? u.UserName ?? "Thành viên",
                AvatarUrl = u.AvatarUrl,
                Role = string.IsNullOrWhiteSpace(roleName) ? "User" : roleName,
                Provider = string.IsNullOrWhiteSpace(u.Provider) ? "Local" : u.Provider,
                CreatedAt = u.CreatedAt,
                TotalDecks = stat?.TotalDecks ?? 0,
                TotalCards = stat?.TotalCards ?? 0,
                PublicDecks = stat?.PublicDecks ?? 0,
                PrivateDecks = stat?.PrivateDecks ?? 0,
                LastDeckCreatedAt = stat?.LastDeckCreatedAt
            };
        }).ToList();

        // 5. Sắp xếp danh sách
        dtos = (sort?.ToLower()) switch
        {
            "decks_asc" => dtos.OrderBy(u => u.TotalDecks).ThenBy(u => u.TotalCards).ToList(),
            "cards_desc" => dtos.OrderByDescending(u => u.TotalCards).ThenByDescending(u => u.TotalDecks).ToList(),
            "cards_asc" => dtos.OrderBy(u => u.TotalCards).ThenBy(u => u.TotalDecks).ToList(),
            "date_asc" => dtos.OrderBy(u => u.CreatedAt).ToList(),
            "date_desc" => dtos.OrderByDescending(u => u.CreatedAt).ToList(),
            "name_asc" => dtos.OrderBy(u => u.FullName).ToList(),
            _ => dtos.OrderByDescending(u => u.TotalDecks).ThenByDescending(u => u.TotalCards).ToList() // decks_desc default
        };

        return Ok(dtos);
    }

    /// <summary>
    /// Lấy danh sách các bộ thẻ của một người dùng cụ thể kèm số lượng thẻ
    /// GET /api/admin/users/{userId}/decks
    /// </summary>
    [HttpGet("{userId:guid}/decks")]
    public async Task<ActionResult<List<AdminUserDeckDetailDto>>> GetUserDecks(Guid userId)
    {
        var decks = await _context.Decks
            .AsNoTracking()
            .Where(d => d.UserId == userId)
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new AdminUserDeckDetailDto
            {
                Id = d.Id,
                Title = d.Title,
                Description = d.Description,
                Folder = d.Folder,
                Tag = d.Tag,
                IsPublic = d.IsPublic,
                TotalCards = d.Cards.Count,
                CreatedAt = d.CreatedAt
            })
            .ToListAsync();

        return Ok(decks);
    }

    /// <summary>
    /// Lấy danh sách các bộ thẻ hệ thống/mẫu (UserId == null)
    /// GET /api/admin/users/system/decks
    /// </summary>
    [HttpGet("system/decks")]
    public async Task<ActionResult<List<AdminUserDeckDetailDto>>> GetSystemDecks()
    {
        var decks = await _context.Decks
            .AsNoTracking()
            .Where(d => d.UserId == null)
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new AdminUserDeckDetailDto
            {
                Id = d.Id,
                Title = d.Title,
                Description = d.Description,
                Folder = d.Folder,
                Tag = d.Tag,
                IsPublic = d.IsPublic,
                TotalCards = d.Cards.Count,
                CreatedAt = d.CreatedAt
            })
            .ToListAsync();

        return Ok(decks);
    }

    /// <summary>
    /// Xóa một bộ thẻ bất kỳ bởi Quản trị viên (Admin moderation)
    /// DELETE /api/admin/users/decks/{deckId}
    /// </summary>
    [HttpDelete("decks/{deckId:guid}")]
    public async Task<IActionResult> DeleteDeckByAdmin(Guid deckId)
    {
        var deck = await _context.Decks
            .Include(d => d.Cards)
            .FirstOrDefaultAsync(d => d.Id == deckId);

        if (deck == null)
        {
            return NotFound(new { message = "Không tìm thấy bộ thẻ cần xóa." });
        }

        _context.Decks.Remove(deck);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Quản trị viên đã xóa bộ thẻ '{Title}' (ID: {Id})", deck.Title, deck.Id);

        return Ok(new
        {
            success = true,
            message = $"Đã xóa thành công bộ thẻ '{deck.Title}'."
        });
    }
}

