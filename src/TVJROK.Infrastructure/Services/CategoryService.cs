
using Microsoft.EntityFrameworkCore;
using TVJROK.Application.Features.Categories.DTOs;
using TVJROK.Application.Features.Categories.Interfaces;
using TVJROK.Domain.Entities;
using TVJROK.Infrastructure.Persistence;

namespace TVJROK.Infrastructure.Services;

public class CategoryService : ICategoryService
{
    private readonly TVJROKDbContext _context;

    public CategoryService(TVJROKDbContext context)
    {
        _context = context;
    }

    public async Task<List<CategoryResponseDto>> GetAllAsync()
    {
        return await _context.Categories
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new CategoryResponseDto
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                ImageUrl = x.ImageUrl,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<CategoryResponseDto?> GetByIdAsync(Guid id)
    {
        return await _context.Categories
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new CategoryResponseDto
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                ImageUrl = x.ImageUrl,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<CategoryResponseDto> CreateAsync(
        CreateCategoryDto dto)
    {
        var category = new Category
        {
            Name = dto.Name.Trim(),
            Description = dto.Description,
            ImageUrl = dto.ImageUrl,
            IsActive = true
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return new CategoryResponseDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            ImageUrl = category.ImageUrl,
            IsActive = category.IsActive,
            CreatedAt = category.CreatedAt
        };
    }

    public async Task<bool> UpdateAsync(
        Guid id,
        UpdateCategoryDto dto)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(x => x.Id == id);

        if (category == null)
            return false;

        category.Name = dto.Name.Trim();
        category.Description = dto.Description;
        category.ImageUrl = dto.ImageUrl;
        category.IsActive = dto.IsActive;
        category.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(x => x.Id == id);

        if (category == null)
            return false;

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        return true;
    }
}
