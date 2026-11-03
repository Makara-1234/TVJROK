
using Microsoft.EntityFrameworkCore;
using TVJROK.Application.Features.Products.DTOs;
using TVJROK.Application.Features.Products.Interfaces;
using TVJROK.Domain.Entities;
using TVJROK.Infrastructure.Persistence;

namespace TVJROK.Infrastructure.Services;

public class ProductService : IProductService
{
    private readonly TVJROKDbContext _context;

    public ProductService(TVJROKDbContext context)
    {
        _context = context;
    }

    // GET: All Products
    public async Task<List<ProductResponseDto>> GetAllAsync()
    {
        return await _context.Products
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new ProductResponseDto
            {
                Id = x.Id,
                CategoryId = x.CategoryId,
                CategoryName = x.Category.Name,
                Name = x.Name,
                Description = x.Description,
                Price = x.Price,
                IsAvailable = x.IsAvailable,
                IsFeatured = x.IsFeatured,

                Images = x.Images
                    .OrderByDescending(i => i.IsPrimary)
                    .ThenBy(i => i.CreatedAt)
                    .Select(i => new ProductImageResponseDto
                    {
                        Id = i.Id,
                        ImageUrl = i.ImageUrl,
                        IsPrimary = i.IsPrimary
                    })
                    .ToList(),

                CreatedAt = x.CreatedAt
            })
            .ToListAsync();
    }

    // GET: Product By ID
    public async Task<ProductResponseDto?> GetByIdAsync(Guid id)
    {
        return await _context.Products
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new ProductResponseDto
            {
                Id = x.Id,
                CategoryId = x.CategoryId,
                CategoryName = x.Category.Name,
                Name = x.Name,
                Description = x.Description,
                Price = x.Price,
                IsAvailable = x.IsAvailable,
                IsFeatured = x.IsFeatured,

                Images = x.Images
                    .OrderByDescending(i => i.IsPrimary)
                    .ThenBy(i => i.CreatedAt)
                    .Select(i => new ProductImageResponseDto
                    {
                        Id = i.Id,
                        ImageUrl = i.ImageUrl,
                        IsPrimary = i.IsPrimary
                    })
                    .ToList(),

                CreatedAt = x.CreatedAt
            })
            .FirstOrDefaultAsync();
    }

    // POST: Create Product
    public async Task<ProductResponseDto> CreateAsync(CreateProductDto dto)
    {
        var categoryExists = await _context.Categories
            .AnyAsync(x => x.Id == dto.CategoryId && x.IsActive);

        if (!categoryExists)
            throw new InvalidOperationException("Active category not found.");

        var product = new Product
        {
            CategoryId = dto.CategoryId,
            Name = dto.Name.Trim(),
            Description = dto.Description,
            Price = dto.Price,
            IsAvailable = dto.IsAvailable,
            IsFeatured = dto.IsFeatured
        };

        _context.Products.Add(product);

        await _context.SaveChangesAsync();

        return (await GetByIdAsync(product.Id))!;
    }

    // PUT: Update Product
    public async Task<bool> UpdateAsync(Guid id, UpdateProductDto dto)
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(x => x.Id == id);

        if (product == null)
            return false;

        var categoryExists = await _context.Categories
            .AnyAsync(x => x.Id == dto.CategoryId && x.IsActive);

        if (!categoryExists)
            throw new InvalidOperationException("Active category not found.");

        product.CategoryId = dto.CategoryId;
        product.Name = dto.Name.Trim();
        product.Description = dto.Description;
        product.Price = dto.Price;
        product.IsAvailable = dto.IsAvailable;
        product.IsFeatured = dto.IsFeatured;
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }

    // DELETE: Product
    public async Task<bool> DeleteAsync(Guid id)
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(x => x.Id == id);

        if (product == null)
            return false;

        _context.Products.Remove(product);

        await _context.SaveChangesAsync();

        return true;
    }

    
public async Task<PagedResponseDto<ProductResponseDto>> GetPagedAsync(
    ProductQueryDto query)
{
    // Normalize pagination values
    var page = query.Page < 1 ? 1 : query.Page;
    var pageSize = query.PageSize < 1 ? 10 : query.PageSize;

    // Maximum 100 products per page
    pageSize = Math.Min(pageSize, 100);

    // Base query
    var products = _context.Products
        .AsNoTracking()
        .AsQueryable();

    // Search by product name
    if (!string.IsNullOrWhiteSpace(query.Search))
    {
        var search = query.Search.Trim();

        products = products.Where(x =>
            x.Name.Contains(search));
    }

    // Filter by category
    if (query.CategoryId.HasValue)
    {
        products = products.Where(x =>
            x.CategoryId == query.CategoryId.Value);
    }

    // Filter by availability
    if (query.IsAvailable.HasValue)
    {
        products = products.Where(x =>
            x.IsAvailable == query.IsAvailable.Value);
    }

    // Filter featured products
    if (query.IsFeatured.HasValue)
    {
        products = products.Where(x =>
            x.IsFeatured == query.IsFeatured.Value);
    }

    // Count total products after filtering
    var totalItems = await products.CountAsync();

    // Calculate total pages
    var totalPages = (int)Math.Ceiling(
        totalItems / (double)pageSize);

    // Get paginated products
    var items = await products
        .OrderBy(x => x.Name)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(x => new ProductResponseDto
        {
            Id = x.Id,
            CategoryId = x.CategoryId,
            CategoryName = x.Category.Name,
            Name = x.Name,
            Description = x.Description,
            Price = x.Price,
            IsAvailable = x.IsAvailable,
            IsFeatured = x.IsFeatured,

            Images = x.Images
                .OrderByDescending(i => i.IsPrimary)
                .ThenBy(i => i.CreatedAt)
                .Select(i => new ProductImageResponseDto
                {
                    Id = i.Id,
                    ImageUrl = i.ImageUrl,
                    IsPrimary = i.IsPrimary
                })
                .ToList(),

            CreatedAt = x.CreatedAt
        })
        .ToListAsync();

    return new PagedResponseDto<ProductResponseDto>
    {
        Items = items,
        Page = page,
        PageSize = pageSize,
        TotalItems = totalItems,
        TotalPages = totalPages
    };
}

}
