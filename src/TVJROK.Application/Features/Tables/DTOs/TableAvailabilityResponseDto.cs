
namespace TVJROK.Application.Features.Tables.DTOs;

public class TableAvailabilityResponseDto
{
    public Guid Id { get; set; }

    public string TableNumber { get; set; } = string.Empty;

    public int Capacity { get; set; }

    public bool IsActive { get; set; }

    public bool IsAvailable { get; set; }

    public string Status { get; set; } = string.Empty;
}
