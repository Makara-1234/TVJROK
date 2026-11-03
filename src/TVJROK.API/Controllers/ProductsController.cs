
using Microsoft.AspNetCore.Mvc;
using TVJROK.Application.Features.Products.DTOs;
using TVJROK.Application.Features.Products.Interfaces;

namespace TVJROK.API.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var products = await _productService.GetAllAsync();
        return Ok(products);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var product = await _productService.GetByIdAsync(id);

        if (product == null)
            return NotFound(new { message = "Product not found." });

        return Ok(product);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateProductDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new { message = "Product name is required." });

        if (dto.Price <= 0)
            return BadRequest(new { message = "Price must be greater than zero." });

        try
        {
            var product = await _productService.CreateAsync(dto);

            return CreatedAtAction(
                nameof(GetById),
                new { id = product.Id },
                product
            );
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        UpdateProductDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new { message = "Product name is required." });

        if (dto.Price <= 0)
            return BadRequest(new { message = "Price must be greater than zero." });

        try
        {
            var updated = await _productService.UpdateAsync(id, dto);

            if (!updated)
                return NotFound(new { message = "Product not found." });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var deleted = await _productService.DeleteAsync(id);

            if (!deleted)
                return NotFound(new { message = "Product not found." });

            return NoContent();
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException)
        {
            return Conflict(new
            {
                message = "Cannot delete this product because it is used in existing orders."
            });
        }
    }

    
    [HttpGet("paged")]
    public async Task<IActionResult> GetPaged(
        [FromQuery] ProductQueryDto query)
    {
        var result = await _productService.GetPagedAsync(query);

        return Ok(result);
    }

}
