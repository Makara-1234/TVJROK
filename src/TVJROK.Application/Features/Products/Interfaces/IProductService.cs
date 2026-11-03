
using TVJROK.Application.Features.Products.DTOs;

namespace TVJROK.Application.Features.Products.Interfaces;

public interface IProductService
{
    Task<List<ProductResponseDto>> GetAllAsync();

    Task<ProductResponseDto?> GetByIdAsync(Guid id);

    Task<ProductResponseDto> CreateAsync(CreateProductDto dto);

    Task<bool> UpdateAsync(Guid id, UpdateProductDto dto);

    Task<bool> DeleteAsync(Guid id);

    // Search, Filter and Pagination
    Task<PagedResponseDto<ProductResponseDto>> GetPagedAsync(
        ProductQueryDto query
    );
}
