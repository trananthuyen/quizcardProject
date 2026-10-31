using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace QuizCard.Infrastructure.ExternalAPICalls.cloudinaryAPIs;

/// <summary>
/// Cài đặt dịch vụ tương tác trực tiếp với Cloudinary REST API qua HttpClient chuẩn của .NET.
/// Đảm bảo tính độc lập, hiệu năng cao, hỗ trợ cả Signed Upload (bảo mật cao), Unsigned Upload,
/// và cơ chế Chunked Upload (phân đoạn từng mảnh 20MB) cho các file video dung lượng lớn trên 100MB.
/// </summary>
public class CloudinaryService : ICloudinaryService
{
    private readonly HttpClient _httpClient;
    private readonly CloudinarySettings _settings;
    private readonly ILogger<CloudinaryService> _logger;

    // Kích thước mỗi chunk khi upload phân đoạn (20 MB - lớn hơn ngưỡng tối thiểu 5MB của Cloudinary)
    private const int ChunkSize = 20 * 1024 * 1024;

    public CloudinaryService(
        HttpClient httpClient,
        IOptions<CloudinarySettings> options,
        ILogger<CloudinaryService> logger)
    {
        _httpClient = httpClient;
        _settings = options.Value;
        _logger = logger;
    }

    public bool IsConfigured => _settings.IsConfigured;
    public string CloudName => _settings.CloudName;

    /// <summary>
    /// Tải luồng video trực tiếp từ client lên Cloudinary.
    /// Tự động kích hoạt cơ chế Chunked Upload nếu dung lượng file lớn hơn 20MB (hỗ trợ file 100MB - 1GB).
    /// </summary>
    public async Task<CloudinaryUploadResult> UploadVideoAsync(
        Stream stream,
        string fileName,
        string? contentType = null,
        string? customFolder = null,
        CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
        {
            _logger.LogWarning("Cloudinary chưa được cấu hình (thiếu CloudName, ApiKey hoặc UploadPreset trong appsettings).");
            return new CloudinaryUploadResult
            {
                Success = false,
                ErrorMessage = "Dịch vụ Cloudinary chưa được cấu hình khóa API hoặc CloudName trên máy chủ."
            };
        }

        Stream workingStream = stream;
        string? tempPath = null;

        try
        {
            var folder = !string.IsNullOrWhiteSpace(customFolder) ? customFolder : _settings.Folder;
            var endpoint = $"https://api.cloudinary.com/v1_1/{_settings.CloudName}/video/upload";

            // Nếu luồng không cho phép Seek, ghi ra file đệm tạm thời
            if (!stream.CanSeek)
            {
                tempPath = Path.Combine(Path.GetTempPath(), $"cld_stream_{Guid.NewGuid():N}.tmp");
                var tempFs = new FileStream(tempPath, FileMode.Create, FileAccess.ReadWrite, FileShare.None, 65536);
                await stream.CopyToAsync(tempFs, cancellationToken);
                tempFs.Seek(0, SeekOrigin.Begin);
                workingStream = tempFs;
            }

            // Nếu file lớn hơn 20MB -> Sử dụng Chunked Upload
            if (workingStream.Length > ChunkSize)
            {
                return await UploadVideoChunkedAsync(workingStream, fileName, contentType, folder, endpoint, cancellationToken);
            }

            return await UploadVideoSingleAsync(workingStream, fileName, contentType, folder, endpoint, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi xảy ra trong quá trình upload video '{FileName}' lên Cloudinary.", fileName);
            return new CloudinaryUploadResult
            {
                Success = false,
                ErrorMessage = $"Lỗi khi tải video lên Cloudinary: {ex.Message}"
            };
        }
        finally
        {
            if (tempPath != null)
            {
                await workingStream.DisposeAsync();
                try
                {
                    if (File.Exists(tempPath)) File.Delete(tempPath);
                }
                catch { }
            }
        }
    }

    /// <summary>
    /// Upload video dạng đơn lẻ cho các file nhỏ (dưới 20MB)
    /// </summary>
    private async Task<CloudinaryUploadResult> UploadVideoSingleAsync(
        Stream stream,
        string fileName,
        string? contentType,
        string folder,
        string endpoint,
        CancellationToken cancellationToken)
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        using var content = new MultipartFormDataContent();

        var streamContent = new StreamContent(stream);
        streamContent.Headers.ContentType = new MediaTypeHeaderValue(string.IsNullOrWhiteSpace(contentType) ? "video/mp4" : contentType);
        content.Add(streamContent, "file", fileName);

        if (!string.IsNullOrWhiteSpace(_settings.ApiKey) && !string.IsNullOrWhiteSpace(_settings.ApiSecret))
        {
            var paramsToSign = new SortedDictionary<string, string>
            {
                { "folder", folder },
                { "timestamp", timestamp }
            };

            var signature = GenerateSignature(paramsToSign, _settings.ApiSecret);
            content.Add(new StringContent(_settings.ApiKey), "api_key");
            content.Add(new StringContent(timestamp), "timestamp");
            content.Add(new StringContent(folder), "folder");
            content.Add(new StringContent(signature), "signature");
        }
        else if (!string.IsNullOrWhiteSpace(_settings.UploadPreset))
        {
            content.Add(new StringContent(_settings.UploadPreset), "upload_preset");
            if (!string.IsNullOrWhiteSpace(folder))
            {
                content.Add(new StringContent(folder), "folder");
            }
        }

        _logger.LogInformation("Bắt đầu tải video '{FileName}' (Single) lên Cloudinary: {Endpoint}", fileName, endpoint);
        var response = await _httpClient.PostAsync(endpoint, content, cancellationToken);
        var responseString = await response.Content.ReadAsStringAsync(cancellationToken);

        return ParseCloudinaryResponse(response, responseString);
    }

    /// <summary>
    /// Upload video dung lượng lớn theo từng mảnh (Chunked Upload 20MB) để vượt qua giới hạn 100MB của Cloudinary
    /// </summary>
    private async Task<CloudinaryUploadResult> UploadVideoChunkedAsync(
        Stream stream,
        string fileName,
        string? contentType,
        string folder,
        string endpoint,
        CancellationToken cancellationToken)
    {
        var totalBytes = stream.Length;
        var uploadId = Guid.NewGuid().ToString("N");
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();

        string? signature = null;
        if (!string.IsNullOrWhiteSpace(_settings.ApiKey) && !string.IsNullOrWhiteSpace(_settings.ApiSecret))
        {
            var paramsToSign = new SortedDictionary<string, string>
            {
                { "folder", folder },
                { "timestamp", timestamp }
            };
            signature = GenerateSignature(paramsToSign, _settings.ApiSecret);
        }

        long offset = 0;
        HttpResponseMessage lastResponse = null!;
        string lastResponseString = string.Empty;

        _logger.LogInformation("Khởi động Chunked Upload cho video '{FileName}' ({TotalMB} MB, UploadId: {UploadId})...",
            fileName, Math.Round(totalBytes / (1024.0 * 1024.0), 2), uploadId);

        while (offset < totalBytes)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var currentChunkSize = (int)Math.Min(ChunkSize, totalBytes - offset);
            var buffer = new byte[currentChunkSize];

            stream.Seek(offset, SeekOrigin.Begin);
            var read = 0;
            while (read < currentChunkSize)
            {
                var bytesRead = await stream.ReadAsync(buffer.AsMemory(read, currentChunkSize - read), cancellationToken);
                if (bytesRead == 0) break;
                read += bytesRead;
            }

            var end = offset + read - 1;
            var percent = Math.Round((double)(end + 1) * 100 / totalBytes, 1);
            _logger.LogInformation("Đang tải chunk: {Start}-{End}/{Total} ({Percent}%) của '{FileName}'...",
                offset, end, totalBytes, percent, fileName);

            using var chunkContent = new MultipartFormDataContent();
            var byteContent = new ByteArrayContent(buffer, 0, read);
            byteContent.Headers.ContentType = new MediaTypeHeaderValue(string.IsNullOrWhiteSpace(contentType) ? "video/mp4" : contentType);
            chunkContent.Add(byteContent, "file", fileName);

            if (!string.IsNullOrWhiteSpace(_settings.ApiKey) && !string.IsNullOrWhiteSpace(signature))
            {
                chunkContent.Add(new StringContent(_settings.ApiKey), "api_key");
                chunkContent.Add(new StringContent(timestamp), "timestamp");
                chunkContent.Add(new StringContent(folder), "folder");
                chunkContent.Add(new StringContent(signature), "signature");
            }
            else if (!string.IsNullOrWhiteSpace(_settings.UploadPreset))
            {
                chunkContent.Add(new StringContent(_settings.UploadPreset), "upload_preset");
                if (!string.IsNullOrWhiteSpace(folder))
                {
                    chunkContent.Add(new StringContent(folder), "folder");
                }
            }

            using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
            request.Headers.TryAddWithoutValidation("X-Unique-Upload-Id", uploadId);
            chunkContent.Headers.ContentRange = new ContentRangeHeaderValue(offset, end, totalBytes);
            request.Content = chunkContent;

            var response = await _httpClient.SendAsync(request, cancellationToken);
            var responseString = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Thất bại tại chunk {Start}-{End} ({StatusCode}): {Response}", offset, end, response.StatusCode, responseString);
                return ParseCloudinaryResponse(response, responseString);
            }

            lastResponse = response;
            lastResponseString = responseString;
            offset += read;
        }

        _logger.LogInformation("Hoàn tất tất cả các chunks của video '{FileName}'. Bắt đầu phân tích kết quả Cloudinary...", fileName);
        return ParseCloudinaryResponse(lastResponse, lastResponseString);
    }

    /// <summary>
    /// Tải video từ một đường dẫn URL bên ngoài lên lưu trữ Cloudinary
    /// </summary>
    public async Task<CloudinaryUploadResult> UploadVideoFromUrlAsync(
        string videoUrl,
        string? customFolder = null,
        CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
        {
            return new CloudinaryUploadResult
            {
                Success = false,
                ErrorMessage = "Dịch vụ Cloudinary chưa được cấu hình trên máy chủ."
            };
        }

        try
        {
            var folder = !string.IsNullOrWhiteSpace(customFolder) ? customFolder : _settings.Folder;
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();

            using var content = new MultipartFormDataContent();
            content.Add(new StringContent(videoUrl), "file");

            if (!string.IsNullOrWhiteSpace(_settings.ApiKey) && !string.IsNullOrWhiteSpace(_settings.ApiSecret))
            {
                var paramsToSign = new SortedDictionary<string, string>
                {
                    { "folder", folder },
                    { "timestamp", timestamp }
                };

                var signature = GenerateSignature(paramsToSign, _settings.ApiSecret);

                content.Add(new StringContent(_settings.ApiKey), "api_key");
                content.Add(new StringContent(timestamp), "timestamp");
                content.Add(new StringContent(folder), "folder");
                content.Add(new StringContent(signature), "signature");
            }
            else if (!string.IsNullOrWhiteSpace(_settings.UploadPreset))
            {
                content.Add(new StringContent(_settings.UploadPreset), "upload_preset");
                if (!string.IsNullOrWhiteSpace(folder))
                {
                    content.Add(new StringContent(folder), "folder");
                }
            }

            var endpoint = $"https://api.cloudinary.com/v1_1/{_settings.CloudName}/video/upload";
            _logger.LogInformation("Bắt đầu nạp video từ URL lên Cloudinary: {Url} -> {Endpoint}", videoUrl, endpoint);

            var response = await _httpClient.PostAsync(endpoint, content, cancellationToken);
            var responseString = await response.Content.ReadAsStringAsync(cancellationToken);

            return ParseCloudinaryResponse(response, responseString);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi xảy ra trong quá trình upload video từ URL lên Cloudinary: {Url}", videoUrl);
            return new CloudinaryUploadResult
            {
                Success = false,
                ErrorMessage = $"Lỗi khi tải video từ URL lên Cloudinary: {ex.Message}"
            };
        }
    }

    /// <summary>
    /// Xóa một video khỏi Cloudinary theo public_id
    /// </summary>
    public async Task<bool> DeleteVideoAsync(string publicId, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
        {
            _logger.LogWarning("Không thể xóa video vì Cloudinary chưa được cấu hình.");
            return false;
        }

        try
        {
            var cleanPublicId = publicId.Trim().TrimStart('/');
            if (cleanPublicId.Contains('%'))
            {
                try { cleanPublicId = Uri.UnescapeDataString(cleanPublicId).Trim().TrimStart('/'); } catch { }
            }

            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
            var endpoint = $"https://api.cloudinary.com/v1_1/{_settings.CloudName}/video/destroy";

            using var content = new MultipartFormDataContent();
            content.Add(new StringContent(cleanPublicId), "public_id");

            if (!string.IsNullOrWhiteSpace(_settings.ApiKey) && !string.IsNullOrWhiteSpace(_settings.ApiSecret))
            {
                var paramsToSign = new SortedDictionary<string, string>
                {
                    { "public_id", cleanPublicId },
                    { "timestamp", timestamp }
                };

                var signature = GenerateSignature(paramsToSign, _settings.ApiSecret);

                content.Add(new StringContent(_settings.ApiKey), "api_key");
                content.Add(new StringContent(timestamp), "timestamp");
                content.Add(new StringContent(signature), "signature");
            }

            var response = await _httpClient.PostAsync(endpoint, content, cancellationToken);
            var responseString = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Xóa video '{PublicId}' thất bại ({StatusCode}): {Response}", cleanPublicId, response.StatusCode, responseString);
                return false;
            }

            using var doc = JsonDocument.Parse(responseString);
            if (doc.RootElement.TryGetProperty("result", out var resProp))
            {
                var result = resProp.GetString();
                return result == "ok" || result == "not found";
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi xảy ra khi gửi yêu cầu xóa video '{PublicId}' lên Cloudinary.", publicId);
            return false;
        }
    }

    /// <summary>
    /// Tải file thô (raw file như phụ đề .vtt, .srt) lên Cloudinary
    /// </summary>
    public async Task<CloudinaryUploadResult> UploadRawFileAsync(
        Stream stream,
        string fileName,
        string? customFolder = null,
        CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
        {
            return new CloudinaryUploadResult
            {
                Success = false,
                ErrorMessage = "Dịch vụ Cloudinary chưa được cấu hình trên máy chủ."
            };
        }

        try
        {
            var folder = !string.IsNullOrWhiteSpace(customFolder) ? customFolder : _settings.Folder;
            var endpoint = $"https://api.cloudinary.com/v1_1/{_settings.CloudName}/raw/upload";
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();

            using var content = new MultipartFormDataContent();
            var streamContent = new StreamContent(stream);
            streamContent.Headers.ContentType = new MediaTypeHeaderValue("text/vtt");
            content.Add(streamContent, "file", fileName);

            if (!string.IsNullOrWhiteSpace(_settings.ApiKey) && !string.IsNullOrWhiteSpace(_settings.ApiSecret))
            {
                var paramsToSign = new SortedDictionary<string, string>
                {
                    { "folder", folder },
                    { "timestamp", timestamp }
                };

                var signature = GenerateSignature(paramsToSign, _settings.ApiSecret);

                content.Add(new StringContent(_settings.ApiKey), "api_key");
                content.Add(new StringContent(timestamp), "timestamp");
                content.Add(new StringContent(folder), "folder");
                content.Add(new StringContent(signature), "signature");
            }
            else if (!string.IsNullOrWhiteSpace(_settings.UploadPreset))
            {
                content.Add(new StringContent(_settings.UploadPreset), "upload_preset");
                if (!string.IsNullOrWhiteSpace(folder))
                {
                    content.Add(new StringContent(folder), "folder");
                }
            }

            var response = await _httpClient.PostAsync(endpoint, content, cancellationToken);
            var responseString = await response.Content.ReadAsStringAsync(cancellationToken);

            return ParseCloudinaryResponse(response, responseString);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi xảy ra khi upload file thô '{FileName}' lên Cloudinary.", fileName);
            return new CloudinaryUploadResult
            {
                Success = false,
                ErrorMessage = $"Lỗi kết nối Cloudinary: {ex.Message}"
            };
        }
    }

    /// <summary>
    /// Xóa một file raw (.vtt, .srt) khỏi Cloudinary dựa theo publicId
    /// </summary>
    public async Task<bool> DeleteRawFileAsync(
        string publicId,
        CancellationToken cancellationToken = default)
    {
        if (!IsConfigured || string.IsNullOrWhiteSpace(publicId))
        {
            return false;
        }

        try
        {
            var cleanPublicId = publicId.Trim().TrimStart('/');
            if (cleanPublicId.Contains('%'))
            {
                try { cleanPublicId = Uri.UnescapeDataString(cleanPublicId).Trim().TrimStart('/'); } catch { }
            }

            var endpoint = $"https://api.cloudinary.com/v1_1/{_settings.CloudName}/raw/destroy";
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();

            using var content = new MultipartFormDataContent();
            content.Add(new StringContent(cleanPublicId), "public_id");

            if (!string.IsNullOrWhiteSpace(_settings.ApiKey) && !string.IsNullOrWhiteSpace(_settings.ApiSecret))
            {
                var paramsToSign = new SortedDictionary<string, string>
                {
                    { "public_id", cleanPublicId },
                    { "timestamp", timestamp }
                };

                var signature = GenerateSignature(paramsToSign, _settings.ApiSecret);

                content.Add(new StringContent(_settings.ApiKey), "api_key");
                content.Add(new StringContent(timestamp), "timestamp");
                content.Add(new StringContent(signature), "signature");
            }

            var response = await _httpClient.PostAsync(endpoint, content, cancellationToken);
            var responseString = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Xóa file raw '{PublicId}' thất bại ({StatusCode}): {Response}", cleanPublicId, response.StatusCode, responseString);
                return false;
            }

            using var doc = JsonDocument.Parse(responseString);
            if (doc.RootElement.TryGetProperty("result", out var resProp))
            {
                var result = resProp.GetString();
                return result == "ok" || result == "not found";
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi xảy ra khi gửi yêu cầu xóa file raw '{PublicId}' lên Cloudinary.", publicId);
            return false;
        }
    }

    /// <summary>
    /// Sinh URL phát video tối ưu (tự động điều chỉnh định dạng webm/mp4, chất lượng q_auto)
    /// </summary>
    public string GetOptimizedVideoUrl(string publicId, string? extension = "mp4", string? transformations = null)
    {
        return GetTransformedVideoUrl(publicId, transformations, extension);
    }

    /// <summary>
    /// Sinh URL phát video được tối ưu hóa tự động (q_auto, f_auto) và biến đổi tùy chọn
    /// </summary>
    public string GetTransformedVideoUrl(string publicId, string? transformations = null, string? extension = null)
    {
        var cleanPublicId = publicId.TrimStart('/');
        var tf = !string.IsNullOrWhiteSpace(transformations) ? transformations.Trim('/') + "/" : "f_auto,q_auto/";
        var ext = !string.IsNullOrWhiteSpace(extension) ? $".{extension.TrimStart('.')}" : "";

        return $"https://res.cloudinary.com/{_settings.CloudName}/video/upload/{tf}{cleanPublicId}{ext}";
    }

    /// <summary>
    /// Tự động tạo link thumbnail frame ảnh đại diện từ video trên Cloudinary
    /// </summary>
    public string GetVideoThumbnailUrl(string publicId, int width = 640, int height = 360)
    {
        var cleanPublicId = publicId.TrimStart('/');
        return $"https://res.cloudinary.com/{_settings.CloudName}/video/upload/c_fill,w_{width},h_{height},so_0/{cleanPublicId}.jpg";
    }

    /// <summary>
    /// Thuật toán tạo chữ ký SHA-1 theo tiêu chuẩn của Cloudinary
    /// </summary>
    private static string GenerateSignature(SortedDictionary<string, string> parameters, string apiSecret)
    {
        var sb = new StringBuilder();
        foreach (var kv in parameters)
        {
            if (sb.Length > 0) sb.Append('&');
            sb.Append(kv.Key).Append('=').Append(kv.Value);
        }
        sb.Append(apiSecret);

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        var hashBytes = SHA1.HashData(bytes);

        var hex = new StringBuilder(hashBytes.Length * 2);
        foreach (var b in hashBytes)
        {
            hex.Append(b.ToString("x2"));
        }

        return hex.ToString();
    }

    /// <summary>
    /// Phân tích JSON phản hồi từ Cloudinary API
    /// </summary>
    private CloudinaryUploadResult ParseCloudinaryResponse(HttpResponseMessage response, string responseString)
    {
        try
        {
            using var doc = JsonDocument.Parse(responseString);
            var root = doc.RootElement;

            if (!response.IsSuccessStatusCode)
            {
                var errorMsg = "Upload thất bại.";
                if (root.TryGetProperty("error", out var errorObj) && errorObj.TryGetProperty("message", out var msgProp))
                {
                    errorMsg = msgProp.GetString() ?? errorMsg;
                }

                _logger.LogWarning("Cloudinary trả về lỗi ({StatusCode}): {ErrorMessage}", response.StatusCode, errorMsg);
                return new CloudinaryUploadResult
                {
                    Success = false,
                    ErrorMessage = errorMsg
                };
            }

            var publicId = root.TryGetProperty("public_id", out var pid) ? pid.GetString() : null;
            var secureUrl = root.TryGetProperty("secure_url", out var surl) ? surl.GetString() : null;
            var url = root.TryGetProperty("url", out var u) ? u.GetString() : null;
            var format = root.TryGetProperty("format", out var fmt) ? fmt.GetString() : null;
            var resourceType = root.TryGetProperty("resource_type", out var rtype) ? rtype.GetString() : "video";
            var duration = root.TryGetProperty("duration", out var dur) ? dur.GetDouble() : 0;
            var width = root.TryGetProperty("width", out var w) ? w.GetInt32() : 0;
            var height = root.TryGetProperty("height", out var h) ? h.GetInt32() : 0;
            var bytes = root.TryGetProperty("bytes", out var b) ? b.GetInt64() : 0;

            var thumbnailUrl = !string.IsNullOrWhiteSpace(publicId) ? GetVideoThumbnailUrl(publicId) : null;

            _logger.LogInformation("Upload video lên Cloudinary thành công! PublicId: {PublicId}, SecureUrl: {SecureUrl}", publicId, secureUrl);

            return new CloudinaryUploadResult
            {
                Success = true,
                PublicId = publicId,
                SecureUrl = secureUrl,
                Url = url,
                Format = format,
                ResourceType = resourceType,
                Duration = duration,
                Width = width,
                Height = height,
                Bytes = bytes,
                ThumbnailUrl = thumbnailUrl
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi phân tích JSON phản hồi từ Cloudinary: {Response}", responseString);
            return new CloudinaryUploadResult
            {
                Success = false,
                ErrorMessage = $"Lỗi xử lý kết quả trả về từ Cloudinary: {ex.Message}"
            };
        }
    }
}
