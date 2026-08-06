using DijitalKampus.API.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using DijitalKampus.API.Models;
using DijitalKampus.API.Hubs;

var builder = WebApplication.CreateBuilder(args);

// ----- CORS -----
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ----- Database -----
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
builder.Services.AddIdentity<User, IdentityRole<int>>(options =>
{
    // Türkçe karakter ve boşluk içeren kullanıcı adlarına izin ver
    options.User.AllowedUserNameCharacters = "abcçdefgğhıijklmnoöpqrsştuüvwxyzABCÇDEFGĞHIİJKLMNOÖPQRSŞTUÜVWXYZ0123456789 ._-@+";
    options.User.RequireUniqueEmail = true;
})
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// ----- Swagger -----
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

var app = builder.Build();

// ----- Apply Migrations and Seed Data at startup -----
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.Migrate();

    // Migrate old AuditLog actions to Turkish
    var logsToUpdate = db.AuditLogs.Where(l => l.Action == "USER_APPROVED" || l.Action == "USER_DEACTIVATED" || l.Action == "USER_ACTIVATED" || l.Action == "EVENT_APPROVED" || l.Action == "EVENT_DELETED" || l.Action == "GROUP_APPROVED" || l.Action == "GROUP_DELETED" || l.Action == "POST_DELETED").ToList();
    foreach (var log in logsToUpdate)
    {
        switch (log.Action)
        {
            case "USER_APPROVED": log.Action = "KULLANICI_ONAYLANDI"; break;
            case "USER_DEACTIVATED": log.Action = "KULLANICI_PASIFE_ALINDI"; break;
            case "USER_ACTIVATED": log.Action = "KULLANICI_AKTIFLESTIRILDI"; break;
            case "EVENT_APPROVED": log.Action = "ETKINLIK_ONAYLANDI"; break;
            case "EVENT_DELETED": log.Action = "ETKINLIK_SILINDI"; break;
            case "GROUP_APPROVED": log.Action = "GRUP_ONAYLANDI"; break;
            case "GROUP_DELETED": log.Action = "GRUP_SILINDI"; break;
            case "POST_DELETED": log.Action = "GONDERI_SILINDI"; break;
        }
    }
    if (logsToUpdate.Any()) db.SaveChanges();

    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
    var testEmail = "test@mtu.edu.tr";
    if (!db.Users.IgnoreQueryFilters().Any(u => u.Email == testEmail))
    {
        var testUser = new User { UserName = testEmail, Email = testEmail, Role = "Ogrenci", IsApproved = true, CreatedAt = DateTime.UtcNow };
        await userManager.CreateAsync(testUser, "Sifre123!");
    }

    var test2Email = "test2@mtu.edu.tr";
    if (!db.Users.IgnoreQueryFilters().Any(u => u.Email == test2Email))
    {
        var test2User = new User { UserName = test2Email, Email = test2Email, Role = "Ogrenci", IsApproved = true, CreatedAt = DateTime.UtcNow };
        await userManager.CreateAsync(test2User, "Sifre123!");
    }

    var test3Email = "test3@mtu.edu.tr";

    var adminEmail = "admin@mtu.edu.tr";
    if (!db.Users.IgnoreQueryFilters().Any(u => u.Email == adminEmail))
    {
        var adminUser = new User { UserName = adminEmail, Email = adminEmail, Role = "Admin", IsApproved = true, CreatedAt = DateTime.UtcNow };
        await userManager.CreateAsync(adminUser, "Sifre123!");
    }
    if (!db.Users.IgnoreQueryFilters().Any(u => u.Email == test3Email))
    {
        var test3User = new User { UserName = test3Email, Email = test3Email, Role = "Ogrenci", IsApproved = true, CreatedAt = DateTime.UtcNow };
        await userManager.CreateAsync(test3User, "Sifre123!");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

app.UseStaticFiles(); // EKLENDI: wwwroot klasorundeki yuklenen resimleri sunmak icin


// ============================================================
//  API ENDPOINTS (Boş - Daha sonra eklenecek)
// ============================================================

app.MapControllers();
app.MapHub<ChatHub>("/chathub");

app.Run();
