using System.ComponentModel.DataAnnotations;

namespace QuizCard.ServiceContracts.DTOs.VideoDTOs;

/// <summary>
/// Yêu cầu lưu thông tin video sau khi đã upload lên Cloudinary vào Database
/// </summary>
public class SaveCloudinaryVideoRequest
{
    [Required(ErrorMessage = "PublicId video không được để trống")]
    [MaxLength(255)]
    public string PublicId { get; set; } = string.Empty;

    [Required(ErrorMessage = "Tiêu đề video không được để trống")]
    [MaxLength(255)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required(ErrorMessage = "SecureUrl không được để trống")]
    [MaxLength(1000)]
    public string SecureUrl { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Url { get; set; }

    [MaxLength(20)]
    public string? Format { get; set; }

    public double Duration { get; set; }
    public long Bytes { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }

    [MaxLength(100)]
    public string? Folder { get; set; } = "quizcard_videos";

    [MaxLength(1000)]
    public string? ThumbnailUrl { get; set; }

    public string? VttEnText { get; set; }

    [MaxLength(1000)]
    public string? VttEnUrl { get; set; }

    [MaxLength(255)]
    public string? VttEnPublicId { get; set; }

    public string? VttViText { get; set; }

    [MaxLength(1000)]
    public string? VttViUrl { get; set; }

    [MaxLength(255)]
    public string? VttViPublicId { get; set; }

    public bool IsActive { get; set; } = true;
}

