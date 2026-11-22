
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using TVJROK.Application.Features.Categories.DTOs;
using TVJROK.Application.Features.Categories.Interfaces;

namespace TVJROK.API.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    // =====================================
    // PUBLIC: Get All Categories
    // =====================================

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await _categoryService.GetAllAsync();

        return Ok(categories);
    }

    // =====================================
    // PUBLIC: Get Category By ID
    // =====================================

    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var category = await _categoryService.GetByIdAsync(id);

        if (category == null)
        {
            return NotFound(new
            {
                message = "Category not found."
            });
        }

        return Ok(category);
    }

    // =====================================
    // ADMIN: Create Category
    // =====================================

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateCategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new
            {
                message = "Category name is required."
            });
        }

        var category = await _categoryService.CreateAsync(dto);

        return CreatedAtAction(
            nameof(GetById),
            new { id = category.Id },
            category
        );
    }

    // =====================================
    // ADMIN: Update Category
    // =====================================

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateCategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new
            {
                message = "Category name is required."
            });
        }

        var updated = await _categoryService.UpdateAsync(id, dto);

        if (!updated)
        {
            return NotFound(new
            {
                message = "Category not found."
            });
        }

        return NoContent();
    }

    // =====================================
    // ADMIN: Delete Category
    // =====================================

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var deleted = await _categoryService.DeleteAsync(id);

            if (!deleted)
            {
                return NotFound(new
                {
                    message = "Category not found."
                });
            }

            return NoContent();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message = "Cannot delete this category because it has products."
            });
        }
    }
}
