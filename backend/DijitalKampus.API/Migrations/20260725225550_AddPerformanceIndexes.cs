using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DijitalKampus.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Category",
                table: "Groups",
                type: "varchar(255)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "EventType",
                table: "Events",
                type: "varchar(255)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Posts_DeletedAt_CreatedAt",
                table: "Posts",
                columns: new[] { "DeletedAt", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Groups_DeletedAt_Category",
                table: "Groups",
                columns: new[] { "DeletedAt", "Category" });

            migrationBuilder.CreateIndex(
                name: "IX_Events_DeletedAt_EventType_EventDate",
                table: "Events",
                columns: new[] { "DeletedAt", "EventType", "EventDate" });

            migrationBuilder.CreateIndex(
                name: "IX_Events_EventDate",
                table: "Events",
                column: "EventDate");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Posts_DeletedAt_CreatedAt",
                table: "Posts");

            migrationBuilder.DropIndex(
                name: "IX_Groups_DeletedAt_Category",
                table: "Groups");

            migrationBuilder.DropIndex(
                name: "IX_Events_DeletedAt_EventType_EventDate",
                table: "Events");

            migrationBuilder.DropIndex(
                name: "IX_Events_EventDate",
                table: "Events");

            migrationBuilder.AlterColumn<string>(
                name: "Category",
                table: "Groups",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(255)")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "EventType",
                table: "Events",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(255)")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }
    }
}
