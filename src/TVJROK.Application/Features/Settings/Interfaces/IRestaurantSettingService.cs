
using TVJROK.Application.Features.Settings.DTOs;

namespace TVJROK.Application.Features.Settings.Interfaces;

public interface IRestaurantSettingService
{
    Task<RestaurantSettingResponseDto> GetAsync();

    Task<RestaurantSettingResponseDto> UpdateAsync(
        UpdateRestaurantSettingDto dto
    );
}
