
using Microsoft.AspNetCore.Mvc;
using TVJROK.Application.Features.Settings.DTOs;
using TVJROK.Application.Features.Settings.Interfaces;

namespace TVJROK.API.Controllers;

[ApiController]
[Route("api/settings")]
public class SettingsController : ControllerBase
{
    private readonly IRestaurantSettingService _settingService;

    public SettingsController(
        IRestaurantSettingService settingService)
    {
        _settingService = settingService;
    }

    [HttpGet]
    public async Task<ActionResult<RestaurantSettingResponseDto>> Get()
    {
        var setting = await _settingService.GetAsync();

        return Ok(setting);
    }

    [HttpPut]
    public async Task<ActionResult<RestaurantSettingResponseDto>> Update(
        [FromBody] UpdateRestaurantSettingDto dto)
    {
        var setting = await _settingService.UpdateAsync(dto);

        return Ok(setting);
    }
}
