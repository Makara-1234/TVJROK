
namespace TVJROK.Application.Features.Orders.DTOs;

public class CreateOrderItemDto
{
    public Guid ProductId { get; set; }

    public int Quantity { get; set; }
}
