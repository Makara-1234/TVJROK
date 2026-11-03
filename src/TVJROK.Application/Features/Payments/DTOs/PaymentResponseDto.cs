using TVJROK.Domain.Enums;

namespace TVJROK.Application.Features.Payments.DTOs;

public class PaymentResponseDto
{
    public Guid Id { get; set; }

    public Guid OrderId { get; set; }

    public string OrderNumber { get; set; } = string.Empty;

    public PaymentMethod PaymentMethod { get; set; }

    public decimal Amount { get; set; }

    public string CurrencyCode { get; set; } = "USD";

    public string? TransactionReference { get; set; }

    public string? ReceiptImageUrl { get; set; }

    public PaymentStatus Status { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? VerifiedAt { get; set; }

    public string? RejectionReason { get; set; }
}