
namespace TVJROK.Application.Features.Orders.DTOs;

public class OrderStatusHistoryResponseDto
{
    public Guid Id { get; set; }

    public Guid OrderId { get; set; }

    public string Status { get; set; } = string.Empty;

    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; }
}
