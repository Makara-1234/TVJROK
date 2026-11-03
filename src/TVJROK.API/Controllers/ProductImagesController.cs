
using Microsoft.AspNetCore.Mvc;
using TVJROK.Application.Features.Products.Interfaces;

namespace TVJROK.API.Controllers;

[ApiController]
[Route("api/products/{productId:guid}/images")]
public class ProductImagesController : ControllerBase
{
    private readonly IProductImageService _imageService;

    public ProductImagesController(IProductImageService imageService)
    {
        _imageService = imageService;
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload(
        Guid productId,
        IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Please select an image." });

        const long maxFileSize = 5 * 1024 * 1024;

        if (file.Length > maxFileSize)
            return BadRequest(new { message = "Maximum image size is 5 MB." });

        var allowedTypes = new[]
        {
            "image/jpeg",
            "image/png",
            "image/webp"
        };

        if (!allowedTypes.Contains(file.ContentType.ToLowerInvariant()))
            return BadRequest(new { message = "Only JPG, PNG and WEBP are allowed." });

        try
        {
            await using var stream = file.OpenReadStream();

            var imageUrl = await _imageService.UploadAsync(
                productId,
                stream,
                file.FileName,
                file.ContentType
            );

            return Ok(new
            {
                message = "Image uploaded successfully.",
                imageUrl
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{imageId:guid}")]
    public async Task<IActionResult> Delete(
        Guid productId,
        Guid imageId)
    {
        try
        {
            var deleted = await _imageService.DeleteAsync(
                productId,
                imageId
            );

            if (!deleted)
                return NotFound(new { message = "Image not found." });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{imageId:guid}/primary")]
public async Task<IActionResult> SetPrimary(
    Guid productId,
    Guid imageId)
{
    var result = await _imageService.SetPrimaryAsync(
        productId,
        imageId
    );

    if (!result)
    {
        return NotFound(new
        {
            message = "Product image not found."
        });
    }

    return Ok(new
    {
        message = "Primary image updated successfully."
    });
}
}
