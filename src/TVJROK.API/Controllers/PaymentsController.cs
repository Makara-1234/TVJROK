
using Microsoft.AspNetCore.Authorization;
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

    // =====================================
    // ADMIN: Get All Payments
    // GET: api/payments
    // =====================================

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var payments = await _paymentService.GetAllAsync();

        return Ok(payments);
    }

    // =====================================
    // ADMIN: Get Payment By ID
    // GET: api/payments/{id}
    // =====================================

    [Authorize(Roles = "Admin")]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var payment = await _paymentService.GetByIdAsync(id);

        if (payment == null)
        {
            return NotFound(new
            {
                message = "Payment not found."
            });
        }

        return Ok(payment);
    }

    // =====================================
    // ADMIN: Get Payment By Order ID
    // GET: api/payments/order/{orderId}
    // =====================================

    [Authorize(Roles = "Admin")]
    [HttpGet("order/{orderId:guid}")]
    public async Task<IActionResult> GetByOrderId(Guid orderId)
    {
        var payment = await _paymentService.GetByOrderIdAsync(orderId);

        if (payment == null)
        {
            return NotFound(new
            {
                message = "Payment not found."
            });
        }

        return Ok(payment);
    }

    // =====================================
    // PUBLIC: Customer Create Payment
    // POST: api/payments
    // =====================================

    [AllowAnonymous]
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
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    // =====================================
    // ADMIN: Verify Payment
    // PUT: api/payments/{id}/verify
    // =====================================

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}/verify")]
    public async Task<IActionResult> Verify(
        Guid id,
        [FromBody] VerifyPaymentDto dto)
    {
        try
        {
            var payment = await _paymentService.VerifyAsync(id, dto);

            if (payment == null)
            {
                return NotFound(new
                {
                    message = "Payment not found."
                });
            }

            return Ok(payment);
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
    // ADMIN: Reject Payment
    // PUT: api/payments/{id}/reject
    // =====================================

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}/reject")]
    public async Task<IActionResult> Reject(
        Guid id,
        [FromBody] RejectPaymentDto dto)
    {
        try
        {
            var payment = await _paymentService.RejectAsync(id, dto);

            if (payment == null)
            {
                return NotFound(new
                {
                    message = "Payment not found."
                });
            }

            return Ok(payment);
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
    // PUBLIC: Customer Upload Receipt
    // POST: api/payments/{id}/receipt
    // =====================================

    [AllowAnonymous]
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

            if (file.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new
                {
                    message = "Receipt image must not exceed 5MB."
                });
            }

            var allowedTypes = new[]
            {
                "image/jpeg",
                "image/png",
                "image/webp"
            };

            if (!allowedTypes.Contains(
                file.ContentType.ToLowerInvariant()))
            {
                return BadRequest(new
                {
                    message = "Only JPG, PNG and WEBP images are allowed."
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
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }
}
