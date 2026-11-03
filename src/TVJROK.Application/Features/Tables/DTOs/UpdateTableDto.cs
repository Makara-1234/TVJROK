
namespace TVJROK.Application.Features.Tables.DTOs;

public class UpdateTableDto
{
    public string TableNumber { get; set; } = string.Empty;

    public int Capacity { get; set; }

    public bool IsActive { get; set; }
}
