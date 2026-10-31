using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizCard.Infrastructure.ExternalAPICalls.cloudinaryAPIs;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.VideoDTOs;
using QuizCard.UI.Areas.Admin.Controllers;

namespace QuizCard.UI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VideosController : ControllerBase
{
    private readonly ICloudinaryService _cloudinaryService;
    private readonly ICloudinaryVideosService _videosService;
    private readonly ILogger<VideosController> _logger;

    public VideosController(
        ICloudinaryService cloudinaryService,
        ICloudinaryVideosService videosService,
        ILogger<VideosController> logger)
    {
        _cloudinaryService = cloudinaryService;
        _videosService = videosService;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách video công khai dành cho học viên
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicVideos()
    {
        var list = await _videosService.GetAllVideosAsync(onlyActive: true, HttpContext.RequestAborted);
        return Ok(list);
    }

    /// <summary>
    /// Lấy trạng thái cấu hình của dịch vụ Cloudinary
    /// </summary>
    [HttpGet("config")]
    [AllowAnonymous]
    public IActionResult GetConfig()
    {
        return Ok(new
        {
            isConfigured = _cloudinaryService.IsConfigured,
            cloudName = _cloudinaryService.CloudName
        });
    }

    /// <summary>
    /// Thao tác tải lên video - BẮT BUỘC QUYỀN ADMIN.
    /// Khuyến khích sử dụng endpoint chính thức: POST /api/admin/videos/upload
    /// </summary>
    [HttpPost("upload")]
    [Authorize(AuthenticationSchemes = "AdminScheme", Policy = "AuthorizedForAdmin")]
    [RequestSizeLimit(1_073_741_824)] // 1 GB
    [RequestFormLimits(MultipartBodyLengthLimit = 1_073_741_824)] // 1 GB
    public async Task<IActionResult> UploadVideo([FromForm] IFormFile? file, [FromForm] string? title = null, [FromForm] string? folder = null)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { success = false, errorMessage = "Vui lòng chọn một file video hợp lệ." });
        }

        var allowedExtensions = new[] { ".mp4", ".webm", ".mov", ".mkv", ".avi", ".m4v" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest(new
            {
                success = false,
                errorMessage = $"Định dạng video '{extension}' không được hỗ trợ. Vui lòng chọn MP4, WebM hoặc MOV."
            });
        }

        try
        {
            await using var stream = file.OpenReadStream();
            var result = await _cloudinaryService.UploadVideoAsync(
                stream,
                file.FileName,
                file.ContentType,
                folder,
                HttpContext.RequestAborted);

            if (!result.Success || string.IsNullOrEmpty(result.PublicId) || string.IsNullOrEmpty(result.SecureUrl))
            {
                return BadRequest(new
                {
                    success = false,
                    errorMessage = result.ErrorMessage ?? "Không thể tải video lên Cloudinary."
                });
            }

            var saveRequest = new SaveCloudinaryVideoRequest
            {
                PublicId = result.PublicId,
                Title = !string.IsNullOrWhiteSpace(title) ? title : Path.GetFileNameWithoutExtension(file.FileName),
                SecureUrl = result.SecureUrl,
                Url = result.Url,
                Format = result.Format ?? extension.TrimStart('.'),
                Duration = result.Duration,
                Bytes = result.Bytes > 0 ? result.Bytes : file.Length,
                Width = result.Width > 0 ? result.Width : null,
                Height = result.Height > 0 ? result.Height : null,
                Folder = folder ?? "quizcard_videos",
                ThumbnailUrl = result.ThumbnailUrl,
                IsActive = true
            };

            await _videosService.SaveVideoAsync(saveRequest, User.Identity?.Name ?? "Admin", HttpContext.RequestAborted);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi xảy ra trong quá trình xử lý upload video {FileName}", file.FileName);
            return StatusCode(500, new
            {
                success = false,
                errorMessage = $"Lỗi máy chủ khi xử lý video: {ex.Message}"
            });
        }
    }

    /// <summary>
    /// Thao tác tải lên video từ URL - BẮT BUỘC QUYỀN ADMIN.
    /// Khuyến khích sử dụng endpoint chính thức: POST /api/admin/videos/upload-url
    /// </summary>
    [HttpPost("upload-url")]
    [Authorize(AuthenticationSchemes = "AdminScheme", Policy = "AuthorizedForAdmin")]
    public async Task<IActionResult> UploadFromUrl([FromBody] UploadUrlRequest request)
    {
        if (string.IsNullOrWhiteSpace(request?.Url))
        {
            return BadRequest(new { success = false, errorMessage = "Đường dẫn video URL không được để trống." });
        }

        var result = await _cloudinaryService.UploadVideoFromUrlAsync(
            request.Url,
            request.Folder,
            HttpContext.RequestAborted);

        if (!result.Success || string.IsNullOrEmpty(result.PublicId) || string.IsNullOrEmpty(result.SecureUrl))
        {
            return BadRequest(new
            {
                success = false,
                errorMessage = result.ErrorMessage ?? "Không thể tải video từ URL lên Cloudinary."
            });
        }

        var saveRequest = new SaveCloudinaryVideoRequest
        {
            PublicId = result.PublicId,
            Title = !string.IsNullOrWhiteSpace(request.Title) ? request.Title : result.PublicId.Split('/').Last(),
            Description = request.Description,
            SecureUrl = result.SecureUrl,
            Url = result.Url,
            Format = result.Format ?? "mp4",
            Duration = result.Duration,
            Bytes = result.Bytes,
            Width = result.Width > 0 ? result.Width : null,
            Height = result.Height > 0 ? result.Height : null,
            Folder = request.Folder ?? "quizcard_videos",
            ThumbnailUrl = result.ThumbnailUrl,
            IsActive = true
        };

        await _videosService.SaveVideoAsync(saveRequest, User.Identity?.Name ?? "Admin", HttpContext.RequestAborted);

        return Ok(result);
    }

    /// <summary>
    /// Xóa video đã lưu trên Cloudinary theo PublicId - BẮT BUỘC QUYỀN ADMIN.
    /// Khuyến khích sử dụng endpoint chính thức: DELETE /api/admin/videos/{publicId}
    /// </summary>
    [HttpDelete("{*publicId}")]
    [HttpDelete]
    [HttpPost("delete")]
    [Authorize(AuthenticationSchemes = "AdminScheme", Policy = "AuthorizedForAdmin")]
    public async Task<IActionResult> DeleteVideo(
        [FromRoute] string? publicId = null,
        [FromQuery] string? queryPublicId = null,
        [FromBody] AdminDeleteVideoRequest? body = null)
    {
        var rawId = publicId 
            ?? queryPublicId 
            ?? Request.Query["publicId"].FirstOrDefault() 
            ?? Request.Query["id"].FirstOrDefault() 
            ?? body?.PublicId 
            ?? body?.Id;

        if (string.IsNullOrWhiteSpace(rawId))
        {
            return BadRequest(new { success = false, errorMessage = "PublicId không hợp lệ." });
        }

        var targetId = rawId.Trim();
        if (targetId.Contains('%'))
        {
            try { targetId = Uri.UnescapeDataString(targetId).Trim(); } catch { }
        }

        var existingVideo = await _videosService.GetVideoByPublicIdAsync(targetId, HttpContext.RequestAborted);
        var effectivePublicId = existingVideo?.PublicId ?? targetId.TrimStart('/');

        var success = await _cloudinaryService.DeleteVideoAsync(effectivePublicId, HttpContext.RequestAborted);
        var dbSuccess = await _videosService.DeleteVideoAsync(effectivePublicId, HttpContext.RequestAborted);
        if (!dbSuccess && existingVideo != null)
        {
            dbSuccess = await _videosService.DeleteVideoAsync(existingVideo.PublicId, HttpContext.RequestAborted);
        }

        return Ok(new { success = success || dbSuccess, publicId = effectivePublicId, dbDeleted = dbSuccess, cloudinaryDeleted = success });
    }
}

public class UploadUrlRequest
{
    public string Url { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Folder { get; set; }
}
