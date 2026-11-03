
namespace TVJROK.Application.Features.Tables.DTOs;

public class TableResponseDto
{
    public Guid Id { get; set; }

    public string TableNumber { get; set; } = string.Empty;

    public int Capacity { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }
}
