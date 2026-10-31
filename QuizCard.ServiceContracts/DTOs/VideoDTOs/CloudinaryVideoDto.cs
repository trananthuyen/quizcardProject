namespace QuizCard.ServiceContracts.DTOs.VideoDTOs;

/// <summary>
/// Data Transfer Object đại diện cho thông tin video Cloudinary trả về cho Frontend
/// </summary>
public class CloudinaryVideoDto
{
    public Guid Id { get; set; }
    public string PublicId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string SecureUrl { get; set; } = string.Empty;
    public string? Url { get; set; }
    public string? Format { get; set; }
    public double Duration { get; set; }
    public long Bytes { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public string? Folder { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? VttEnText { get; set; }
    public string? VttEnUrl { get; set; }
    public string? VttEnPublicId { get; set; }
    public string? VttViText { get; set; }
    public string? VttViUrl { get; set; }
    public string? VttViPublicId { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
}

