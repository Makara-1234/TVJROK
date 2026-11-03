using TVJROK.Application.Features.Categories.DTOs;

namespace TVJROK.Application.Features.Categories.Interfaces;

public interface ICategoryService
{
    Task<List<CategoryResponseDto>> GetAllAsync();

    Task<CategoryResponseDto?> GetByIdAsync(Guid id);

    Task<CategoryResponseDto> CreateAsync(CreateCategoryDto dto);

    Task<bool> UpdateAsync(Guid id, UpdateCategoryDto dto);

    Task<bool> DeleteAsync(Guid id);
}