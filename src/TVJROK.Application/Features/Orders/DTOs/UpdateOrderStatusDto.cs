
using TVJROK.Domain.Enums;

namespace TVJROK.Application.Features.Orders.DTOs;

public class UpdateOrderStatusDto
{
    public OrderStatus Status { get; set; }

    public string? Note { get; set; }
}
