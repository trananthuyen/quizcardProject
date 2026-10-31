using System.ComponentModel.DataAnnotations;

namespace QuizCard.ServiceContracts.DTOs.VideoDTOs;

/// <summary>
/// Yêu cầu cập nhật thông tin hiển thị (Tiêu đề, mô tả, trạng thái) của video Cloudinary
/// </summary>
public class UpdateCloudinaryVideoRequest
{
    [Required(ErrorMessage = "Tiêu đề video không được để trống")]
    [MaxLength(255)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

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

