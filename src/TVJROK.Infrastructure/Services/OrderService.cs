
using Microsoft.EntityFrameworkCore;
using TVJROK.Application.Features.Orders.DTOs;
using TVJROK.Application.Features.Orders.Interfaces;
using TVJROK.Domain.Entities;
using TVJROK.Domain.Enums;
using TVJROK.Infrastructure.Persistence;

namespace TVJROK.Infrastructure.Services;

public class OrderService : IOrderService
{
    private readonly TVJROKDbContext _context;

    public OrderService(TVJROKDbContext context)
    {
        _context = context;
    }

    // CREATE ORDER
    public async Task<OrderResponseDto> CreateAsync(CreateOrderDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CustomerName))
            throw new InvalidOperationException("Customer name is required.");

        if (string.IsNullOrWhiteSpace(dto.CustomerPhone))
            throw new InvalidOperationException("Customer phone is required.");

        if (dto.Items == null || dto.Items.Count == 0)
            throw new InvalidOperationException("Order must contain at least one item.");

        if (dto.Items.Any(x => x.Quantity <= 0))
            throw new InvalidOperationException("Quantity must be greater than zero.");

        // Check duplicate products
        if (dto.Items.GroupBy(x => x.ProductId).Any(g => g.Count() > 1))
            throw new InvalidOperationException("Duplicate products are not allowed.");

        // Check restaurant table
        if (dto.TableId.HasValue)
        {
            var tableExists = await _context.RestaurantTables
                .AnyAsync(x =>
                    x.Id == dto.TableId.Value &&
                    x.IsActive);

            if (!tableExists)
                throw new InvalidOperationException("Active restaurant table not found.");
        }

        // Get products from database
        var productIds = dto.Items.Select(x => x.ProductId).ToList();

        var products = await _context.Products
            .Where(x => productIds.Contains(x.Id))
            .ToListAsync();

        if (products.Count != productIds.Count)
            throw new InvalidOperationException("One or more products were not found.");

        // Check product availability
        foreach (var product in products)
        {
            if (!product.IsAvailable)
            {
                throw new InvalidOperationException(
                    $"Product '{product.Name}' is currently unavailable.");
            }
        }

        // Generate order number
        var orderNumber =
            $"TJR-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";

        // Create order
        var order = new Order
        {
            OrderNumber = orderNumber,
            TableId = dto.TableId,
            CustomerName = dto.CustomerName.Trim(),
            CustomerPhone = dto.CustomerPhone.Trim(),
            Status = OrderStatus.Pending,
            CurrencyCode = "KHR",
            Notes = dto.Notes,
            TotalAmount = 0
        };

        // Create order items and calculate total
        foreach (var item in dto.Items)
        {
            var product = products.First(x => x.Id == item.ProductId);

            var subtotal = product.Price * item.Quantity;

            var orderItem = new OrderItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                Quantity = item.Quantity,
                UnitPrice = product.Price,
                Subtotal = subtotal
            };

            order.Items.Add(orderItem);
            order.TotalAmount += subtotal;
        }

        // Add initial order status history
        var initialHistory = new OrderStatusHistory
        {
            OrderId = order.Id,
            Status = OrderStatus.Pending,
            Note = "Order created"
        };

        _context.OrderStatusHistories.Add(initialHistory);

        // Save order and history together
        _context.Orders.Add(order);

        await _context.SaveChangesAsync();

        // Return created order
        return (await GetByIdAsync(order.Id))!;
    }

    // UPDATE ORDER STATUS
    public async Task<bool> UpdateStatusAsync(
        Guid id,
        UpdateOrderStatusDto dto)
    {
        // Validate enum value
        if (!Enum.IsDefined(typeof(OrderStatus), dto.Status))
        {
            throw new InvalidOperationException("Invalid order status.");
        }

        // Find order
        var order = await _context.Orders
            .FirstOrDefaultAsync(x => x.Id == id);

        if (order == null)
            return false;

        // Define allowed status transitions
        
// Define allowed status transitions
var allowedTransitions = new Dictionary<OrderStatus, OrderStatus[]>
{
    {
        OrderStatus.Pending,
        new[] { OrderStatus.Confirm, OrderStatus.Cancel }
    },
    {
        OrderStatus.Confirm,
        new[] { OrderStatus.Preparing, OrderStatus.Cancel }
    },
    {
        OrderStatus.Preparing,
        new[] { OrderStatus.Complete, OrderStatus.Cancel }
    },
    {
        OrderStatus.Complete,
        Array.Empty<OrderStatus>()
    },
    {
        OrderStatus.Cancel,
        Array.Empty<OrderStatus>()
    }
};


        // Check status transition
        if (!allowedTransitions.TryGetValue(order.Status, out var nextStatuses) ||
            !nextStatuses.Contains(dto.Status))
        {
            throw new InvalidOperationException(
                $"Cannot change order status from {order.Status} to {dto.Status}.");
        }

        // Update order
        order.Status = dto.Status;
        order.UpdatedAt = DateTime.UtcNow;

        // Create status history
        var history = new OrderStatusHistory
        {
            OrderId = order.Id,
            Status = dto.Status,
            Note = dto.Note?.Trim()
        };

        _context.OrderStatusHistories.Add(history);

        await _context.SaveChangesAsync();

        return true;
    }

    // GET ALL ORDERS
    public async Task<List<OrderResponseDto>> GetAllAsync()
    {
        var orders = await _context.Orders
            .AsNoTracking()
            .Include(x => x.Items)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return orders.Select(MapToDto).ToList();
    }

    // GET ORDER BY ID
    public async Task<OrderResponseDto?> GetByIdAsync(Guid id)
    {
        var order = await _context.Orders
            .AsNoTracking()
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id);

        return order == null ? null : MapToDto(order);
    }

    // GET ORDER BY ORDER NUMBER
    public async Task<OrderResponseDto?> GetByOrderNumberAsync(string orderNumber)
    {
        var order = await _context.Orders
            .AsNoTracking()
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.OrderNumber == orderNumber);

        return order == null ? null : MapToDto(order);
    }

    // GET ORDER STATUS HISTORY
    public async Task<List<OrderStatusHistoryResponseDto>>
        GetOrderStatusHistoryAsync(Guid orderId)
    {
        return await _context.OrderStatusHistories
            .AsNoTracking()
            .Where(x => x.OrderId == orderId)
            .OrderBy(x => x.CreatedAt)
            .Select(x => new OrderStatusHistoryResponseDto
            {
                Id = x.Id,
                OrderId = x.OrderId,
                Status = x.Status.ToString(),
                Note = x.Note,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();
    }

    // MAP ENTITY TO DTO
    private static OrderResponseDto MapToDto(Order order)
    {
        return new OrderResponseDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            TableId = order.TableId,
            CustomerName = order.CustomerName ?? string.Empty,
            CustomerPhone = order.CustomerPhone ?? string.Empty,
            Status = order.Status.ToString(),
            TotalAmount = order.TotalAmount,
            CurrencyCode = order.CurrencyCode,
            Notes = order.Notes,

            Items = order.Items.Select(item => new OrderItemResponseDto
            {
                ProductId = item.ProductId,
                ProductName = item.ProductName,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Subtotal = item.Subtotal
            }).ToList(),

            CreatedAt = order.CreatedAt
        };
    }
}
