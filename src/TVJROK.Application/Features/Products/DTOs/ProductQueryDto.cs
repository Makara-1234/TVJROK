
namespace TVJROK.Application.Features.Products.DTOs;

public class ProductQueryDto
{
    // Search by product name
    public string? Search { get; set; }

    // Filter by category
    public Guid? CategoryId { get; set; }

    // Filter available products
    public bool? IsAvailable { get; set; }

    // Filter featured products
    public bool? IsFeatured { get; set; }

    // Pagination
    public int Page { get; set; } = 1;

    public int PageSize { get; set; } = 10;
}
