using TVJROK.Domain.Enums;

namespace TVJROK.Application.Features.Payments.DTOs;

public class CreatePaymentDto
{
    public Guid OrderId { get; set; }

    public PaymentMethod PaymentMethod { get; set; }

    public string? TransactionReference { get; set; }
}