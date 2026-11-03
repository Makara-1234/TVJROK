
namespace TVJROK.Application.Features.Orders.DTOs;

public class OrderResponseDto
{
    public Guid Id { get; set; }

    public string OrderNumber { get; set; } = string.Empty;

    public Guid? TableId { get; set; }

    public string CustomerName { get; set; } = string.Empty;

    public string CustomerPhone { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public decimal TotalAmount { get; set; }

    public string CurrencyCode { get; set; } = "KHR";

    public string? Notes { get; set; }

    public List<OrderItemResponseDto> Items { get; set; } = [];

    public DateTime CreatedAt { get; set; }
}

public class OrderItemResponseDto
{
    public Guid ProductId { get; set; }

    public string ProductName { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal Subtotal { get; set; }
}
