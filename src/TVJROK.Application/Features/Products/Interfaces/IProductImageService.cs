namespace TVJROK.Application.Features.Products.Interfaces;

public interface IProductImageService
{
    Task<string> UploadAsync(
        Guid productId,
        Stream fileStream,
        string fileName,
        string contentType);

    Task<bool> DeleteAsync(Guid productId, Guid imageId);
    Task<bool> SetPrimaryAsync(Guid productId, Guid imageId);
}