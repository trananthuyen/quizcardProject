using Microsoft.EntityFrameworkCore;
using QuizCard.Entities;
using QuizCard.RepositoryContracts;

namespace QuizCard.Repositories;

/// <summary>
/// Triển khai Repository truy xuất cơ sở dữ liệu cho bảng CloudinaryVideos
/// </summary>
public class CloudinaryVideosRepository : ICloudinaryVideosRepository
{
    private readonly ApplicationDbContext _context;

    public CloudinaryVideosRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CloudinaryVideo>> GetAllVideosAsync(bool onlyActive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.CloudinaryVideos.AsNoTracking();
        if (onlyActive)
        {
            query = query.Where(v => v.IsActive);
        }

        return await query
            .OrderByDescending(v => v.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<CloudinaryVideo?> GetByPublicIdAsync(string publicId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(publicId)) return null;

        var clean = publicId.Trim().Trim('/');
        if (clean.Contains('%'))
        {
            try { clean = Uri.UnescapeDataString(clean).Trim().Trim('/'); } catch { }
        }

        var item = await _context.CloudinaryVideos
            .FirstOrDefaultAsync(v => v.PublicId == clean 
                                   || v.PublicId == publicId 
                                   || v.PublicId == "/" + clean, cancellationToken);

        if (item == null && Guid.TryParse(publicId, out var id))
        {
            item = await _context.CloudinaryVideos
                .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);
        }

        return item;
    }

    public async Task<CloudinaryVideo?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.CloudinaryVideos
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);
    }

    public async Task<CloudinaryVideo> AddOrUpdateVideoAsync(CloudinaryVideo video, CancellationToken cancellationToken = default)
    {
        var existing = await _context.CloudinaryVideos
            .FirstOrDefaultAsync(v => v.PublicId == video.PublicId, cancellationToken);

        if (existing == null)
        {
            if (video.Id == Guid.Empty)
            {
                video.Id = Guid.NewGuid();
            }
            if (video.CreatedAt == default)
            {
                video.CreatedAt = DateTime.UtcNow;
            }
            await _context.CloudinaryVideos.AddAsync(video, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return video;
        }

        // Cập nhật thông tin nếu đã tồn tại bản ghi với cùng PublicId
        existing.Title = video.Title;
        existing.Description = video.Description;
        existing.SecureUrl = video.SecureUrl;
        existing.Url = video.Url;
        existing.Format = video.Format;
        existing.Duration = video.Duration;
        existing.Bytes = video.Bytes;
        existing.Width = video.Width;
        existing.Height = video.Height;
        existing.Folder = video.Folder;
        existing.ThumbnailUrl = video.ThumbnailUrl;
        if (video.VttEnText != null) existing.VttEnText = video.VttEnText;
        if (video.VttEnUrl != null) existing.VttEnUrl = video.VttEnUrl;
        if (video.VttEnPublicId != null) existing.VttEnPublicId = video.VttEnPublicId;
        if (video.VttViText != null) existing.VttViText = video.VttViText;
        if (video.VttViUrl != null) existing.VttViUrl = video.VttViUrl;
        if (video.VttViPublicId != null) existing.VttViPublicId = video.VttViPublicId;
        existing.IsActive = video.IsActive;

        await _context.SaveChangesAsync(cancellationToken);
        return existing;
    }

    public async Task<bool> DeleteVideoAsync(string publicId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(publicId)) return false;

        var clean = publicId.Trim().Trim('/');
        if (clean.Contains('%'))
        {
            try { clean = Uri.UnescapeDataString(clean).Trim().Trim('/'); } catch { }
        }

        var item = await _context.CloudinaryVideos
            .FirstOrDefaultAsync(v => v.PublicId == clean 
                                   || v.PublicId == publicId 
                                   || v.PublicId == "/" + clean, cancellationToken);

        if (item == null && Guid.TryParse(publicId, out var id))
        {
            item = await _context.CloudinaryVideos
                .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);
        }

        if (item == null)
        {
            return false;
        }

        _context.CloudinaryVideos.Remove(item);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

