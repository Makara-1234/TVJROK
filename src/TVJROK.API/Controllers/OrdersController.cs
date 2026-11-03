
using Microsoft.AspNetCore.Mvc;
using TVJROK.Application.Features.Orders.DTOs;
using TVJROK.Application.Features.Orders.Interfaces;

namespace TVJROK.API.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    // GET: api/orders
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var orders = await _orderService.GetAllAsync();
        return Ok(orders);
    }

    // GET: api/orders/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var order = await _orderService.GetByIdAsync(id);

        if (order == null)
            return NotFound(new { message = "Order not found." });

        return Ok(order);
    }

    // GET: api/orders/number/{orderNumber}
    [HttpGet("number/{orderNumber}")]
    public async Task<IActionResult> GetByOrderNumber(string orderNumber)
    {
        var order = await _orderService.GetByOrderNumberAsync(orderNumber);

        if (order == null)
            return NotFound(new { message = "Order not found." });

        return Ok(order);
    }

    // POST: api/orders
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderDto dto)
    {
        try
        {
            var order = await _orderService.CreateAsync(dto);

            return CreatedAtAction(
                nameof(GetById),
                new { id = order.Id },
                order
            );
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    
        // PUT: api/orders/{id}/status
            [HttpPut("{id:guid}/status")]
        public async Task<IActionResult> UpdateStatus(
         Guid id,
            [FromBody] UpdateOrderStatusDto dto)
{
    try
    {
        var result = await _orderService.UpdateStatusAsync(id, dto);

        if (!result)
        {
            return NotFound(new
            {
                message = "Order not found."
            });
        }

        return Ok(new
        {
            message = "Order status updated successfully."
        });
    }
    catch (InvalidOperationException ex)
    {
        return BadRequest(new
        {
            message = ex.Message
        });
    }
}

// GET: api/orders/{id}/history
[HttpGet("{id:guid}/history")]
public async Task<IActionResult> GetOrderStatusHistory(Guid id)
{
    var order = await _orderService.GetByIdAsync(id);

    if (order == null)
        return NotFound(new { message = "Order not found." });

    var history = await _orderService.GetOrderStatusHistoryAsync(id);

    return Ok(history);
}

}
