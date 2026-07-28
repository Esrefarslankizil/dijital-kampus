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
builder.Services.AddIdentity<User, IdentityRole<int>>()
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

    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
    var testEmail = "test@mtu.edu.tr";
    if (await userManager.FindByEmailAsync(testEmail) == null)
    {
        var testUser = new User { UserName = testEmail, Email = testEmail, Role = "Ogrenci", IsApproved = true, CreatedAt = DateTime.UtcNow };
        await userManager.CreateAsync(testUser, "Sifre123!");
    }

    var test2Email = "test2@mtu.edu.tr";
    if (await userManager.FindByEmailAsync(test2Email) == null)
    {
        var test2User = new User { UserName = test2Email, Email = test2Email, Role = "Ogrenci", IsApproved = true, CreatedAt = DateTime.UtcNow };
        await userManager.CreateAsync(test2User, "Sifre123!");
    }

    var test3Email = "test3@mtu.edu.tr";
    if (await userManager.FindByEmailAsync(test3Email) == null)
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
