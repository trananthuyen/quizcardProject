using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizCard.Infrastructure.ExternalAPICalls.cloudinaryAPIs;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.VideoDTOs;

namespace QuizCard.UI.Areas.Admin.Controllers;

/// <summary>
/// Controller quản lý video bài giảng và tài nguyên Cloudinary dành riêng cho Quản trị viên (Admin).
/// Tất cả các thao tác Upload, Sửa, Xóa video đều bắt buộc phải xác thực quyền Admin.
/// Hỗ trợ lưu trữ video, phụ đề VTT tiếng Anh & tiếng Việt dưới dạng TEXT và File URL trong cơ sở dữ liệu.
/// </summary>
[Area("Admin")]
[Route("api/[area]/videos")]
[ApiController]
[Authorize(AuthenticationSchemes = "AdminScheme", Policy = "AuthorizedForAdmin")]
public class AdminVideosController : ControllerBase
{
    private readonly ICloudinaryService _cloudinaryService;
    private readonly ICloudinaryVideosService _videosService;
    private readonly ILogger<AdminVideosController> _logger;

    public AdminVideosController(
        ICloudinaryService cloudinaryService,
        ICloudinaryVideosService videosService,
        ILogger<AdminVideosController> logger)
    {
        _cloudinaryService = cloudinaryService;
        _videosService = videosService;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách toàn bộ các video đã lưu trữ trong database
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllVideos()
    {
        var videos = await _videosService.GetAllVideosAsync(onlyActive: false, HttpContext.RequestAborted);
        return Ok(videos);
    }

    /// <summary>
    /// Lấy thông tin cấu hình Cloudinary
    /// </summary>
    [HttpGet("config")]
    public IActionResult GetConfig()
    {
        return Ok(new
        {
            isConfigured = _cloudinaryService.IsConfigured,
            cloudName = _cloudinaryService.CloudName,
            status = _cloudinaryService.IsConfigured ? "Hoạt động bình thường" : "Chưa cấu hình tài khoản"
        });
    }

    /// <summary>
    /// Tải video từ máy tính của Admin lên Cloudinary (Dung lượng tối đa 1GB) và lưu vào Database.
    /// Hỗ trợ đính kèm phụ đề VTT tiếng Anh và tiếng Việt (lưu cả file và nội dung TEXT vào DB).
    /// </summary>
    [HttpPost("upload")]
    [RequestSizeLimit(1_073_741_824)] // 1 GB
    [RequestFormLimits(MultipartBodyLengthLimit = 1_073_741_824)] // 1 GB
    public async Task<IActionResult> UploadVideo(
        [FromForm] IFormFile? file,
        [FromForm] string? title = null,
        [FromForm] string? description = null,
        [FromForm] string? folder = null,
        [FromForm] IFormFile? vttEn = null,
        [FromForm] string? vttEnText = null,
        [FromForm] string? vttEnUrl = null,
        [FromForm] IFormFile? vttVi = null,
        [FromForm] string? vttViText = null,
        [FromForm] string? vttViUrl = null)
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

        var targetFolder = !string.IsNullOrWhiteSpace(folder) ? folder : "quizcard_videos";
        var tempFilePath = Path.Combine(Path.GetTempPath(), $"quizcard_{Guid.NewGuid():N}_{file.FileName}");
        try
        {
            // 1. Lưu video vào file đệm tạm thời để đảm bảo luồng có thể Seek và xác định chính xác kích thước
            await using (var tempFs = new FileStream(tempFilePath, FileMode.Create, FileAccess.ReadWrite, FileShare.None, 65536))
            {
                await file.CopyToAsync(tempFs, HttpContext.RequestAborted);
            }

            await using (var seekableStream = new FileStream(tempFilePath, FileMode.Open, FileAccess.Read, FileShare.Read, 65536))
            {
                var result = await _cloudinaryService.UploadVideoAsync(
                    seekableStream,
                    file.FileName,
                    file.ContentType,
                    targetFolder,
                    HttpContext.RequestAborted);

                if (!result.Success || string.IsNullOrEmpty(result.PublicId) || string.IsNullOrEmpty(result.SecureUrl))
                {
                    return BadRequest(new
                    {
                        success = false,
                        errorMessage = result.ErrorMessage ?? "Không thể tải video lên Cloudinary."
                    });
                }

                // 2. Xử lý phụ đề tiếng Anh (Lưu text và file raw lên Cloudinary nếu có)
                string? finalVttEnText = vttEnText;
                string? finalVttEnUrl = !string.IsNullOrWhiteSpace(vttEnUrl) ? vttEnUrl.Trim() : null;
                string? finalVttEnPublicId = null;

                if (vttEn != null && vttEn.Length > 0)
                {
                    try
                    {
                        // Đọc toàn bộ nội dung text của file VTT tiếng Anh
                        using (var reader = new StreamReader(vttEn.OpenReadStream(), Encoding.UTF8))
                        {
                            finalVttEnText = await reader.ReadToEndAsync(HttpContext.RequestAborted);
                        }

                        // Đẩy file raw lên Cloudinary để có link trực tiếp
                        await using var vttStream = vttEn.OpenReadStream();
                        var vttResult = await _cloudinaryService.UploadRawFileAsync(
                            vttStream,
                            vttEn.FileName,
                            targetFolder,
                            HttpContext.RequestAborted);

                        if (vttResult.Success && !string.IsNullOrEmpty(vttResult.SecureUrl))
                        {
                            finalVttEnUrl = vttResult.SecureUrl;
                            finalVttEnPublicId = vttResult.PublicId;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Lỗi khi xử lý file VTT tiếng Anh: {FileName}", vttEn.FileName);
                    }
                }

                // 3. Xử lý phụ đề tiếng Việt (Lưu text và file raw lên Cloudinary nếu có)
                string? finalVttViText = vttViText;
                string? finalVttViUrl = !string.IsNullOrWhiteSpace(vttViUrl) ? vttViUrl.Trim() : null;
                string? finalVttViPublicId = null;

                if (vttVi != null && vttVi.Length > 0)
                {
                    try
                    {
                        // Đọc toàn bộ nội dung text của file VTT tiếng Việt
                        using (var reader = new StreamReader(vttVi.OpenReadStream(), Encoding.UTF8))
                        {
                            finalVttViText = await reader.ReadToEndAsync(HttpContext.RequestAborted);
                        }

                        // Đẩy file raw lên Cloudinary để có link trực tiếp
                        await using var vttStream = vttVi.OpenReadStream();
                        var vttResult = await _cloudinaryService.UploadRawFileAsync(
                            vttStream,
                            vttVi.FileName,
                            targetFolder,
                            HttpContext.RequestAborted);

                        if (vttResult.Success && !string.IsNullOrEmpty(vttResult.SecureUrl))
                        {
                            finalVttViUrl = vttResult.SecureUrl;
                            finalVttViPublicId = vttResult.PublicId;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Lỗi khi xử lý file VTT tiếng Việt: {FileName}", vttVi.FileName);
                    }
                }

                var videoTitle = !string.IsNullOrWhiteSpace(title)
                    ? title
                    : Path.GetFileNameWithoutExtension(file.FileName);

                // Lưu thông tin video và phụ đề vào bảng CloudinaryVideos trong cơ sở dữ liệu
                var saveRequest = new SaveCloudinaryVideoRequest
                {
                    PublicId = result.PublicId,
                    Title = videoTitle,
                    Description = description,
                    SecureUrl = result.SecureUrl,
                    Url = result.Url,
                    Format = result.Format ?? extension.TrimStart('.'),
                    Duration = result.Duration,
                    Bytes = result.Bytes > 0 ? result.Bytes : file.Length,
                    Width = result.Width > 0 ? result.Width : null,
                    Height = result.Height > 0 ? result.Height : null,
                    Folder = targetFolder,
                    ThumbnailUrl = result.ThumbnailUrl,
                    VttEnText = finalVttEnText,
                    VttEnUrl = finalVttEnUrl,
                    VttEnPublicId = finalVttEnPublicId,
                    VttViText = finalVttViText,
                    VttViUrl = finalVttViUrl,
                    VttViPublicId = finalVttViPublicId,
                    IsActive = true
                };

                var adminName = User.Identity?.Name ?? "Admin";
                var savedVideo = await _videosService.SaveVideoAsync(saveRequest, adminName, HttpContext.RequestAborted);

                _logger.LogInformation("Admin đã tải lên và lưu trữ video thành công: {PublicId}", result.PublicId);

                return Ok(new
                {
                    success = true,
                    video = savedVideo,
                    cloudinary = result
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi xảy ra khi Admin upload video {FileName}", file.FileName);
            return StatusCode(500, new
            {
                success = false,
                errorMessage = $"Lỗi máy chủ khi xử lý video: {ex.Message}"
            });
        }
        finally
        {
            try
            {
                if (System.IO.File.Exists(tempFilePath))
                {
                    System.IO.File.Delete(tempFilePath);
                }
            }
            catch { }
        }
    }

    /// <summary>
    /// Tải video từ một URL bên ngoài lên Cloudinary và lưu vào Database
    /// </summary>
    [HttpPost("upload-url")]
    public async Task<IActionResult> UploadFromUrl([FromBody] AdminUploadUrlRequest request)
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

        var videoTitle = !string.IsNullOrWhiteSpace(request.Title)
            ? request.Title
            : (!string.IsNullOrWhiteSpace(result.PublicId) ? result.PublicId.Split('/').Last() : "Video bài học");

        // Lưu thông tin video vào Database
        var saveRequest = new SaveCloudinaryVideoRequest
        {
            PublicId = result.PublicId,
            Title = videoTitle,
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
            VttEnText = request.VttEnText,
            VttEnUrl = request.VttEnUrl,
            VttViText = request.VttViText,
            VttViUrl = request.VttViUrl,
            IsActive = true
        };

        var adminName = User.Identity?.Name ?? "Admin";
        var savedVideo = await _videosService.SaveVideoAsync(saveRequest, adminName, HttpContext.RequestAborted);

        _logger.LogInformation("Admin đã tải video từ URL và lưu trữ vào database: {Url} -> {PublicId}", request.Url, result.PublicId);

        return Ok(new
        {
            success = true,
            video = savedVideo,
            cloudinary = result
        });
    }

    /// <summary>
    /// Đính kèm hoặc cập nhật nội dung Text / File phụ đề (VTT) tiếng Anh và tiếng Việt cho một video đã tồn tại
    /// </summary>
    [HttpPost("subtitles/{*publicId}")]
    [HttpPost("subtitles")]
    public async Task<IActionResult> AttachSubtitles(
        string? publicId = null,
        [FromForm] string? videoPublicId = null,
        [FromForm] IFormFile? vttEn = null,
        [FromForm] string? vttEnText = null,
        [FromForm] string? vttEnUrl = null,
        [FromForm] IFormFile? vttVi = null,
        [FromForm] string? vttViText = null,
        [FromForm] string? vttViUrl = null,
        [FromForm] string? folder = null)
    {
        var targetPublicId = !string.IsNullOrWhiteSpace(publicId) ? publicId : videoPublicId;
        if (string.IsNullOrWhiteSpace(targetPublicId))
        {
            return BadRequest(new { success = false, errorMessage = "PublicId không hợp lệ." });
        }

        var existingVideo = await _videosService.GetVideoByPublicIdAsync(targetPublicId, HttpContext.RequestAborted);
        if (existingVideo == null)
        {
            return NotFound(new { success = false, errorMessage = "Không tìm thấy video trong cơ sở dữ liệu." });
        }

        var targetFolder = folder ?? (!string.IsNullOrWhiteSpace(existingVideo.Folder) ? existingVideo.Folder : "quizcard_videos");
        string? newVttEnText = vttEnText ?? existingVideo.VttEnText;
        string? newVttEnUrl = existingVideo.VttEnUrl;
        string? newVttEnPublicId = existingVideo.VttEnPublicId;

        string? newVttViText = vttViText ?? existingVideo.VttViText;
        string? newVttViUrl = existingVideo.VttViUrl;
        string? newVttViPublicId = existingVideo.VttViPublicId;

        // Xử lý phụ đề tiếng Anh
        if (vttEn != null && vttEn.Length > 0)
        {
            using (var reader = new StreamReader(vttEn.OpenReadStream(), Encoding.UTF8))
            {
                newVttEnText = await reader.ReadToEndAsync(HttpContext.RequestAborted);
            }

            if (!string.IsNullOrEmpty(newVttEnPublicId))
            {
                await _cloudinaryService.DeleteRawFileAsync(newVttEnPublicId, HttpContext.RequestAborted);
            }

            await using var vttStream = vttEn.OpenReadStream();
            var uploadRes = await _cloudinaryService.UploadRawFileAsync(vttStream, vttEn.FileName, targetFolder, HttpContext.RequestAborted);
            if (uploadRes.Success && !string.IsNullOrEmpty(uploadRes.SecureUrl))
            {
                newVttEnUrl = uploadRes.SecureUrl;
                newVttEnPublicId = uploadRes.PublicId;
            }
        }
        else if (vttEnUrl != null)
        {
            newVttEnUrl = string.IsNullOrWhiteSpace(vttEnUrl) ? null : vttEnUrl.Trim();
        }

        // Xử lý phụ đề tiếng Việt
        if (vttVi != null && vttVi.Length > 0)
        {
            using (var reader = new StreamReader(vttVi.OpenReadStream(), Encoding.UTF8))
            {
                newVttViText = await reader.ReadToEndAsync(HttpContext.RequestAborted);
            }

            if (!string.IsNullOrEmpty(newVttViPublicId))
            {
                await _cloudinaryService.DeleteRawFileAsync(newVttViPublicId, HttpContext.RequestAborted);
            }

            await using var vttStream = vttVi.OpenReadStream();
            var uploadRes = await _cloudinaryService.UploadRawFileAsync(vttStream, vttVi.FileName, targetFolder, HttpContext.RequestAborted);
            if (uploadRes.Success && !string.IsNullOrEmpty(uploadRes.SecureUrl))
            {
                newVttViUrl = uploadRes.SecureUrl;
                newVttViPublicId = uploadRes.PublicId;
            }
        }
        else if (vttViUrl != null)
        {
            newVttViUrl = string.IsNullOrWhiteSpace(vttViUrl) ? null : vttViUrl.Trim();
        }

        var updateRequest = new UpdateCloudinaryVideoRequest
        {
            Title = existingVideo.Title,
            Description = existingVideo.Description,
            VttEnText = newVttEnText,
            VttEnUrl = newVttEnUrl,
            VttEnPublicId = newVttEnPublicId,
            VttViText = newVttViText,
            VttViUrl = newVttViUrl,
            VttViPublicId = newVttViPublicId,
            IsActive = existingVideo.IsActive
        };

        var updated = await _videosService.UpdateVideoAsync(targetPublicId, updateRequest, HttpContext.RequestAborted);
        return Ok(new { success = true, video = updated });
    }

    /// <summary>
    /// Cập nhật thông tin tiêu đề, mô tả hoặc trạng thái của video
    /// </summary>
    [HttpPut("{*publicId}")]
    public async Task<IActionResult> UpdateVideo(string publicId, [FromBody] UpdateCloudinaryVideoRequest request)
    {
        if (string.IsNullOrWhiteSpace(publicId))
        {
            return BadRequest(new { success = false, errorMessage = "PublicId không hợp lệ." });
        }

        var updated = await _videosService.UpdateVideoAsync(publicId, request, HttpContext.RequestAborted);
        if (updated == null)
        {
            return NotFound(new { success = false, errorMessage = "Không tìm thấy video cần cập nhật." });
        }

        return Ok(new { success = true, video = updated });
    }

    /// <summary>
    /// Xóa một video khỏi Cloudinary và đồng thời xóa khỏi cơ sở dữ liệu.
    /// Hỗ trợ cả DELETE /api/admin/videos/{publicId}, DELETE /api/admin/videos?publicId=... và POST /api/admin/videos/delete
    /// </summary>
    [HttpDelete("{*publicId}")]
    [HttpDelete]
    [HttpPost("delete")]
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
            return BadRequest(new { success = false, errorMessage = "PublicId video không hợp lệ." });
        }

        var targetId = rawId.Trim();
        if (targetId.Contains('%'))
        {
            try { targetId = Uri.UnescapeDataString(targetId).Trim(); } catch { }
        }

        // 1. Tìm thông tin video trong DB trước để lấy chính xác PublicId, VttEnPublicId, VttViPublicId
        var existingVideo = await _videosService.GetVideoByPublicIdAsync(targetId, HttpContext.RequestAborted);
        if (existingVideo == null && Guid.TryParse(targetId, out var guidId))
        {
            var allVideos = await _videosService.GetAllVideosAsync(onlyActive: false, HttpContext.RequestAborted);
            existingVideo = allVideos.FirstOrDefault(v => v.Id == guidId);
        }

        var effectivePublicId = existingVideo?.PublicId ?? targetId.TrimStart('/');

        // 2. Dọn dẹp các file phụ đề VTT nếu có
        if (existingVideo != null)
        {
            if (!string.IsNullOrEmpty(existingVideo.VttEnPublicId))
            {
                try { await _cloudinaryService.DeleteRawFileAsync(existingVideo.VttEnPublicId, HttpContext.RequestAborted); } catch { }
            }
            if (!string.IsNullOrEmpty(existingVideo.VttViPublicId))
            {
                try { await _cloudinaryService.DeleteRawFileAsync(existingVideo.VttViPublicId, HttpContext.RequestAborted); } catch { }
            }
        }

        // 3. Xóa video khỏi Cloudinary
        bool cloudSuccess = false;
        try
        {
            cloudSuccess = await _cloudinaryService.DeleteVideoAsync(effectivePublicId, HttpContext.RequestAborted);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Lỗi khi gọi API xóa Cloudinary cho video {PublicId}", effectivePublicId);
        }

        // 4. Xóa khỏi Database
        var dbSuccess = await _videosService.DeleteVideoAsync(effectivePublicId, HttpContext.RequestAborted);
        if (!dbSuccess && existingVideo != null)
        {
            dbSuccess = await _videosService.DeleteVideoAsync(existingVideo.PublicId, HttpContext.RequestAborted);
        }
        if (!dbSuccess && targetId != effectivePublicId)
        {
            dbSuccess = await _videosService.DeleteVideoAsync(targetId, HttpContext.RequestAborted);
        }

        _logger.LogInformation("Admin đã thực hiện xóa video {PublicId}. Cloudinary: {Cloud}, DB: {Db}", effectivePublicId, cloudSuccess, dbSuccess);

        return Ok(new
        {
            success = dbSuccess || cloudSuccess,
            publicId = effectivePublicId,
            cloudinaryDeleted = cloudSuccess,
            dbDeleted = dbSuccess,
            message = dbSuccess || cloudSuccess ? "Đã xóa video thành công." : "Không thể xóa video khỏi cơ sở dữ liệu."
        });
    }
}

public class AdminDeleteVideoRequest
{
    public string? PublicId { get; set; }
    public string? Id { get; set; }
}

public class AdminUploadUrlRequest
{
    public string Url { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Folder { get; set; }
    public string? VttEnText { get; set; }
    public string? VttEnUrl { get; set; }
    public string? VttViText { get; set; }
    public string? VttViUrl { get; set; }
}
