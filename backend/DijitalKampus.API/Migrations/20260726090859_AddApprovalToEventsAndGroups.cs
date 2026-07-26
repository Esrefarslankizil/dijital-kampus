using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DijitalKampus.API.Migrations
{
    /// <inheritdoc />
    public partial class AddApprovalToEventsAndGroups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsApproved",
                table: "Groups",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsApproved",
                table: "Events",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsApproved",
                table: "Groups");

            migrationBuilder.DropColumn(
                name: "IsApproved",
                table: "Events");
        }
    }
}
