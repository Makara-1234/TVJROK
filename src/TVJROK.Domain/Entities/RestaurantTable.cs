namespace TVJROK.Domain.Entities;

public class RestaurantTable : BaseEntity
{
    public string TableNumber { get; set; } = string.Empty;

    public int Capacity { get; set; } = 4;

    public bool IsActive { get; set; } = true;

    public ICollection<Order> Orders { get; set; }
        = new List<Order>();
}