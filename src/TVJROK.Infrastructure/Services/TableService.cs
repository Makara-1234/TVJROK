
using Microsoft.EntityFrameworkCore;
using TVJROK.Application.Features.Tables.DTOs;
using TVJROK.Application.Features.Tables.Interfaces;
using TVJROK.Domain.Entities;
using TVJROK.Infrastructure.Persistence;
using TVJROK.Domain.Enums;

namespace TVJROK.Infrastructure.Services;

public class TableService : ITableService
{
    private readonly TVJROKDbContext _context;

    public TableService(TVJROKDbContext context)
    {
        _context = context;
    }

    // CREATE TABLE
    public async Task<TableResponseDto> CreateAsync(CreateTableDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.TableNumber))
            throw new InvalidOperationException("Table number is required.");

        if (dto.Capacity <= 0)
            throw new InvalidOperationException("Capacity must be greater than zero.");

        var tableNumber = dto.TableNumber.Trim();

        var exists = await _context.RestaurantTables
            .AnyAsync(x => x.TableNumber == tableNumber);

        if (exists)
            throw new InvalidOperationException("Table number already exists.");

        var table = new RestaurantTable
        {
            TableNumber = tableNumber,
            Capacity = dto.Capacity,
            IsActive = true
        };

        _context.RestaurantTables.Add(table);

        await _context.SaveChangesAsync();

        return MapToDto(table);
    }

    // GET ALL TABLES
    public async Task<List<TableResponseDto>> GetAllAsync()
    {
        var tables = await _context.RestaurantTables
            .AsNoTracking()
            .OrderBy(x => x.TableNumber)
            .ToListAsync();

        return tables.Select(MapToDto).ToList();
    }

    
    // GET TABLE AVAILABILITY
    public async Task<List<TableAvailabilityResponseDto>> GetAvailabilityAsync()
    {
        var tables = await _context.RestaurantTables
            .AsNoTracking()
            .Select(table => new
            {
                Table = table,
                IsOccupied = _context.Orders.Any(order =>
                    order.TableId == table.Id &&
                    (order.Status == OrderStatus.Pending ||
                     order.Status == OrderStatus.Confirm))
            })
            .OrderBy(x => x.Table.TableNumber)
            .ToListAsync();

        return tables.Select(x => new TableAvailabilityResponseDto
        {
            Id = x.Table.Id,
            TableNumber = x.Table.TableNumber,
            Capacity = x.Table.Capacity,
            IsActive = x.Table.IsActive,
            IsAvailable = x.Table.IsActive && !x.IsOccupied,
            Status = !x.Table.IsActive
                ? "Inactive"
                : x.IsOccupied
                    ? "Occupied"
                    : "Available"
        }).ToList();
    }


    // GET TABLE BY ID
    public async Task<TableResponseDto?> GetByIdAsync(Guid id)
    {
        var table = await _context.RestaurantTables
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);

        return table == null ? null : MapToDto(table);
    }

    // UPDATE TABLE
    public async Task<bool> UpdateAsync(Guid id, UpdateTableDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.TableNumber))
            throw new InvalidOperationException("Table number is required.");

        if (dto.Capacity <= 0)
            throw new InvalidOperationException("Capacity must be greater than zero.");

        var table = await _context.RestaurantTables
            .FirstOrDefaultAsync(x => x.Id == id);

        if (table == null)
            return false;

        var tableNumber = dto.TableNumber.Trim();

        var duplicate = await _context.RestaurantTables
            .AnyAsync(x =>
                x.Id != id &&
                x.TableNumber == tableNumber);

        if (duplicate)
            throw new InvalidOperationException("Table number already exists.");

        table.TableNumber = tableNumber;
        table.Capacity = dto.Capacity;
        table.IsActive = dto.IsActive;
        table.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }

    // DEACTIVATE TABLE
    public async Task<bool> DeactivateAsync(Guid id)
    {
        var table = await _context.RestaurantTables
            .FirstOrDefaultAsync(x => x.Id == id);

        if (table == null)
            return false;

        table.IsActive = false;
        table.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }

    // MAP ENTITY TO DTO
    private static TableResponseDto MapToDto(RestaurantTable table)
    {
        return new TableResponseDto
        {
            Id = table.Id,
            TableNumber = table.TableNumber,
            Capacity = table.Capacity,
            IsActive = table.IsActive,
            CreatedAt = table.CreatedAt
        };
    }
}
