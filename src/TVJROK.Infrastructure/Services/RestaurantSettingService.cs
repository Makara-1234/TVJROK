
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

    // Get restaurant settings
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

    // Update restaurant settings
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
        setting.KhqrImageUrl = dto.KhqrImageUrl;
        setting.CurrencyCode = dto.CurrencyCode.Trim().ToUpperInvariant();
        setting.OpeningTime = dto.OpeningTime;
        setting.ClosingTime = dto.ClosingTime;
        setting.IsOpen = dto.IsOpen;
        setting.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToResponse(setting);
    }

    // Update KHQR image URL only
    public async Task<RestaurantSettingResponseDto> UpdateKhqrImageUrlAsync(
        string imageUrl)
    {
        var setting = await _context.RestaurantSettings
            .FirstOrDefaultAsync();

        if (setting == null)
        {
            setting = new RestaurantSetting();
            _context.RestaurantSettings.Add(setting);
        }

        setting.KhqrImageUrl = imageUrl;
        setting.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToResponse(setting);
    }

    // Map entity to response DTO
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
            KhqrImageUrl = setting.KhqrImageUrl,
            CurrencyCode = setting.CurrencyCode,
            OpeningTime = setting.OpeningTime,
            ClosingTime = setting.ClosingTime,
            IsOpen = setting.IsOpen
        };
    }
}
