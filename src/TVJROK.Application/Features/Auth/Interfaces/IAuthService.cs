
using TVJROK.Application.Features.Auth.DTOs;

namespace TVJROK.Application.Features.Auth.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto request);
}
