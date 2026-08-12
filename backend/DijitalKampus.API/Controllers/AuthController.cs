// API İsteklerini (HttpGet, HttpPost vb.) yakalamamızı ve HTTP cevapları (Ok, BadRequest) dönmemizi sağlayan temel ASP.NET kütüphanesi.
using Microsoft.AspNetCore.Mvc;

// Kullanıcı oluşturma, silme, şifre doğrulama gibi kimlik (Identity) işlemlerini yöneten hazır ASP.NET kütüphanesi.
using Microsoft.AspNetCore.Identity;

// Entity Framework Core: C# kodlarımız üzerinden SQL veritabanına bağlanıp veri çekmemizi sağlayan ORM aracı.
using Microsoft.EntityFrameworkCore; 

// Veritabanı tablolarımızın C# tarafındaki karşılıkları olan sınıflarımız (User, Post vb.) bu klasörün içinde.
using DijitalKampus.API.Models;

// Entity Framework'ün veritabanı bağlantı köprüsü olan ApplicationDbContext sınıfımız bu klasörde bulunuyor.
using DijitalKampus.API.Data;

namespace DijitalKampus.API.Controllers;

// Bu sınıfın bir API Controller (Yönetici) olduğunu ASP.NET'e bildiriyoruz, böylece HTTP isteklerini kabul edebiliyor.
[ApiController]

// Bu Controller'a dışarıdan nasıl erişileceğini belirliyoruz. "[controller]" kısmı otomatik olarak "Auth" kelimesini alır (Route: /api/Auth).
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    // ASP.NET Identity'nin bize sağladığı, kullanıcı bulma ve oluşturma işlerine yarayan yönetici sınıf (Dependency Injection ile gelecek).
    private readonly UserManager<User> _userManager;

    // ASP.NET Identity'nin bize sağladığı, kullanıcı giriş (Login) ve şifre doğrulama işlemlerini yapan sınıf.
    private readonly SignInManager<User> _signInManager;

    // Veritabanı tablolarımızla haberleşmemizi sağlayan, bizim oluşturduğumuz ana veritabanı (Context) sınıfımız.
    private readonly ApplicationDbContext _context;

    // Google API gibi dış servislere HTTP istekleri atmak için (Örn: Google Login Token onayı) kullanılan standart ağ aracı.
    private static readonly HttpClient _httpClient = new HttpClient();

    // CONSTRUCTOR (Yapıcı Metot): Dependency Injection (Bağımlılık Enjeksiyonu) burada gerçekleşir. 
    // Program.cs dosyasında tanımlanan servisler, Controller çağrıldığında otomatik olarak buraya parametre olarak gönderilir.
    public AuthController(UserManager<User> userManager, SignInManager<User> signInManager, ApplicationDbContext context)
    {
        _userManager = userManager; // Gelen UserManager servisini sınıfın içindeki değişkene kopyalar.
        _signInManager = signInManager; // Gelen SignInManager servisini sınıfın içindeki değişkene kopyalar.
        _context = context; // Gelen veritabanı servisini sınıfın içindeki değişkene kopyalar.
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // 1. ADIM: KULLANICIYI BULMA
        // Frontend'den gelen 'request' içindeki e-posta adresini alıyoruz.
        // UserManager (Identity sınıfı) sayesinde veritabanında bu e-postaya sahip biri var mı diye aratıyoruz.
        var user = await _userManager.FindByEmailAsync(request.Email);
        
        // Eğer kullanıcı yoksa, 401 Unauthorized (Yetkisiz) hatası dönüyoruz.
        if (user == null)
            return Unauthorized(new { message = "Kullanıcı bulunamadı." });

        // Kullanıcı hesabını silmiş/dondurmuş mu kontrolü yapıyoruz (Soft Delete mantığı)
        if (user.DeletedAt != null)
            return Unauthorized(new { message = "Hesabınız pasife alınmış." });

        // Kullanıcı admin tarafından onaylanmış mı diye bakıyoruz
        if (!user.IsApproved)
            return Unauthorized(new { message = "Hesabınız henüz onaylanmamış." });

        // 2. ADIM: ŞİFREYİ DOĞRULAMA
        // SignInManager, kullanıcının girdiği şifreyi (request.Password), veritabanındaki hash'lenmiş şifreyle karşılaştırır.
        
        // 'false' parametresi: Başarısız girişte hesabı kilitleme özelliği (Lockout) kapalı demek.
        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
        // Şifreler eşleşmezse hata dönüyoruz
        if (!result.Succeeded)
            return Unauthorized(new { message = "Hatalı şifre girdiniz." });

        // 3. ADIM: TOKEN ÜRETME VE GİRİŞ BAŞARILI
        // Şifre de doğruysa, frontend'in bizi tanıması için ona bir "Token" veriyoruz.
        // Prototip olduğu için JWT kütüphanesi yerine string bir token ürettik (Gerçek projede JWT Token Generate metodu buraya yazılır)
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
        // 1. ADIM: YENİ KULLANICI NESNESİ OLUŞTURMA
        // Frontend'den gelen e-posta ve kullanıcı adını alıp yeni bir User objesi (C# sınıfı) yaratıyoruz.
        // Veritabanına henüz KİTAP ETMEDİK, sadece bellekte (RAM'de) hazırladık.
        var newUser = new User
        {
            UserName = request.UserName, 
            Email = request.Email,
            Role = "Student", // Varsayılan olarak Öğrenci rolü veriyoruz
            CreatedAt = DateTime.UtcNow, // Kayıt tarihini o anki evrensel saat (UTC) olarak ayarlıyoruz
            IsApproved = true // Normalde admin onayı gerekebilir, test için direkt onaylı yapıyoruz
        };

        // 2. ADIM: VERİTABANINA KAYDETME
        // UserManager'ın CreateAsync metodu, verdiğimiz şifreyi otomatik olarak HASH'ler (şifreler)
        // ve veritabanına ekler. Veritabanında şifre "123456" olarak değil, "$2y$10..." gibi karmaşık bir metin olarak saklanır.
        var result = await _userManager.CreateAsync(newUser, request.Password);

        // Eğer kayıt başarısız olursa (örneğin e-posta zaten kullanımda veya şifre çok kısaysa) hata dönüyoruz
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description);
            return BadRequest(new { message = "Kayıt işlemi başarısız.", errors });
        }

        // AuditLog (Denetim İzi) tablomuza, sisteme yeni biri kayıt oldu diye log (kayıt) düşüyoruz
        _context.AuditLogs.Add(new AuditLog { AdminEmail = newUser.Email, Action = "KAYIT_OLUNDU", TargetUserId = newUser.Id, Details = $"{newUser.Email} sisteme kayıt oldu." });

        // 3. ADIM: ÖĞRENCİ PROFİLİ (İLİŞKİLİ TABLO) OLUŞTURMA
        // Kullanıcı ana tabloya (Users) eklendi ama detaylı bilgilerini (StudentProfiles tablosunu) de oluşturmalıyız.
        // Önce veritabanında herhangi bir 'Bölüm' (Department) var mı diye kontrol ediyoruz.
        var department = await _context.Departments.FirstOrDefaultAsync();
        
        // Eğer veritabanı sıfırlanmışsa ve hiç bölüm yoksa, hata vermemesi için "Genel Bölüm" diye sahte bir bölüm yaratıyoruz.
        if (department == null)
        {
            department = new Department { Name = "Genel Bölüm" }; 
            _context.Departments.Add(department);
            await _context.SaveChangesAsync();
        }

        // Users tablosundaki UserId ile Departments tablosundaki DepartmentId'yi birleştirerek 
        // StudentProfiles tablosuna (Foreign Key ilişkisiyle) kayıt atıyoruz.
        var studentProfile = new StudentProfile
        {
            UserId = newUser.Id,          
            DepartmentId = department.Id  
        };

        _context.StudentProfiles.Add(studentProfile);
        
        // Yaptığımız değişiklikleri veritabanına kalıcı olarak işliyoruz (COMMIT).
        await _context.SaveChangesAsync();

        // Her şey sorunsuz bittiyse kullanıcıya 200 OK ile başarı mesajı dönüyoruz.
        return Ok(new { message = "Kayıt başarıyla oluşturuldu! Lütfen giriş yapın." });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
    {
        return Ok(new { message = "Çıkış başarılı." });
    }

    // GOOGLE TOKEN DOĞRULAMA METODU
    // Frontend'den gelen Google Access Token'ın (Erişim Anahtarı) gerçekten Google tarafından mı verildiğini kontrol eder.
    private async Task<GoogleUserInfo?> VerifyGoogleAccessTokenAsync(string accessToken)
    {
        try
        {
            // Google'ın resmi kullanıcı bilgisi (userinfo) API'sine istek atmak için bir HTTP isteği hazırlıyoruz.
            var request = new HttpRequestMessage(HttpMethod.Get, "https://www.googleapis.com/oauth2/v3/userinfo");
            
            // İsteğin başlık (Header) kısmına frontend'den aldığımız token'ı ekliyoruz.
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
            
            // İsteği Google'a gönderiyoruz ve cevabı bekliyoruz.
            var response = await _httpClient.SendAsync(request);
            
            // Eğer cevap başarısızsa (örneğin token sahteyse veya süresi dolmuşsa), işlemi iptal et (null dön).
            if (!response.IsSuccessStatusCode)
                return null;
                
            // Google'dan dönen veriyi JSON formatında okuyoruz (isim, soyisim, email, profil resmi vb. içerir).
            var json = await response.Content.ReadAsStringAsync();
            
            // JSON verisini C# nesnesine (GoogleUserInfo sınıfına) dönüştürüp geri döndürüyoruz.
            return System.Text.Json.JsonSerializer.Deserialize<GoogleUserInfo>(json, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch
        {
            // Olası bir bağlantı hatasında sistemin çökmemesi için hatayı yakalayıp null dönüyoruz.
            return null;
        }
    }

    // GOOGLE İLE GİRİŞ YAPMA METODU
    [HttpPost("google-login")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        // 1. ADIM: TOKEN DOĞRULAMA
        // Yukarıda yazdığımız VerifyGoogleAccessTokenAsync metodunu çağırarak token'ın gerçekliğini Google'a soruyoruz.
        var userInfo = await VerifyGoogleAccessTokenAsync(request.AccessToken);
        
        // Google'dan gelen bilgi geçersizse veya e-posta adresi yoksa hata veriyoruz.
        if (userInfo == null || string.IsNullOrEmpty(userInfo.Email))
            return Unauthorized(new { message = "Geçersiz veya süresi dolmuş Google token." });

        // 2. ADIM: KULLANICI KONTROLÜ
        // Kullanıcının e-posta adresini alıp kendi veritabanımızda daha önce kayıt olmuş mu diye bakıyoruz.
        var user = await _userManager.FindByEmailAsync(userInfo.Email);
        
        // Eğer kullanıcı daha önceden sistemimizde varsa (kayıtlıysa)...
        if (user != null)
        {
            // Sisteme doğrudan giriş yapmasına izin veriyoruz ve token'ını gönderiyoruz. 
            // isNewUser = false diyerek frontend'e "Bu eski kullanıcı, doğrudan ana sayfaya yönlendir" diyoruz.
            return Ok(new 
            { 
                isNewUser = false,
                token = "dummy-jwt-token-" + user.Id, 
                role = user.Role, 
                email = user.Email 
            });
        }
        
        // 3. ADIM: YENİ KULLANICI (KAYIT EKRANINA YÖNLENDİRME)
        // Eğer kullanıcı veritabanımızda yoksa (ilk defa Google ile giriş yapıyorsa)...
        // isNewUser = true diyoruz. Google'dan aldığımız ad, soyad ve resmi frontend'e yolluyoruz.
        // Frontend bu bilgileri alıp "Rol Seçimi (Öğrenci, Mezun, İşveren)" ekranını (Onboarding) gösterecek.
        return Ok(new 
        { 
            isNewUser = true,
            email = userInfo.Email,
            firstName = userInfo.Given_name,
            lastName = userInfo.Family_name,
            avatarUrl = userInfo.Picture
        });
    }

    // GOOGLE İLE KAYIT TAMAMLAMA (ONBOARDING) METODU
    // Kullanıcı ilk defa Google ile geldiğinde, frontend ona Rol sorar (Öğrenci misin? Mezun musun?).
    // Kullanıcı formu doldurup gönderdiğinde bu metot çalışır.
    [HttpPost("complete-onboarding")]
    public async Task<IActionResult> CompleteOnboarding([FromBody] CompleteOnboardingRequest request)
    {
        // 1. ADIM: GÜVENLİK (Token'ı tekrar doğrula)
        // Frontend'den gelen isteğin güvenli olduğundan emin olmak için token'ı Google'dan tekrar doğruluyoruz.
        var userInfo = await VerifyGoogleAccessTokenAsync(request.AccessToken);
        if (userInfo == null || string.IsNullOrEmpty(userInfo.Email))
            return Unauthorized(new { message = "Geçersiz Google token." });

        // İki kere kayıt olmayı engellemek için veritabanında tekrar kontrol ediyoruz.
        var existingUser = await _userManager.FindByEmailAsync(userInfo.Email);
        if (existingUser != null)
            return BadRequest(new { message = "Kullanıcı zaten mevcut." });

        // 2. ADIM: ANA KULLANICI PROFİLİNİ OLUŞTURMA
        // Google'dan gelen e-posta ve avatarı, frontend'den gelen form bilgileriyle (Ad, Soyad, Rol) birleştiriyoruz.
        var newUser = new User
        {
            UserName = userInfo.Email,
            Email = userInfo.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            AvatarUrl = userInfo.Picture,
            Role = request.Role, // Student, Alumni veya Employer
            CreatedAt = DateTime.UtcNow,
            IsApproved = true
        };

        // Kullanıcıyı (şifresiz olarak, çünkü Google ile girdi) veritabanına kaydediyoruz.
        var result = await _userManager.CreateAsync(newUser);
        if (!result.Succeeded)
            return BadRequest(new { message = "Kayıt işlemi başarısız.", errors = result.Errors.Select(e => e.Description) });

        // Audit Log (Denetim İzi) bırakıyoruz.
        _context.AuditLogs.Add(new AuditLog { AdminEmail = newUser.Email, Action = "GOOGLE_KAYIT", TargetUserId = newUser.Id, Details = $"{newUser.Email} Google ile kayıt oldu." });

        // 3. ADIM: SEÇİLEN ROLE GÖRE DETAY TABLOSUNA KAYIT ATMA
        if (request.Role == "student")
        {
            // Öğrenci ise StudentProfiles tablosuna ekliyoruz (Varsayılan bölümle birlikte)
            var department = await _context.Departments.FirstOrDefaultAsync();
            if (department == null)
            {
                department = new Department { Name = "Genel Bölüm" }; 
                _context.Departments.Add(department);
                await _context.SaveChangesAsync();
            }
            _context.StudentProfiles.Add(new StudentProfile { UserId = newUser.Id, DepartmentId = department.Id });
        }
        else if (request.Role == "employer")
        {
            // İşveren ise EmployerProfiles tablosuna şirket bilgilerini kaydediyoruz
            _context.EmployerProfiles.Add(new EmployerProfile { UserId = newUser.Id, CompanyName = request.CompanyName, Sector = request.CompanySector });
        }
        else if (request.Role == "alumni")
        {
            // Mezun ise AlumniProfiles tablosuna güncel çalıştığı yer bilgilerini kaydediyoruz
            _context.AlumniProfiles.Add(new AlumniProfile { UserId = newUser.Id, CurrentCompany = request.CurrentCompany, CurrentPosition = request.CurrentPosition });
        }

        // Değişiklikleri veritabanına kalıcı olarak işliyoruz (COMMIT).
        await _context.SaveChangesAsync();

        // 4. ADIM: GİRİŞ BAŞARILI
        // Kayıt tamamlandıktan sonra kullanıcıya anında yetki (Token) verip sisteme giriş yaptırıyoruz.
        return Ok(new 
        { 
            success = true,
            token = "dummy-jwt-token-" + newUser.Id, 
            role = newUser.Role, 
            email = newUser.Email 
        });
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

public class GoogleLoginRequest
{
    public string AccessToken { get; set; } = string.Empty;
}

public class CompleteOnboardingRequest
{
    public string AccessToken { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Faculty { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string StudyYear { get; set; } = string.Empty;
    public string DesiredSector { get; set; } = string.Empty;
    public string DesiredPosition { get; set; } = string.Empty;
    public string GraduationYear { get; set; } = string.Empty;
    public string CurrentSector { get; set; } = string.Empty;
    public string CurrentCompany { get; set; } = string.Empty;
    public string CurrentPosition { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string CompanySector { get; set; } = string.Empty;
}

public class GoogleUserInfo
{
    public string Email { get; set; } = string.Empty;
    public string Given_name { get; set; } = string.Empty;
    public string Family_name { get; set; } = string.Empty;
    public string Picture { get; set; } = string.Empty;
}