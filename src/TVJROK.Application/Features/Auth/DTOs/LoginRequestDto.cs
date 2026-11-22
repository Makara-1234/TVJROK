
using System.ComponentModel.DataAnnotations;

namespace TVJROK.Application.Features.Auth.DTOs;

public class LoginRequestDto
{
    [Required]
    [StringLength(100)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [StringLength(200, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;
}
