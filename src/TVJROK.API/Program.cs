
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

using Npgsql;

using TVJROK.API.Services;
using TVJROK.API.Swagger;

using TVJROK.Domain.Entities;
using TVJROK.Infrastructure.Persistence;
using TVJROK.Infrastructure.Services;

using TVJROK.Application.Features.Auth.Interfaces;
using TVJROK.Application.Features.Categories.Interfaces;
using TVJROK.Application.Features.Products.Interfaces;
using TVJROK.Application.Features.Orders.Interfaces;
using TVJROK.Application.Features.Tables.Interfaces;
using TVJROK.Application.Features.Payments;
using TVJROK.Application.Features.Settings.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// =====================================
// JWT Configuration
// =====================================

var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

if (string.IsNullOrWhiteSpace(jwtKey) ||
    Encoding.UTF8.GetByteCount(jwtKey) < 32)
{
    throw new InvalidOperationException(
        "JWT Key must be configured and contain at least 32 bytes."
    );
}

if (string.IsNullOrWhiteSpace(jwtIssuer) ||
    string.IsNullOrWhiteSpace(jwtAudience))
{
    throw new InvalidOperationException(
        "JWT Issuer and Audience must be configured."
    );
}

var jwtSigningKey = new SymmetricSecurityKey(
    Encoding.UTF8.GetBytes(jwtKey)
);

// =====================================
// Database Configuration
// =====================================

var connectionString = builder.Configuration
    .GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Database connection string 'DefaultConnection' was not found."
    );
}

builder.Services.AddDbContext<TVJROKDbContext>(options =>
{
    if (builder.Environment.IsProduction())
    {
        if (Uri.TryCreate(
            connectionString,
            UriKind.Absolute,
            out var uri) &&
            (uri.Scheme == "postgres" ||
             uri.Scheme == "postgresql"))
        {
            var userInfo = uri.UserInfo.Split(':', 2);

            var dbName = Uri.UnescapeDataString(
                uri.AbsolutePath.TrimStart('/')
            );

            var npgsqlBuilder = new NpgsqlConnectionStringBuilder
            {
                Host = uri.Host,
                Port = uri.Port > 0 ? uri.Port : 5432,
                Database = dbName,
                Username = Uri.UnescapeDataString(userInfo[0]),
                Password = userInfo.Length > 1
                    ? Uri.UnescapeDataString(userInfo[1])
                    : "",
                SslMode = SslMode.Prefer
            };

            connectionString = npgsqlBuilder.ConnectionString;
        }

        options.UseNpgsql(
            connectionString,
            npgsqlOptions =>
                npgsqlOptions.MigrationsAssembly(
                    "TVJROK.Migrations.Postgres"
                )
        );
    }
    else
    {
        options.UseSqlServer(
            connectionString,
            sqlOptions =>
                sqlOptions.MigrationsAssembly(
                    "TVJROK.Infrastructure"
                )
        );
    }
});

// =====================================
// Authentication
// =====================================

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwtIssuer,

                ValidateAudience = true,
                ValidAudience = jwtAudience,

                ValidateIssuerSigningKey = true,
                IssuerSigningKey = jwtSigningKey,

                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromSeconds(30),

                NameClaimType = ClaimTypes.Name,
                RoleClaimType = ClaimTypes.Role
            };
    });

// =====================================
// Authorization
// =====================================

builder.Services.AddAuthorization(options =>
{
    // Protect endpoints by default.
    // Public endpoints must explicitly use [AllowAnonymous].
    options.FallbackPolicy =
        new AuthorizationPolicyBuilder()
            .RequireAuthenticatedUser()
            .Build();
});

// =====================================
// Controllers
// =====================================

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter()
        );
    });

// =====================================
// Swagger + JWT Bearer
// =====================================

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "TVJROK.API",
        Version = "v1"
    });

    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Enter your JWT Bearer token."
        }
    );

    // Add lock icon only to endpoints with [Authorize].
    options.OperationFilter<AuthorizeOperationFilter>();
});

// =====================================
// Admin Authentication Services
// =====================================

builder.Services.AddScoped<
    IPasswordHasher<Admin>,
    PasswordHasher<Admin>>();

builder.Services.AddScoped<IAuthService, AuthService>();

// =====================================
// Application Services
// =====================================

builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IProductImageService, ProductImageService>();

builder.Services.AddScoped<
    IRestaurantSettingService,
    RestaurantSettingService>();

builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IPaymentReceiptService, PaymentReceiptService>();

builder.Services.AddScoped<ITableService, TableService>();
builder.Services.AddScoped<IOrderService, OrderService>();

// =====================================
// Supabase Storage
// =====================================

builder.Services.AddHttpClient<SupabaseStorageService>();

// =====================================
// CORS
// =====================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactFrontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "https://frontend-one-gold-67.vercel.app"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// =====================================
// Build Application
// =====================================

var app = builder.Build();

// =====================================
// Swagger
// =====================================

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

// =====================================
// CORS
// =====================================

app.UseCors("ReactFrontend");

// =====================================
// Authentication & Authorization
// =====================================

app.UseAuthentication();
app.UseAuthorization();

// =====================================
// Map Controllers
// =====================================

app.MapControllers();

// =====================================
// Bootstrap First Admin
// =====================================

await AdminSeeder.SeedAsync(
    app.Services,
    app.Configuration
);

// =====================================
// Run Application
// =====================================

app.Run();
