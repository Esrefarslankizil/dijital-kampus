using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore; // Veritabanı sorguları (FirstOrDefaultAsync) için eklendi
using DijitalKampus.API.Models;
using DijitalKampus.API.Data;

namespace DijitalKampus.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly ApplicationDbContext _context;

    public AuthController(UserManager<User> userManager, SignInManager<User> signInManager, ApplicationDbContext context)
    {
        _userManager = userManager; 
        _signInManager = signInManager; 
        _context = context;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // 1. Kullanıcıyı e-posta üzerinden bul
        var user = await _userManager.FindByEmailAsync(request.Email);
        
        if (user == null)
            return Unauthorized(new { message = "Kullanıcı bulunamadı." });

        if (user.DeletedAt != null)
            return Unauthorized(new { message = "Hesabınız pasife alınmış." });

        if (!user.IsApproved)
            return Unauthorized(new { message = "Hesabınız henüz onaylanmamış." });

        // 2. Şifreyi doğrula
        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
        
        if (!result.Succeeded)
            return Unauthorized(new { message = "Hatalı şifre girdiniz." });

        // Başarılı giriş
        return Ok(new 
        { 
            token = "dummy-jwt-token-" + user.Id, 
            role = user.Role, 
            email = user.Email,
            avatarUrl = user.AvatarUrl
        });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        // 1. Yeni bir kullanıcı profili hazırlıyoruz
        var newUser = new User
        {
            UserName = request.UserName, 
            Email = request.Email,
            Role = "Student", 
            CreatedAt = DateTime.UtcNow,
            IsApproved = true
        };

        // 2. UserManager bu kullanıcıyı veritabanına ekliyor
        var result = await _userManager.CreateAsync(newUser, request.Password);

        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description);
            return BadRequest(new { message = "Kayıt işlemi başarısız.", errors });
        }

        _context.AuditLogs.Add(new AuditLog { AdminEmail = newUser.Email, Action = "KAYIT_OLUNDU", TargetUserId = newUser.Id, Details = $"{newUser.Email} sisteme kayıt oldu." });

        // 🚀 İŞTE HAYAT KURTARAN DOKUNUŞ BURASI 🚀
        // 1. Veritabanında hiç bölüm var mı diye kontrol ediyoruz
        var department = await _context.Departments.FirstOrDefaultAsync();
        
        // 2. Eğer veritabanını yeni sıfırladıysak ve tablo bomboşsa, geçici bir bölüm oluşturuyoruz
        if (department == null)
        {
            department = new Department { Name = "Genel Bölüm" }; 
            _context.Departments.Add(department);
            await _context.SaveChangesAsync();
        }

        // 3. Kullanıcıya artık %100 var olan bir bölümün ID'si ile profil açıyoruz
        var studentProfile = new StudentProfile
        {
            UserId = newUser.Id,          
            DepartmentId = department.Id  
        };

        _context.StudentProfiles.Add(studentProfile);
        await _context.SaveChangesAsync();
        // 🚀 BİTTİ 🚀

        return Ok(new { message = "Kayıt başarıyla oluşturuldu! Lütfen giriş yapın." });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
    {
        return Ok(new { message = "Çıkış başarılı." });
    }
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LogoutRequest
{
    public string Email { get; set; } = string.Empty;
}