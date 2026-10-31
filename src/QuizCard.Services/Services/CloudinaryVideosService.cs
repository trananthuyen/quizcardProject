using QuizCard.Entities;
using QuizCard.RepositoryContracts;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.VideoDTOs;

namespace QuizCard.Services.Services;

/// <summary>
/// Triển khai dịch vụ nghiệp vụ quản lý các đường dẫn và metadata của video trên Cloudinary
/// </summary>
public class CloudinaryVideosService : ICloudinaryVideosService
{
    private readonly ICloudinaryVideosRepository _repository;

    public CloudinaryVideosService(ICloudinaryVideosRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<CloudinaryVideoDto>> GetAllVideosAsync(bool onlyActive = false, CancellationToken cancellationToken = default)
    {
        var list = await _repository.GetAllVideosAsync(onlyActive, cancellationToken);
        return list.Select(MapToDto).ToList();
    }

    public async Task<CloudinaryVideoDto?> GetVideoByPublicIdAsync(string publicId, CancellationToken cancellationToken = default)
    {
        var item = await _repository.GetByPublicIdAsync(publicId, cancellationToken);
        return item != null ? MapToDto(item) : null;
    }

    public async Task<CloudinaryVideoDto> SaveVideoAsync(SaveCloudinaryVideoRequest request, string? createdBy = null, CancellationToken cancellationToken = default)
    {
        var entity = new CloudinaryVideo
        {
            Id = Guid.NewGuid(),
            PublicId = request.PublicId,
            Title = request.Title,
            Description = request.Description,
            SecureUrl = request.SecureUrl,
            Url = request.Url,
            Format = request.Format,
            Duration = request.Duration,
            Bytes = request.Bytes,
            Width = request.Width,
            Height = request.Height,
            Folder = request.Folder ?? "quizcard_videos",
            ThumbnailUrl = request.ThumbnailUrl,
            VttEnText = request.VttEnText,
            VttEnUrl = request.VttEnUrl,
            VttEnPublicId = request.VttEnPublicId,
            VttViText = request.VttViText,
            VttViUrl = request.VttViUrl,
            VttViPublicId = request.VttViPublicId,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        var saved = await _repository.AddOrUpdateVideoAsync(entity, cancellationToken);
        return MapToDto(saved);
    }

    public async Task<CloudinaryVideoDto?> UpdateVideoAsync(string publicId, UpdateCloudinaryVideoRequest request, CancellationToken cancellationToken = default)
    {
        var existing = await _repository.GetByPublicIdAsync(publicId, cancellationToken);
        if (existing == null)
        {
            return null;
        }

        existing.Title = request.Title;
        existing.Description = request.Description;
        if (!string.IsNullOrWhiteSpace(request.ThumbnailUrl))
        {
            existing.ThumbnailUrl = request.ThumbnailUrl;
        }
        if (request.VttEnText != null) existing.VttEnText = request.VttEnText;
        if (request.VttEnUrl != null) existing.VttEnUrl = request.VttEnUrl;
        if (request.VttEnPublicId != null) existing.VttEnPublicId = request.VttEnPublicId;
        if (request.VttViText != null) existing.VttViText = request.VttViText;
        if (request.VttViUrl != null) existing.VttViUrl = request.VttViUrl;
        if (request.VttViPublicId != null) existing.VttViPublicId = request.VttViPublicId;
        existing.IsActive = request.IsActive;

        var updated = await _repository.AddOrUpdateVideoAsync(existing, cancellationToken);
        return MapToDto(updated);
    }

    public async Task<bool> DeleteVideoAsync(string publicId, CancellationToken cancellationToken = default)
    {
        return await _repository.DeleteVideoAsync(publicId, cancellationToken);
    }

    private static CloudinaryVideoDto MapToDto(CloudinaryVideo entity)
    {
        return new CloudinaryVideoDto
        {
            Id = entity.Id,
            PublicId = entity.PublicId,
            Title = entity.Title,
            Description = entity.Description,
            SecureUrl = entity.SecureUrl,
            Url = entity.Url,
            Format = entity.Format,
            Duration = entity.Duration,
            Bytes = entity.Bytes,
            Width = entity.Width,
            Height = entity.Height,
            Folder = entity.Folder,
            ThumbnailUrl = entity.ThumbnailUrl,
            VttEnText = entity.VttEnText,
            VttEnUrl = entity.VttEnUrl,
            VttEnPublicId = entity.VttEnPublicId,
            VttViText = entity.VttViText,
            VttViUrl = entity.VttViUrl,
            VttViPublicId = entity.VttViPublicId,
            IsActive = entity.IsActive,
            CreatedAt = entity.CreatedAt,
            CreatedBy = entity.CreatedBy
        };
    }
}

