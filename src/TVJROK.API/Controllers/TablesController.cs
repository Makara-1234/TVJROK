
using Microsoft.AspNetCore.Mvc;
using TVJROK.Application.Features.Tables.DTOs;
using TVJROK.Application.Features.Tables.Interfaces;

namespace TVJROK.API.Controllers;

[ApiController]
[Route("api/tables")]
public class TablesController : ControllerBase
{
    private readonly ITableService _tableService;

    public TablesController(ITableService tableService)
    {
        _tableService = tableService;
    }

    // GET: api/tables
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tables = await _tableService.GetAllAsync();
        return Ok(tables);
    }

    // GET: api/tables/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var table = await _tableService.GetByIdAsync(id);

        if (table == null)
            return NotFound(new { message = "Table not found." });

        return Ok(table);
    }

    // POST: api/tables
    [HttpPost]
    public async Task<IActionResult> Create(CreateTableDto dto)
    {
        try
        {
            var table = await _tableService.CreateAsync(dto);

            return CreatedAtAction(
                nameof(GetById),
                new { id = table.Id },
                table
            );
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // PUT: api/tables/{id}
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateTableDto dto)
    {
        try
        {
            var updated = await _tableService.UpdateAsync(id, dto);

            if (!updated)
                return NotFound(new { message = "Table not found." });

            return Ok(new { message = "Table updated successfully." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // DELETE: api/tables/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var deactivated = await _tableService.DeactivateAsync(id);

        if (!deactivated)
            return NotFound(new { message = "Table not found." });

        return Ok(new { message = "Table deactivated successfully." });
    }

    
    // GET: api/tables/availability
    [HttpGet("availability")]
    public async Task<IActionResult> GetAvailability()
    {
        var tables = await _tableService.GetAvailabilityAsync();

        return Ok(tables);
    }

}
