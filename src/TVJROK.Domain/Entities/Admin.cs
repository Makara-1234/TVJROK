
using TVJROK.Domain.Entities;

namespace TVJROK.Domain.Entities;

public class Admin : BaseEntity
{
    public string Username { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}
