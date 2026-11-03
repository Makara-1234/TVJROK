
using TVJROK.Application.Features.Tables.DTOs;

namespace TVJROK.Application.Features.Tables.Interfaces;

public interface ITableService
{
    // Create table
    Task<TableResponseDto> CreateAsync(CreateTableDto dto);

    // Get all tables
    Task<List<TableResponseDto>> GetAllAsync();

    // Get table by ID
    Task<TableResponseDto?> GetByIdAsync(Guid id);

    // Update table
    Task<bool> UpdateAsync(Guid id, UpdateTableDto dto);

    // Deactivate table
    Task<bool> DeactivateAsync(Guid id);

     Task<List<TableAvailabilityResponseDto>> GetAvailabilityAsync();
}
