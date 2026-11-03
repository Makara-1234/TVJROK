
namespace TVJROK.Application.Features.Tables.DTOs;

public class CreateTableDto
{
    public string TableNumber { get; set; } = string.Empty;

    public int Capacity { get; set; }
}
