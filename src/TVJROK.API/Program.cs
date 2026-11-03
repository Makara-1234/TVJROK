
using Microsoft.EntityFrameworkCore;
using TVJROK.Infrastructure.Persistence;
using TVJROK.Application.Features.Categories.Interfaces;
using TVJROK.Infrastructure.Services;
using TVJROK.Application.Features.Products.Interfaces;
using TVJROK.Application.Features.Orders.Interfaces;
using TVJROK.Application.Features.Tables.Interfaces;
using TVJROK.Application.Features.Payments;


var builder = WebApplication.CreateBuilder(args);


// Database Configuration
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


builder.Services.AddDbContext<TVJROKDbContext>(options =>
{
    if (builder.Environment.IsProduction())
    {
        options.UseNpgsql(connectionString);
    }
    else
    {
        options.UseSqlServer(connectionString);
    }
});

// API Services

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter()
        );
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Application Services
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IProductImageService, ProductImageService>();

// payment services
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<
    IPaymentReceiptService,
    PaymentReceiptService>();

// Table Service
builder.Services.AddScoped<ITableService, TableService>();

// Order Service
builder.Services.AddScoped<IOrderService, OrderService>();

// Payment Service
builder.Services.AddScoped<IPaymentService, PaymentService>();

// Supabase Storage Service
builder.Services.AddHttpClient<SupabaseStorageService>();

builder.Services.AddScoped<
    IProductImageService,
    ProductImageService>();
    
// Supabase Storage Service
builder.Services.AddHttpClient<SupabaseStorageService>();

// Category Service
builder.Services.AddScoped<ICategoryService, CategoryService>();

// Product Service
builder.Services.AddScoped<IProductService, ProductService>();

// CORS for React + Vite

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


var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("ReactFrontend");


app.MapControllers();

app.Run();
