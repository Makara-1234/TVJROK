namespace TVJROK.Application.Features.Payments;

public interface IPaymentReceiptService
{
    Task<string> UploadAsync(
        Guid paymentId,
        Stream fileStream,
        string fileName,
        string contentType);
}