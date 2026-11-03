namespace TVJROK.Domain.Entities;

public class ProductImage : BaseEntity
{
    public Guid ProductId { get; set; }

    public string ImageUrl { get; set; } = string.Empty;

    public string? StoragePath { get; set; }

    public bool IsPrimary { get; set; } = false;

    public Product Product { get; set; } = null!;
}