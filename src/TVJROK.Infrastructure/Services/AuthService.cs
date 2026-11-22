
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using TVJROK.Application.Features.Auth.DTOs;
using TVJROK.Application.Features.Auth.Interfaces;
using TVJROK.Domain.Entities;
using TVJROK.Infrastructure.Persistence;

namespace TVJROK.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly TVJROKDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IPasswordHasher<Admin> _passwordHasher;

    public AuthService(
        TVJROKDbContext context,
        IConfiguration configuration,
        IPasswordHasher<Admin> passwordHasher)
    {
        _context = context;
        _configuration = configuration;
        _passwordHasher = passwordHasher;
    }

    public async Task<LoginResponseDto?> LoginAsync(
        LoginRequestDto request)
    {
        var username = request.Username.Trim();

        var admin = await _context.Admins
            .SingleOrDefaultAsync(x => x.Username == username);

        if (admin == null || !admin.IsActive)
            return null;

        var verificationResult = _passwordHasher.VerifyHashedPassword(
            admin,
            admin.PasswordHash,
            request.Password
        );

        if (verificationResult == PasswordVerificationResult.Failed)
            return null;

        // Upgrade old password hash when required.
        if (verificationResult == PasswordVerificationResult.SuccessRehashNeeded)
        {
            admin.PasswordHash = _passwordHasher.HashPassword(
                admin,
                request.Password
            );

            admin.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        var jwtKey = _configuration["Jwt:Key"];

        if (string.IsNullOrWhiteSpace(jwtKey) ||
            Encoding.UTF8.GetByteCount(jwtKey) < 32)
        {
            throw new InvalidOperationException(
                "JWT signing key must contain at least 32 bytes."
            );
        }

        var issuer = _configuration["Jwt:Issuer"];
        var audience = _configuration["Jwt:Audience"];

        if (string.IsNullOrWhiteSpace(issuer) ||
            string.IsNullOrWhiteSpace(audience))
        {
            throw new InvalidOperationException(
                "JWT Issuer and Audience must be configured."
            );
        }

        var expirationMinutes = _configuration.GetValue<int?>(
            "Jwt:ExpirationMinutes"
        ) ?? 60;

        if (expirationMinutes < 5 || expirationMinutes > 1440)
        {
            throw new InvalidOperationException(
                "JWT expiration must be between 5 and 1440 minutes."
            );
        }

        var now = DateTime.UtcNow;
        var expiresAt = now.AddMinutes(expirationMinutes);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, admin.Id.ToString()),
            new(ClaimTypes.Name, admin.Username),
            new(ClaimTypes.Role, "Admin"),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var signingKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtKey)
        );

        var credentials = new SigningCredentials(
            signingKey,
            SecurityAlgorithms.HmacSha256
        );

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: now,
            expires: expiresAt,
            signingCredentials: credentials
        );

        return new LoginResponseDto
        {
            AccessToken = new JwtSecurityTokenHandler()
                .WriteToken(token),
            TokenType = "Bearer",
            ExpiresAt = expiresAt,
            Username = admin.Username
        };
    }
}
