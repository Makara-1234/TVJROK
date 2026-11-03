
namespace TVJROK.Application.Features.Orders.DTOs;

public class CreateOrderDto
{
    public Guid? TableId { get; set; }

    public string CustomerName { get; set; } = string.Empty;

    public string CustomerPhone { get; set; } = string.Empty;

    public string? Notes { get; set; }

    public List<CreateOrderItemDto> Items { get; set; } = [];
}
