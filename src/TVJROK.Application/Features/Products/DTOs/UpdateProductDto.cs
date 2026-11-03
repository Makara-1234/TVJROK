namespace TVJROK.Application.Features.Products.DTOs;

public class UpdateProductDto
{
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public bool IsAvailable { get; set; }
    public bool IsFeatured { get; set; }
}