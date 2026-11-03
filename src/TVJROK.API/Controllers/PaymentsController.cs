
using Microsoft.AspNetCore.Mvc;
using TVJROK.Application.Features.Payments;
using TVJROK.Application.Features.Payments.DTOs;

namespace TVJROK.API.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly IPaymentReceiptService _receiptService;

    public PaymentsController(
        IPaymentService paymentService,
        IPaymentReceiptService receiptService)
    {
        _paymentService = paymentService;
        _receiptService = receiptService;
    }

    // GET: api/payments
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var payments = await _paymentService.GetAllAsync();
        return Ok(payments);
    }

    // GET: api/payments/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var payment = await _paymentService.GetByIdAsync(id);

        if (payment == null)
            return NotFound(new { message = "Payment not found." });

        return Ok(payment);
    }

    // GET: api/payments/order/{orderId}
    [HttpGet("order/{orderId:guid}")]
    public async Task<IActionResult> GetByOrderId(Guid orderId)
    {
        var payment = await _paymentService.GetByOrderIdAsync(orderId);

        if (payment == null)
            return NotFound(new { message = "Payment not found." });

        return Ok(payment);
    }

    // POST: api/payments
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreatePaymentDto dto)
    {
        try
        {
            var payment = await _paymentService.CreateAsync(dto);

            return CreatedAtAction(
                nameof(GetById),
                new { id = payment.Id },
                payment
            );
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // PUT: api/payments/{id}/verify
    [HttpPut("{id:guid}/verify")]
    public async Task<IActionResult> Verify(
        Guid id,
        [FromBody] VerifyPaymentDto dto)
    {
        try
        {
            var payment = await _paymentService.VerifyAsync(id, dto);

            if (payment == null)
                return NotFound(new { message = "Payment not found." });

            return Ok(payment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // PUT: api/payments/{id}/reject
    [HttpPut("{id:guid}/reject")]
    public async Task<IActionResult> Reject(
        Guid id,
        [FromBody] RejectPaymentDto dto)
    {
        try
        {
            var payment = await _paymentService.RejectAsync(id, dto);

            if (payment == null)
                return NotFound(new { message = "Payment not found." });

            return Ok(payment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // POST: api/payments/{id}/receipt
    [HttpPost("{id:guid}/receipt")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<IActionResult> UploadReceipt(
        Guid id,
        IFormFile? file)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new
                {
                    message = "Please select a receipt image."
                });
            }

            await using var stream = file.OpenReadStream();

            var imageUrl = await _receiptService.UploadAsync(
                id,
                stream,
                file.FileName,
                file.ContentType
            );

            return Ok(new
            {
                message = "Payment receipt uploaded successfully.",
                paymentId = id,
                receiptImageUrl = imageUrl
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
