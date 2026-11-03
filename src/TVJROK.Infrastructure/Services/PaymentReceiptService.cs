
using Microsoft.EntityFrameworkCore;
using TVJROK.Application.Features.Payments;
using TVJROK.Infrastructure.Persistence;

namespace TVJROK.Infrastructure.Services;

public class PaymentReceiptService : IPaymentReceiptService
{
    private readonly TVJROKDbContext _context;
    private readonly SupabaseStorageService _storage;

    public PaymentReceiptService(
        TVJROKDbContext context,
        SupabaseStorageService storage)
    {
        _context = context;
        _storage = storage;
    }

    // UPLOAD PAYMENT RECEIPT
    public async Task<string> UploadAsync(
        Guid paymentId,
        Stream fileStream,
        string fileName,
        string contentType)
    {
        // Check Payment
        var payment = await _context.Payments
            .FirstOrDefaultAsync(x => x.Id == paymentId);

        if (payment == null)
            throw new InvalidOperationException("Payment not found.");

        if (payment.Status != TVJROK.Domain.Enums.PaymentStatus.Pending)
            throw new InvalidOperationException(
                "Receipt can only be uploaded for pending payments.");

        // Validate file
        var allowedTypes = new[]
        {
            "image/jpeg",
            "image/png",
            "image/webp"
        };

        if (!allowedTypes.Contains(contentType.ToLowerInvariant()))
            throw new InvalidOperationException(
                "Only JPG, PNG and WEBP images are allowed.");

        if (fileStream.Length == 0)
            throw new InvalidOperationException("File is empty.");

        if (fileStream.Length > 5 * 1024 * 1024)
            throw new InvalidOperationException(
                "Receipt image must not exceed 5 MB.");

        // Upload to Supabase Storage
        var imageUrl = await _storage.UploadAsync(
            fileStream,
            fileName,
            contentType,
            "payment-receipts"
        );

        // Save Receipt URL
        payment.ReceiptImageUrl = imageUrl;
        payment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return imageUrl;
    }
}
