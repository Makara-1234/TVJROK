
using Microsoft.EntityFrameworkCore;
using TVJROK.Application.Features.Settings.DTOs;
using TVJROK.Application.Features.Settings.Interfaces;
using TVJROK.Domain.Entities;
using TVJROK.Infrastructure.Persistence;

namespace TVJROK.Infrastructure.Services;

public class RestaurantSettingService : IRestaurantSettingService
{
    private readonly TVJROKDbContext _context;

    public RestaurantSettingService(TVJROKDbContext context)
    {
        _context = context;
    }

    public async Task<RestaurantSettingResponseDto> GetAsync()
    {
        var setting = await _context.RestaurantSettings
            .FirstOrDefaultAsync();

        if (setting == null)
        {
            setting = new RestaurantSetting();

            _context.RestaurantSettings.Add(setting);
            await _context.SaveChangesAsync();
        }

        return MapToResponse(setting);
    }

    public async Task<RestaurantSettingResponseDto> UpdateAsync(
        UpdateRestaurantSettingDto dto)
    {
        var setting = await _context.RestaurantSettings
            .FirstOrDefaultAsync();

        if (setting == null)
        {
            setting = new RestaurantSetting();
            _context.RestaurantSettings.Add(setting);
        }

        setting.RestaurantName = dto.RestaurantName.Trim();
        setting.PhoneNumber = dto.PhoneNumber.Trim();
        setting.Address = dto.Address.Trim();
        setting.LogoUrl = dto.LogoUrl;
        setting.CurrencyCode = dto.CurrencyCode.Trim().ToUpperInvariant();
        setting.OpeningTime = dto.OpeningTime;
        setting.ClosingTime = dto.ClosingTime;
        setting.IsOpen = dto.IsOpen;
        setting.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToResponse(setting);
    }

    private static RestaurantSettingResponseDto MapToResponse(
        RestaurantSetting setting)
    {
        return new RestaurantSettingResponseDto
        {
            Id = setting.Id,
            RestaurantName = setting.RestaurantName,
            PhoneNumber = setting.PhoneNumber,
            Address = setting.Address,
            LogoUrl = setting.LogoUrl,
            CurrencyCode = setting.CurrencyCode,
            OpeningTime = setting.OpeningTime,
            ClosingTime = setting.ClosingTime,
            IsOpen = setting.IsOpen
        };
    }
}
