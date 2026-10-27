using Microsoft.EntityFrameworkCore;
using QuizCard.Entities;
using QuizCard.RepositoryContracts;

namespace QuizCard.Repositories;

public class FoldersRepository : IFoldersRepository
{
    private readonly ApplicationDbContext _db;

    public FoldersRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Folder?> FindFolderByName(string name)
    {
        return await _db.Folders
            .FirstOrDefaultAsync(f => f.Name.ToLower() == name.Trim().ToLower());
    }

    public async Task<int> CountDecksByFolderName(string folderName)
    {
        return await _db.Decks.CountAsync(d => d.Folder.ToLower() == folderName.Trim().ToLower());
    }

    public async Task<Dictionary<string, int>> GetDeckCountsGroupedByFolder(Guid? userId = null)
    {
        IQueryable<Deck> query = _db.Decks;
        if (userId.HasValue && userId.Value != Guid.Empty)
        {
            query = query.Where(d => d.UserId == userId.Value || d.UserId == null);
        }

        return await query
            .GroupBy(d => d.Folder.ToLower())
            .Select(g => new { FolderLower = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.FolderLower, x => x.Count);
    }

    public async Task<Folder> CreateFolder(Folder folder)
    {
        _db.Folders.Add(folder);
        await _db.SaveChangesAsync();
        return folder;
    }

    public async Task<List<Folder>> GetAllFolders(Guid? userId = null)
    {
        IQueryable<Folder> query = _db.Folders;

        if (userId.HasValue && userId.Value != Guid.Empty)
        {
            query = query.Where(f => f.UserId == userId.Value || f.UserId == null);
        }
        else
        {
            query = query.Where(f => f.UserId == null);
        }

        return await query
            .OrderBy(f => f.CreatedAt)
            .ToListAsync();
    }

    public async Task<Folder?> GetFolderById(Guid id)
    {
        return await _db.Folders.FindAsync(id);
    }

    public async Task<bool> FolderExistsByName(string name, Guid? excludeId = null)
    {
        var lowerName = name.Trim().ToLower();
        if (excludeId.HasValue)
        {
            return await _db.Folders.AnyAsync(f => f.Id != excludeId.Value && f.Name.ToLower() == lowerName);
        }
        return await _db.Folders.AnyAsync(f => f.Name.ToLower() == lowerName);
    }

    public async Task<Folder?> UpdateFolder(Folder folder)
    {
        _db.Folders.Update(folder);
        await _db.SaveChangesAsync();
        return folder;
    }

    public async Task<bool> DeleteFolder(Folder folder)
    {
        _db.Folders.Remove(folder);
        int deleted = await _db.SaveChangesAsync();
        return deleted > 0;
    }

    public async Task UpdateDecksFolder(string oldFolderName, string newFolderName)
    {
        var relatedDecks = await _db.Decks
            .Where(d => d.Folder.ToLower() == oldFolderName.ToLower())
            .ToListAsync();

        foreach (var deck in relatedDecks)
        {
            deck.Folder = newFolderName;
        }

        await _db.SaveChangesAsync();
    }
}

