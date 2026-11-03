namespace TVJROK.Domain.Entities;

public class Product : BaseEntity
{
    public Guid CategoryId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public decimal Price { get; set; }

    public bool IsAvailable { get; set; } = true;

    public bool IsFeatured { get; set; } = false;

    public Category Category { get; set; } = null!;

    public ICollection<ProductImage> Images { get; set; }
        = new List<ProductImage>();
}