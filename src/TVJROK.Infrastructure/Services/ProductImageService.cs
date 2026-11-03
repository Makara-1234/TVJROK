
using Microsoft.EntityFrameworkCore;
using TVJROK.Application.Features.Products.Interfaces;
using TVJROK.Domain.Entities;
using TVJROK.Infrastructure.Persistence;

namespace TVJROK.Infrastructure.Services;

public class ProductImageService : IProductImageService
{
    private readonly TVJROKDbContext _context;
    private readonly SupabaseStorageService _storage;

    public async Task<bool> SetPrimaryAsync(
    Guid productId,
    Guid imageId)
{
    var images = await _context.ProductImages
        .Where(x => x.ProductId == productId)
        .ToListAsync();

    var selectedImage = images
        .FirstOrDefault(x => x.Id == imageId);

    if (selectedImage == null)
        return false;

    foreach (var image in images)
    {
        image.IsPrimary = image.Id == imageId;
    }

    await _context.SaveChangesAsync();

    return true;
}
    public ProductImageService(
        TVJROKDbContext context,
        SupabaseStorageService storage)
    {
        _context = context;
        _storage = storage;
    }

    // Upload Product Image
    public async Task<string> UploadAsync(
        Guid productId,
        Stream fileStream,
        string fileName,
        string contentType)
    {
        // Check Product
        var productExists = await _context.Products
            .AnyAsync(x => x.Id == productId);

        if (!productExists)
        {
            throw new InvalidOperationException(
                "Product not found."
            );
        }

        // Upload image to Supabase
        var imageUrl = await _storage.UploadAsync(
            fileStream,
            fileName,
            contentType
        );

        // Extract Storage Path
        var uri = new Uri(imageUrl);
        var storagePath = uri.AbsolutePath
            .Split("/tvjrok-products/", 2)
            .Last();

        // Check existing images
        var hasImages = await _context.ProductImages
            .AnyAsync(x => x.ProductId == productId);

        // Create Image Record
        var image = new ProductImage
        {
            ProductId = productId,
            ImageUrl = imageUrl,
            StoragePath = storagePath,
            IsPrimary = !hasImages
        };

        _context.ProductImages.Add(image);

        await _context.SaveChangesAsync();

        return imageUrl;
    }

    // Delete Product Image
    public async Task<bool> DeleteAsync(
        Guid productId,
        Guid imageId)
    {
        // Find image belonging to this product
        var image = await _context.ProductImages
            .FirstOrDefaultAsync(x =>
                x.Id == imageId &&
                x.ProductId == productId
            );

        if (image == null)
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(image.StoragePath))
        {
            throw new InvalidOperationException(
                "Product image storage path is missing."
            );
        }

        // Delete image from Supabase Storage
        await _storage.DeleteAsync(image.StoragePath);

        // Remove image from SQL Server
        _context.ProductImages.Remove(image);

        // If deleted image was primary, select another image
        if (image.IsPrimary)
        {
            var nextImage = await _context.ProductImages
                .Where(x => x.ProductId == productId &&
                            x.Id != imageId)
                .OrderBy(x => x.CreatedAt)
                .FirstOrDefaultAsync();

            if (nextImage != null)
            {
                nextImage.IsPrimary = true;
            }
        }

        await _context.SaveChangesAsync();

        return true;
    }
}
