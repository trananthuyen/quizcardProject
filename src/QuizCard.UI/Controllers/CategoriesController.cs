using Microsoft.AspNetCore.Mvc;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.CategoryDTOs;

namespace QuizCard.UI.Controllers;

/// <summary>
/// RESTful API Controller quản lý Phân loại bộ thẻ (Categories):
/// Cung cấp các endpoints cho Frontend gọi qua HTTP:
/// - GET    /api/categories        : Lấy danh sách tất cả các phân loại
/// - GET    /api/categories/{id}   : Lấy chi tiết một phân loại
/// - POST   /api/categories        : Tạo mới một phân loại bộ thẻ
/// - PUT    /api/categories/{id}   : Cập nhật thông tin phân loại
/// - DELETE /api/categories/{id}   : Xóa phân loại (chuyển các bộ thẻ về phân loại "Chung")
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    /// <summary>
    /// Endpoint: Lấy danh sách toàn bộ các phân loại bộ thẻ.
    /// Trả về: HTTP 200 OK + mảng JSON các CategoryDto.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetAll()
    {
        var categories = await _categoryService.GetAllCategoriesAsync();
        return Ok(categories);
    }

    /// <summary>
    /// Endpoint: Lấy chi tiết một phân loại theo Id.
    /// Trả về: HTTP 200 OK nếu tìm thấy, hoặc HTTP 404 NotFound.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CategoryDto>> GetById(Guid id)
    {
        var category = await _categoryService.GetCategoryByIdAsync(id);
        if (category is null) return NotFound(new { message = "Không tìm thấy phân loại bộ thẻ" });
        return Ok(category);
    }

    /// <summary>
    /// Endpoint: Tạo một phân loại bộ thẻ mới.
    /// Trả về: HTTP 201 Created kèm dữ liệu vừa tạo.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create([FromBody] CreateCategoryRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var created = await _categoryService.CreateCategoryAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Endpoint: Chỉnh sửa tên, mô tả, biểu tượng hoặc màu sắc phân loại.
    /// Trả về: HTTP 200 OK kèm dữ liệu đã sửa, hoặc HTTP 404 NotFound.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CategoryDto>> Update(Guid id, [FromBody] UpdateCategoryRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var updated = await _categoryService.UpdateCategoryAsync(id, request);
            if (updated is null) return NotFound(new { message = "Không tìm thấy phân loại cần cập nhật" });
            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Endpoint: Xóa phân loại bộ thẻ.
    /// Trả về: HTTP 204 NoContent khi xóa thành công.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _categoryService.DeleteCategoryAsync(id);
        if (!success) return NotFound(new { message = "Không tìm thấy phân loại cần xóa" });
        return NoContent();
    }
}

