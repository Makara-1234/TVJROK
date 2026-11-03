using TVJROK.Domain.Enums;

namespace TVJROK.Domain.Entities;

public class OrderStatusHistory : BaseEntity
{
    public Guid OrderId { get; set; }

    public OrderStatus Status { get; set; }

    public string? Note { get; set; }

    public Guid? ChangedByUserId { get; set; }

    public Order Order { get; set; } = null!;
}