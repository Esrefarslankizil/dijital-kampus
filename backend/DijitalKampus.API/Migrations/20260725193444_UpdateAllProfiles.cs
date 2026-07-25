using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DijitalKampus.API.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAllProfiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Biography",
                table: "StudentProfiles",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Grade",
                table: "StudentProfiles",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "TargetPosition",
                table: "StudentProfiles",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "TargetSector",
                table: "StudentProfiles",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Sector",
                table: "EmployerProfiles",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "CurrentPosition",
                table: "AlumniProfiles",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Biography",
                table: "StudentProfiles");

            migrationBuilder.DropColumn(
                name: "Grade",
                table: "StudentProfiles");

            migrationBuilder.DropColumn(
                name: "TargetPosition",
                table: "StudentProfiles");

            migrationBuilder.DropColumn(
                name: "TargetSector",
                table: "StudentProfiles");

            migrationBuilder.DropColumn(
                name: "Sector",
                table: "EmployerProfiles");

            migrationBuilder.DropColumn(
                name: "CurrentPosition",
                table: "AlumniProfiles");
        }
    }
}
