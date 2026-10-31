using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.FolderDTOs;
using System.Security.Claims;

namespace QuizCard.UI.Controllers;

/// <summary>
/// RESTful API Controller quản lý Thư mục bộ thẻ (Folders):
/// Cung cấp các endpoints cho Frontend gọi qua HTTP:
/// - GET    /api/folders?userId=... : Lấy danh sách thư mục (dựa vào idUser và thư mục hệ thống)
/// - GET    /api/folders/{id}       : Lấy chi tiết một thư mục
/// - POST   /api/folders            : Tạo mới một thư mục bộ thẻ (bắt buộc đăng nhập)
/// - PUT    /api/folders/{id}       : Cập nhật thông tin thư mục
/// - DELETE /api/folders/{id}       : Xóa thư mục (chuyển các bộ thẻ về thư mục "Chung")
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class FoldersController : ControllerBase
{
    private readonly IFolderService _folderService;

    public FoldersController(IFolderService folderService)
    {
        _folderService = folderService;
    }

    /// <summary>
    /// Endpoint: Lấy danh sách thư mục bộ thẻ dựa theo userId (hoặc thư mục mặc định hệ thống).
    /// Trả về: HTTP 200 OK + mảng JSON các FolderDto.
    /// </summary>
    
    [HttpGet]
    [Authorize("AuthorizedForUser")]
    public async Task<ActionResult<IEnumerable<FolderDto>>> GetAll([FromQuery] Guid? userId = null)
    {
        Guid? targetUserId = userId;
        // Chỉ lấy userId từ Claim xác thực nếu người dùng ĐÃ ĐĂNG NHẬP và không truyền tham số userId
        if (!targetUserId.HasValue || targetUserId == Guid.Empty)
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (Guid.TryParse(userIdClaim, out var parsedGuid))
                {
                    targetUserId = parsedGuid;
                }
            }
            else
            {
                // Là Guest: Không lấy userId, chỉ lấy danh sách các thư mục mặc định hệ thống
                targetUserId = null;
            }
        }

        var folders = await _folderService.GetAllFoldersAsync(targetUserId);
        return Ok(folders);
    }

    /// <summary>
    /// Endpoint: Lấy chi tiết một thư mục theo Id.
    /// Trả về: HTTP 200 OK nếu tìm thấy, hoặc HTTP 404 NotFound.
    /// </summary>
    
    [HttpGet("{id:guid}")]
    [Authorize("AuthorizedForUser")]
    public async Task<ActionResult<FolderDto>> GetById(Guid id)
    {
        var folder = await _folderService.GetFolderByIdAsync(id);
        if (folder is null) return NotFound(new { message = "Không tìm thấy thư mục bộ thẻ" });
        return Ok(folder);
    }

    /// <summary>
    /// Endpoint: Tạo một thư mục bộ thẻ mới (BẮT BUỘC người dùng phải đăng nhập).
    /// Trả về: HTTP 201 Created kèm dữ liệu vừa tạo, hoặc HTTP 401 Unauthorized nếu chưa đăng nhập.
    /// </summary>
    [Authorize("AuthorizedForUser")]
    [HttpPost]
    public async Task<ActionResult<FolderDto>> Create([FromBody] CreateFolderRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        Guid? userId = request.UserId;
        if (!userId.HasValue || userId == Guid.Empty)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(userIdClaim, out var parsedGuid))
            {
                userId = parsedGuid;
            }
        }

        // Bắt buộc người dùng phải đăng nhập mới được tạo thư mục
        if (!userId.HasValue || userId == Guid.Empty)
        {
            return Unauthorized(new { message = "Vui lòng đăng nhập để tạo thư mục bộ thẻ." });
        }

        try
        {
            var requestWithUser = request with { UserId = userId };
            var created = await _folderService.CreateFolderAsync(requestWithUser);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Endpoint: Chỉnh sửa tên, mô tả, biểu tượng hoặc màu sắc thư mục.
    /// Trả về: HTTP 200 OK kèm dữ liệu đã sửa, hoặc HTTP 404 NotFound.
    /// </summary>
    [Authorize("AuthorizedForUser")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<FolderDto>> Update(Guid id, [FromBody] UpdateFolderRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var updated = await _folderService.UpdateFolderAsync(id, request);
            if (updated is null) return NotFound(new { message = "Không tìm thấy thư mục cần cập nhật" });
            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Endpoint: Xóa thư mục bộ thẻ.
    /// Không cho phép xóa thư mục mặc định hệ thống.
    /// Trả về: HTTP 204 NoContent khi xóa thành công.
    /// </summary>
    [Authorize("AuthorizedForUser")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var folder = await _folderService.GetFolderByIdAsync(id);
        if (folder is null) return NotFound(new { message = "Không tìm thấy thư mục cần xóa" });

        // Không cho phép xóa thư mục mặc định hệ thống
        if (folder.UserId == null)
        {
            return BadRequest(new { message = "Không thể xóa thư mục mặc định của hệ thống." });
        }

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(userIdClaim, out var currentUserId))
        {
            if (folder.UserId != currentUserId)
            {
                return Forbid();
            }
        }

        var success = await _folderService.DeleteFolderAsync(id);
        if (!success) return NotFound(new { message = "Không tìm thấy thư mục cần xóa" });
        return NoContent();
    }
}

