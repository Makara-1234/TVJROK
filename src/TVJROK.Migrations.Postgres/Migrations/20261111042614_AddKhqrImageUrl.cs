using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TVJROK.Migrations.Postgres.Migrations
{
    /// <inheritdoc />
    public partial class AddKhqrImageUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "KhqrImageUrl",
                table: "RestaurantSettings",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "KhqrImageUrl",
                table: "RestaurantSettings");
        }
    }
}
