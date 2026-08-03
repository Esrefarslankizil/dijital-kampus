using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using DijitalKampus.API.Models;

namespace DijitalKampus.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;

    // Artık DbContext'i elle çağırmıyoruz, Microsoft'un hazır Yöneticilerini çağırıyoruz 
    public AuthController(UserManager<User> userManager, SignInManager<User> signInManager)
    {
        _userManager = userManager; // Kulalnıcı işlemlerini yönetir. Kullanıcı oluşturma silme 
        _signInManager = signInManager; // Oturum Açma işlemlerini Yönetir. 
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

        // 2. Şifreyi doğrula (Eski sistemde şifre kontrolü bile yoktu, artık var!)
        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
        
        if (!result.Succeeded)
            return Unauthorized(new { message = "Hatalı şifre girdiniz." });

        // Başarılı giriş (Frontend ekibinin kodları bozulmasın diye eski formatta cevap dönüyoruz)
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
            UserName = request.Email, // Identity arka planda UserName kullanmayı sever, biz e-postayı atıyoruz.
            Email = request.Email,
            Role = "Student", // Varsayılan olarak herkes Öğrenci kayıt olsun
            CreatedAt = DateTime.UtcNow,
            IsApproved = true
        };

        // 2. UserManager (Güvenlik Şefimiz) bu kullanıcıyı veritabanına ekliyor ve şifresini otomatik kriptoluyor!
        var result = await _userManager.CreateAsync(newUser, request.Password);

        if (!result.Succeeded)
        {
            // Eğer bir hata varsa (şifre çok kısaysa, aynı e-posta varsa vs.) hataları listeleyip yolluyoruz
            var errors = result.Errors.Select(e => e.Description);
            return BadRequest(new { message = "Kayıt işlemi başarısız.", errors });
        }

        return Ok(new { message = "Kayıt başarıyla oluşturuldu! Lütfen giriş yapın." });
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
    public string Password { get; set; } = string.Empty;
}