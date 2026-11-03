using TVJROK.Domain.Enums;

namespace TVJROK.Domain.Entities;

public class Order : BaseEntity
{
    public string OrderNumber { get; set; } = string.Empty;

    public Guid? TableId { get; set; }

    public string? CustomerName { get; set; }

    public string? CustomerPhone { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    public decimal TotalAmount { get; set; }

    public string CurrencyCode { get; set; } = "KHR";

    public string? Notes { get; set; }

    public RestaurantTable? Table { get; set; }

    public ICollection<OrderItem> Items { get; set; }
        = new List<OrderItem>();
}