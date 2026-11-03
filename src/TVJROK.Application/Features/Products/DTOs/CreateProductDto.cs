namespace TVJROK.Application.Features.Products.DTOs;

public class CreateProductDto
{
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public bool IsAvailable { get; set; } = true;
    public bool IsFeatured { get; set; } = false;
}