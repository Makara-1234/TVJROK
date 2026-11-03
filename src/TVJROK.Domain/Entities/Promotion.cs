namespace TVJROK.Domain.Entities;

public class Promotion : BaseEntity
{
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? ImageUrl { get; set; }

    public DateTime StartAt { get; set; }

    public DateTime EndAt { get; set; }

    public bool IsActive { get; set; } = true;
}