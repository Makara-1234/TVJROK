
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TVJROK.Application.Features.Auth.DTOs;
using TVJROK.Application.Features.Auth.Interfaces;

namespace TVJROK.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequestDto request)
    {
        var result = await _authService.LoginAsync(request);

        if (result == null)
        {
            return Unauthorized(new
            {
                message = "Invalid username or password."
            });
        }

        return Ok(result);
    }
}
