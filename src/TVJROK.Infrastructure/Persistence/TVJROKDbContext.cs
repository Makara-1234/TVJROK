
using Microsoft.EntityFrameworkCore;
using TVJROK.Domain.Entities;

namespace TVJROK.Infrastructure.Persistence;

public class TVJROKDbContext : DbContext
{
    public TVJROKDbContext(DbContextOptions<TVJROKDbContext> options)
        : base(options)
    {
    }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<RestaurantTable> RestaurantTables => Set<RestaurantTable>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Promotion> Promotions => Set<Promotion>();
    public DbSet<OrderStatusHistory> OrderStatusHistories
        => Set<OrderStatusHistory>();
    public DbSet<RestaurantSetting> RestaurantSettings
    => Set<RestaurantSetting>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Restaurant Settings
modelBuilder.Entity<RestaurantSetting>()
    .Property(x => x.RestaurantName)
    .HasMaxLength(200)
    .IsRequired();

modelBuilder.Entity<RestaurantSetting>()
    .Property(x => x.PhoneNumber)
    .HasMaxLength(30);

modelBuilder.Entity<RestaurantSetting>()
    .Property(x => x.Address)
    .HasMaxLength(500);

modelBuilder.Entity<RestaurantSetting>()
    .Property(x => x.LogoUrl)
    .HasMaxLength(1000);

modelBuilder.Entity<RestaurantSetting>()
    .Property(x => x.CurrencyCode)
    .HasMaxLength(3)
    .IsRequired();

modelBuilder.Entity<RestaurantSetting>()
    .Property(x => x.OpeningTime)
    .HasMaxLength(5)
    .IsRequired();

modelBuilder.Entity<RestaurantSetting>()
    .Property(x => x.ClosingTime)
    .HasMaxLength(5)
    .IsRequired();

        // Additional field constraints

modelBuilder.Entity<ProductImage>()
    .Property(x => x.ImageUrl)
    .HasMaxLength(1000)
    .IsRequired();

modelBuilder.Entity<ProductImage>()
    .Property(x => x.StoragePath)
    .HasMaxLength(500);

modelBuilder.Entity<Order>()
    .Property(x => x.CustomerName)
    .HasMaxLength(150);

modelBuilder.Entity<Order>()
    .Property(x => x.CustomerPhone)
    .HasMaxLength(30);

modelBuilder.Entity<Order>()
    .Property(x => x.Notes)
    .HasMaxLength(1000);

modelBuilder.Entity<Payment>()
    .Property(x => x.TransactionReference)
    .HasMaxLength(150);

modelBuilder.Entity<Payment>()
    .Property(x => x.ReceiptImageUrl)
    .HasMaxLength(1000);
    
modelBuilder.Entity<Payment>()
    .Property(x => x.RejectionReason)
    .HasMaxLength(500);

modelBuilder.Entity<Promotion>()
    .Property(x => x.Title)
    .HasMaxLength(200)
    .IsRequired();

modelBuilder.Entity<Promotion>()
    .Property(x => x.Description)
    .HasMaxLength(1000);

modelBuilder.Entity<Promotion>()
    .Property(x => x.ImageUrl)
    .HasMaxLength(1000);

modelBuilder.Entity<OrderStatusHistory>()
    .Property(x => x.Note)
    .HasMaxLength(1000);

        // Base Entity
        modelBuilder.Entity<Category>()
            .HasKey(x => x.Id);

        modelBuilder.Entity<Product>()
            .HasKey(x => x.Id);

        // Category - Product
        modelBuilder.Entity<Category>()
            .HasMany(x => x.Products)
            .WithOne(x => x.Category)
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        // Product - ProductImage
        modelBuilder.Entity<Product>()
            .HasMany(x => x.Images)
            .WithOne(x => x.Product)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        // RestaurantTable - Order
        modelBuilder.Entity<RestaurantTable>()
            .HasMany(x => x.Orders)
            .WithOne(x => x.Table)
            .HasForeignKey(x => x.TableId)
            .OnDelete(DeleteBehavior.SetNull);

        // Order - OrderItem
        modelBuilder.Entity<Order>()
            .HasMany(x => x.Items)
            .WithOne(x => x.Order)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Product - OrderItem
        modelBuilder.Entity<Product>()
            .HasMany<OrderItem>()
            .WithOne(x => x.Product)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        // Order - Payment
        modelBuilder.Entity<Order>()
            .HasMany<Payment>()
            .WithOne(x => x.Order)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Order - OrderStatusHistory
        modelBuilder.Entity<Order>()
            .HasMany<OrderStatusHistory>()
            .WithOne(x => x.Order)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Decimal precision
        modelBuilder.Entity<Product>()
            .Property(x => x.Price)
            .HasPrecision(12, 2);

        modelBuilder.Entity<Order>()
            .Property(x => x.TotalAmount)
            .HasPrecision(12, 2);

        modelBuilder.Entity<OrderItem>()
            .Property(x => x.UnitPrice)
            .HasPrecision(12, 2);

        modelBuilder.Entity<OrderItem>()
            .Property(x => x.Subtotal)
            .HasPrecision(12, 2);

        modelBuilder.Entity<Payment>()
            .Property(x => x.Amount)
            .HasPrecision(12, 2);

// Enum conversion
modelBuilder.Entity<Order>()
    .Property(x => x.Status)
    .HasConversion<string>()
    .HasMaxLength(30);

modelBuilder.Entity<Payment>()
    .Property(x => x.Status)
    .HasConversion<string>()
    .HasMaxLength(30);

modelBuilder.Entity<Payment>()
    .Property(x => x.PaymentMethod)
    .HasConversion<string>()
    .HasMaxLength(50);

modelBuilder.Entity<OrderStatusHistory>()
    .Property(x => x.Status)
    .HasConversion<string>()
    .HasMaxLength(30);

modelBuilder.Entity<Payment>()
    .Property(x => x.PaymentMethod)
    .HasConversion<string>()
    .HasMaxLength(50);

        // Unique indexes
        modelBuilder.Entity<Order>()
            .HasIndex(x => x.OrderNumber)
            .IsUnique();

        modelBuilder.Entity<RestaurantTable>()
            .HasIndex(x => x.TableNumber)
            .IsUnique();

        // Required fields
        modelBuilder.Entity<Category>()
            .Property(x => x.Name)
            .HasMaxLength(150)
            .IsRequired();

        modelBuilder.Entity<Product>()
            .Property(x => x.Name)
            .HasMaxLength(200)
            .IsRequired();

        modelBuilder.Entity<Order>()
            .Property(x => x.OrderNumber)
            .HasMaxLength(30)
            .IsRequired();

        modelBuilder.Entity<Order>()
            .Property(x => x.CurrencyCode)
            .HasMaxLength(3)
            .IsRequired();

        modelBuilder.Entity<Payment>()
            .Property(x => x.PaymentMethod)
            .HasMaxLength(50)
            .IsRequired();
    }
}
