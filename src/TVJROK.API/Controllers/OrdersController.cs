
using Microsoft.AspNetCore.Authorization;
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

    // =====================================
    // ADMIN: Get All Orders
    // GET: api/orders
    // =====================================

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var orders = await _orderService.GetAllAsync();

        return Ok(orders);
    }

    // =====================================
    // ADMIN: Get Order By ID
    // GET: api/orders/{id}
    // =====================================

    [Authorize(Roles = "Admin")]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var order = await _orderService.GetByIdAsync(id);

        if (order == null)
        {
            return NotFound(new
            {
                message = "Order not found."
            });
        }

        return Ok(order);
    }

    // =====================================
    // PUBLIC: Track Order By Order Number
    // GET: api/orders/number/{orderNumber}
    // =====================================

    [AllowAnonymous]
    [HttpGet("number/{orderNumber}")]
    public async Task<IActionResult> GetByOrderNumber(
        string orderNumber)
    {
        if (string.IsNullOrWhiteSpace(orderNumber))
        {
            return BadRequest(new
            {
                message = "Order number is required."
            });
        }

        var order = await _orderService
            .GetByOrderNumberAsync(orderNumber);

        if (order == null)
        {
            return NotFound(new
            {
                message = "Order not found."
            });
        }

        return Ok(order);
    }

    // =====================================
    // PUBLIC: Customer Create Order
    // POST: api/orders
    // =====================================

    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateOrderDto dto)
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
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    // =====================================
    // ADMIN: Update Order Status
    // PUT: api/orders/{id}/status
    // =====================================

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] UpdateOrderStatusDto dto)
    {
        try
        {
            var result = await _orderService
                .UpdateStatusAsync(id, dto);

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

    // =====================================
    // ADMIN: Get Order Status History
    // GET: api/orders/{id}/history
    // =====================================

    [Authorize(Roles = "Admin")]
    [HttpGet("{id:guid}/history")]
    public async Task<IActionResult> GetOrderStatusHistory(Guid id)
    {
        var order = await _orderService.GetByIdAsync(id);

        if (order == null)
        {
            return NotFound(new
            {
                message = "Order not found."
            });
        }

        var history = await _orderService
            .GetOrderStatusHistoryAsync(id);

        return Ok(history);
    }
}
