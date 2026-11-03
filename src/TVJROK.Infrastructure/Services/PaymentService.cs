
using Microsoft.EntityFrameworkCore;
using TVJROK.Application.Features.Payments;
using TVJROK.Application.Features.Payments.DTOs;
using TVJROK.Domain.Entities;
using TVJROK.Domain.Enums;
using TVJROK.Infrastructure.Persistence;

namespace TVJROK.Infrastructure.Services;

public class PaymentService : IPaymentService
{
    private readonly TVJROKDbContext _context;

    public PaymentService(TVJROKDbContext context)
    {
        _context = context;
    }

    // CREATE PAYMENT
    public async Task<PaymentResponseDto> CreateAsync(
        CreatePaymentDto dto)
    {
        if (!Enum.IsDefined(typeof(PaymentMethod), dto.PaymentMethod))
            throw new InvalidOperationException("Invalid payment method.");

        var order = await _context.Orders
            .FirstOrDefaultAsync(x => x.Id == dto.OrderId);

        if (order == null)
            throw new InvalidOperationException("Order not found.");

        if (order.Status == OrderStatus.Cancel ||
            order.Status == OrderStatus.Complete)
        {
            throw new InvalidOperationException(
                "Payment cannot be created for this order status.");
        }

        // Prevent duplicate pending or verified payments
        var existingPayment = await _context.Payments
            .AnyAsync(x =>
                x.OrderId == dto.OrderId &&
                (x.Status == PaymentStatus.Pending ||
                 x.Status == PaymentStatus.Verified));

        if (existingPayment)
            throw new InvalidOperationException(
                "This order already has a pending or verified payment.");

        var payment = new Payment
        {
            OrderId = order.Id,
            PaymentMethod = dto.PaymentMethod,
            Amount = order.TotalAmount,
            CurrencyCode = order.CurrencyCode,
            TransactionReference = dto.TransactionReference?.Trim(),
            Status = PaymentStatus.Pending
        };

        _context.Payments.Add(payment);

        await _context.SaveChangesAsync();

        return (await GetByIdAsync(payment.Id))!;
    }

    // GET ALL PAYMENTS
    public async Task<IEnumerable<PaymentResponseDto>> GetAllAsync()
    {
        var payments = await _context.Payments
            .AsNoTracking()
            .Include(x => x.Order)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return payments.Select(MapToDto).ToList();
    }

    // GET PAYMENT BY ID
    public async Task<PaymentResponseDto?> GetByIdAsync(Guid id)
    {
        var payment = await _context.Payments
            .AsNoTracking()
            .Include(x => x.Order)
            .FirstOrDefaultAsync(x => x.Id == id);

        return payment == null ? null : MapToDto(payment);
    }

    // GET PAYMENT BY ORDER ID
    public async Task<PaymentResponseDto?> GetByOrderIdAsync(
        Guid orderId)
    {
        var payment = await _context.Payments
            .AsNoTracking()
            .Include(x => x.Order)
            .Where(x => x.OrderId == orderId)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync();

        return payment == null ? null : MapToDto(payment);
    }

    // VERIFY PAYMENT
public async Task<PaymentResponseDto?> VerifyAsync(
    Guid id,
    VerifyPaymentDto dto)
{
    await using var transaction =
        await _context.Database.BeginTransactionAsync();

    var payment = await _context.Payments
        .Include(x => x.Order)
        .FirstOrDefaultAsync(x => x.Id == id);

    if (payment == null)
        return null;

    if (payment.Status != PaymentStatus.Pending)
        throw new InvalidOperationException(
            "Only pending payments can be verified.");

    var order = payment.Order;

    if (order.Status != OrderStatus.Pending)
        throw new InvalidOperationException(
            "Only pending orders can be confirmed by payment verification.");

    var now = DateTime.UtcNow;

    // 1. Update Payment
    payment.Status = PaymentStatus.Verified;
    payment.VerifiedAt = now;
    payment.UpdatedAt = now;
    payment.RejectionReason = null;

    // 2. Update Order
    order.Status = OrderStatus.Confirm;
    order.UpdatedAt = now;

    // 3. Create Order Status History
    var history = new OrderStatusHistory
    {
        OrderId = order.Id,
        Status = OrderStatus.Confirm,
        Note = "Order automatically confirmed after payment verification.",
        ChangedByUserId = null
    };

    _context.OrderStatusHistories.Add(history);

    // 4. Save all changes
    await _context.SaveChangesAsync();

    await transaction.CommitAsync();

    return MapToDto(payment);
}

    // REJECT PAYMENT
    public async Task<PaymentResponseDto?> RejectAsync(
        Guid id,
        RejectPaymentDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Reason))
            throw new InvalidOperationException(
                "Rejection reason is required.");

        var payment = await _context.Payments
            .Include(x => x.Order)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (payment == null)
            return null;

        if (payment.Status != PaymentStatus.Pending)
            throw new InvalidOperationException(
                "Only pending payments can be rejected.");

        payment.Status = PaymentStatus.Rejected;
        payment.RejectionReason = dto.Reason.Trim();
        payment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(payment);
    }

    // MAP ENTITY TO DTO
    private static PaymentResponseDto MapToDto(Payment payment)
    {
        return new PaymentResponseDto
        {
            Id = payment.Id,
            OrderId = payment.OrderId,
            OrderNumber = payment.Order.OrderNumber,
            PaymentMethod = payment.PaymentMethod,
            Amount = payment.Amount,
            CurrencyCode = payment.CurrencyCode,
            TransactionReference = payment.TransactionReference,
            ReceiptImageUrl = payment.ReceiptImageUrl,
            RejectionReason = payment.RejectionReason,
            Status = payment.Status,
            CreatedAt = payment.CreatedAt,
            VerifiedAt = payment.VerifiedAt
        };
    }
}
