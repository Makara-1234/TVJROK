
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TVJROK.Domain.Entities;
using TVJROK.Infrastructure.Persistence;

namespace TVJROK.API.Services;

public static class AdminSeeder
{
    public static async Task SeedAsync(
        IServiceProvider services,
        IConfiguration configuration)
    {
        var username = configuration["BootstrapAdmin:Username"];
        var password = configuration["BootstrapAdmin:Password"];

        // Skip when bootstrap credentials are not configured.
        if (string.IsNullOrWhiteSpace(username) &&
            string.IsNullOrWhiteSpace(password))
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(username) ||
            string.IsNullOrWhiteSpace(password))
        {
            throw new InvalidOperationException(
                "Both BootstrapAdmin Username and Password must be configured."
            );
        }

        username = username.Trim();

        if (password.Length < 12)
        {
            throw new InvalidOperationException(
                "Bootstrap admin password must contain at least 12 characters."
            );
        }

        using var scope = services.CreateScope();

        var context = scope.ServiceProvider
            .GetRequiredService<TVJROKDbContext>();

        var passwordHasher = scope.ServiceProvider
            .GetRequiredService<IPasswordHasher<Admin>>();

        // Do not create another admin if one already exists.
        if (await context.Admins.AnyAsync())
        {
            return;
        }

        var admin = new Admin
        {
            Username = username,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        admin.PasswordHash = passwordHasher.HashPassword(
            admin,
            password
        );

        context.Admins.Add(admin);

        await context.SaveChangesAsync();
    }
}
