
namespace TVJROK.Domain.Entities;

public class RestaurantSetting : BaseEntity
{
    public string RestaurantName { get; set; } = "TV JROK";

    public string PhoneNumber { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string? LogoUrl { get; set; }

    public string CurrencyCode { get; set; } = "USD";

    public string OpeningTime { get; set; } = "08:00";

    public string ClosingTime { get; set; } = "22:00";

    public bool IsOpen { get; set; } = true;
}
