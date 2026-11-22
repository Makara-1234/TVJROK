
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TVJROK.API.Models;
using TVJROK.Application.Features.Settings.DTOs;
using TVJROK.Application.Features.Settings.Interfaces;
using TVJROK.Infrastructure.Services;

namespace TVJROK.API.Controllers;

[ApiController]
[Route("api/settings")]
public class SettingsController : ControllerBase
{
    private readonly IRestaurantSettingService _settingService;
    private readonly SupabaseStorageService _storageService;

    public SettingsController(
        IRestaurantSettingService settingService,
        SupabaseStorageService storageService)
    {
        _settingService = settingService;
        _storageService = storageService;
    }

    // GET: api/settings
    // Public: Customer can read restaurant settings
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<RestaurantSettingResponseDto>> Get()
    {
        var setting = await _settingService.GetAsync();
        return Ok(setting);
    }

    // PUT: api/settings
    // Admin only
    [Authorize(Roles = "Admin")]
    [HttpPut]
    public async Task<ActionResult<RestaurantSettingResponseDto>> Update(
        [FromBody] UpdateRestaurantSettingDto dto)
    {
        var setting = await _settingService.UpdateAsync(dto);
        return Ok(setting);
    }

    // POST: api/settings/khqr
    // Admin only
    [Authorize(Roles = "Admin")]
    [HttpPost("khqr")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<ActionResult<RestaurantSettingResponseDto>> UploadKhqr(
        [FromForm] UploadKhqrRequest request)
    {
        var file = request.File;

        if (file == null || file.Length == 0)
        {
            return BadRequest(new
            {
                message = "Please select a KHQR image."
            });
        }

        // Maximum file size: 5MB
        if (file.Length > 5 * 1024 * 1024)
        {
            return BadRequest(new
            {
                message = "Image size must not exceed 5MB."
            });
        }

        // Allowed image types
        var allowedTypes = new[]
        {
            "image/jpeg",
            "image/png",
            "image/webp"
        };

        if (!allowedTypes.Contains(file.ContentType.ToLowerInvariant()))
        {
            return BadRequest(new
            {
                message = "Only JPG, PNG and WEBP images are allowed."
            });
        }

        // Validate file extension
        var extension = Path.GetExtension(file.FileName)
            .ToLowerInvariant();

        var allowedExtensions = new[]
        {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        };

        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest(new
            {
                message = "Invalid image extension."
            });
        }

        try
        {
            await using var stream = file.OpenReadStream();

            var imageUrl = await _storageService.UploadAsync(
                stream,
                file.FileName,
                file.ContentType,
                "settings/khqr"
            );

            var setting = await _settingService
                .UpdateKhqrImageUrlAsync(imageUrl);

            return Ok(setting);
        }
        catch (Exception)
        {
            // Do not expose internal exception details to clients
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message = "KHQR upload failed."
                }
            );
        }
    }
}
