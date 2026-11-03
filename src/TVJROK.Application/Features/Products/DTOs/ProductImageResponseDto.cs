namespace TVJROK.Application.Features.Products.DTOs;

public class ProductImageResponseDto
{
    public Guid Id { get; set; }

    public string ImageUrl { get; set; } = string.Empty;

    public bool IsPrimary { get; set; }
}