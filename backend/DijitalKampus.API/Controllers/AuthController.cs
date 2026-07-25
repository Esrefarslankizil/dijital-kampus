using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DijitalKampus.API.Data;

namespace DijitalKampus.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AuthController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // NOT: Gerçek bir projede şifre hash'lenerek kontrol edilmeli ve gerçek bir JWT token üretilmelidir.
        // Bu sadece test amaçlı basit bir login servisidir.
        
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        
        if (user == null)
        {
            return Unauthorized(new { message = "Kullanıcı bulunamadı." });
        }

        if (user.DeletedAt != null)
        {
            return Unauthorized(new { message = "Hesabınız pasife alınmış." });
        }

        if (!user.IsApproved)
        {
            return Unauthorized(new { message = "Hesabınız henüz onaylanmamış." });
        }

        // Başarılı giriş
        return Ok(new 
        { 
            token = "dummy-jwt-token-" + user.Id, 
            role = user.Role, 
            email = user.Email 
        });
    }
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
