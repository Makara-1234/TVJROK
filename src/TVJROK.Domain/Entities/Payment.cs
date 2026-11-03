
using TVJROK.Domain.Enums;

namespace TVJROK.Domain.Entities;

public class Payment : BaseEntity
{
    public Guid OrderId { get; set; }

    public PaymentMethod PaymentMethod { get; set; }

    public decimal Amount { get; set; }

    public string CurrencyCode { get; set; } = "USD";

    public string? TransactionReference { get; set; }

    public string? ReceiptImageUrl { get; set; }

    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    public DateTime? VerifiedAt { get; set; }

    // Navigation Property
    public Order Order { get; set; } = null!;

    public string? RejectionReason { get; set; }
}
