
using TVJROK.Application.Features.Orders.DTOs;

namespace TVJROK.Application.Features.Orders.Interfaces;

public interface IOrderService
{
    // Create new order
    Task<OrderResponseDto> CreateAsync(CreateOrderDto dto);

    // Get all orders
    Task<List<OrderResponseDto>> GetAllAsync();

    // Get order by ID
    Task<OrderResponseDto?> GetByIdAsync(Guid id);

    // Get order by order number
    Task<OrderResponseDto?> GetByOrderNumberAsync(string orderNumber);

    // Update order status
    Task<bool> UpdateStatusAsync(Guid id,UpdateOrderStatusDto dto);

    // Get order status history
    Task<List<OrderStatusHistoryResponseDto>> GetOrderStatusHistoryAsync(
    Guid orderId
);
}
