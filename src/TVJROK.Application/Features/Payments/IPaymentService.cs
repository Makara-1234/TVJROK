using TVJROK.Application.Features.Payments.DTOs;

namespace TVJROK.Application.Features.Payments;

public interface IPaymentService
{
    Task<PaymentResponseDto> CreateAsync(CreatePaymentDto dto);

    Task<IEnumerable<PaymentResponseDto>> GetAllAsync();

    Task<PaymentResponseDto?> GetByIdAsync(Guid id);

    Task<PaymentResponseDto?> GetByOrderIdAsync(Guid orderId);

    Task<PaymentResponseDto?> VerifyAsync(
        Guid id,
        VerifyPaymentDto dto);

    Task<PaymentResponseDto?> RejectAsync(
        Guid id,
        RejectPaymentDto dto);
}