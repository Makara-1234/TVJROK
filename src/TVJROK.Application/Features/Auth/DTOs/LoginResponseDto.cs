
namespace TVJROK.Application.Features.Auth.DTOs;

public class LoginResponseDto
{
    public string AccessToken { get; set; } = string.Empty;

    public string TokenType { get; set; } = "Bearer";

    public DateTime ExpiresAt { get; set; }

    public string Username { get; set; } = string.Empty;
}
