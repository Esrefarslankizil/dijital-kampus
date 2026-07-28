using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DijitalKampus.API.Data;
using DijitalKampus.API.Models;

namespace DijitalKampus.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ProfileController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _env;

    public ProfileController(ApplicationDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    private int GetCurrentUserId()
    {
        var authHeader = Request.Headers["Authorization"].ToString();
        if (authHeader.StartsWith("Bearer dummy-jwt-token-"))
        {
            int.TryParse(authHeader.Substring("Bearer dummy-jwt-token-".Length), out int userId);
            return userId;
        }
        return 0;
    }

    // GET api/profile/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetProfile(int id)
    {
        int currentUserId = GetCurrentUserId();

        var user = await _context.Users
            .Include(u => u.Followers)
            .Include(u => u.FollowedUsers)
            .Include(u => u.Posts.Where(p => p.DeletedAt == null))
                .ThenInclude(p => p.PostMedias)
            .Include(u => u.Posts.Where(p => p.DeletedAt == null))
                .ThenInclude(p => p.PostLikes)
            .Include(u => u.Posts.Where(p => p.DeletedAt == null))
                .ThenInclude(p => p.Comments)
            .Include(u => u.StudentProfile)
            .Include(u => u.AlumniProfile)
            .Include(u => u.EmployerProfile)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null) return NotFound("Kullanıcı bulunamadı.");

        bool isFollowing = currentUserId > 0 && await _context.UserFollows
            .AnyAsync(uf => uf.FollowerId == currentUserId && uf.FollowedId == id);

        string departmentOrTitle = user.Role;
        if (user.StudentProfile != null) departmentOrTitle = $"{user.StudentProfile.Department} Öğrencisi";
        else if (user.AlumniProfile != null) departmentOrTitle = $"{user.AlumniProfile.GraduationYear} Mezunu, {user.AlumniProfile.FieldOfWork}";
        else if (user.EmployerProfile != null) departmentOrTitle = user.EmployerProfile.CompanyName;

        string displayName = string.IsNullOrWhiteSpace(user.FirstName)
            ? user.UserName ?? user.Email ?? "Kullanıcı"
            : $"{user.FirstName} {user.LastName}".Trim();

        return Ok(new
        {
            user.Id,
            user.UserName,
            user.Email,
            user.Role,
            user.FirstName,
            user.LastName,
            DisplayName = displayName,
            AvatarUrl = user.AvatarUrl,
            CoverUrl = user.CoverUrl,
            Bio = "Merhaba! Dijital Kampüs'e yeni katıldım.",
            DepartmentOrTitle = departmentOrTitle,
            FollowersCount = user.Followers.Count,
            FollowingCount = user.FollowedUsers.Count,
            IsFollowing = isFollowing,
            Posts = user.Posts.OrderByDescending(p => p.CreatedAt).Select(p => new
            {
                p.Id,
                p.Content,
                p.CreatedAt,
                LikeCount = p.PostLikes.Count,
                CommentCount = p.Comments.Count,
                IsLikedByMe = currentUserId > 0 && p.PostLikes.Any(l => l.UserId == currentUserId),
                Medias = p.PostMedias.Select(m => new { m.Url })
            })
        });
    }

    // PUT api/profile/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProfile(int id, [FromBody] UpdateProfileRequest request)
    {
        int currentUserId = GetCurrentUserId();
        if (currentUserId != id) return Forbid();

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(request.UserName) && request.UserName != user.UserName)
        {
            var taken = await _context.Users.AnyAsync(u => u.UserName == request.UserName && u.Id != id);
            if (taken) return BadRequest(new { message = "Bu kullanıcı adı zaten kullanımda." });
            user.UserName = request.UserName;
            user.NormalizedUserName = request.UserName.ToUpperInvariant();
        }

        if (request.FirstName != null) user.FirstName = request.FirstName.Trim();
        if (request.LastName != null) user.LastName = request.LastName.Trim();

        await _context.SaveChangesAsync();

        string displayName = string.IsNullOrWhiteSpace(user.FirstName)
            ? user.UserName ?? "Kullanıcı"
            : $"{user.FirstName} {user.LastName}".Trim();

        return Ok(new { user.Id, user.UserName, user.FirstName, user.LastName, DisplayName = displayName, user.AvatarUrl, user.CoverUrl });
    }

    // POST api/profile/{id}/avatar
    [HttpPost("{id}/avatar")]
    public async Task<IActionResult> UploadAvatar(int id, IFormFile file)
        => await UploadImage(id, file, "avatars", (user, url) => { user.AvatarUrl = url; }, user => user.AvatarUrl, "avatarUrl");

    // DELETE api/profile/{id}/avatar
    [HttpDelete("{id}/avatar")]
    public async Task<IActionResult> RemoveAvatar(int id)
        => await RemoveImage(id, user => user.AvatarUrl, (user) => { user.AvatarUrl = null; }, "avatarUrl");

    // POST api/profile/{id}/cover
    [HttpPost("{id}/cover")]
    public async Task<IActionResult> UploadCover(int id, IFormFile file)
        => await UploadImage(id, file, "covers", (user, url) => { user.CoverUrl = url; }, user => user.CoverUrl, "coverUrl");

    // DELETE api/profile/{id}/cover
    [HttpDelete("{id}/cover")]
    public async Task<IActionResult> RemoveCover(int id)
        => await RemoveImage(id, user => user.CoverUrl, (user) => { user.CoverUrl = null; }, "coverUrl");

    // ----- Yardımcı Metodlar -----

    private async Task<IActionResult> UploadImage(int id, IFormFile file, string folder,
        Action<User, string> setUrl, Func<User, string?> getUrl, string responseKey)
    {
        int currentUserId = GetCurrentUserId();
        if (currentUserId != id) return Forbid();

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();
        if (file == null || file.Length == 0) return BadRequest("Dosya boş.");

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType.ToLower())) return BadRequest("Sadece resim dosyaları kabul edilir.");
        if (file.Length > 8 * 1024 * 1024) return BadRequest("Dosya boyutu 8 MB'dan büyük olamaz.");

        var uploadsDir = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", folder);
        Directory.CreateDirectory(uploadsDir);

        // Eski dosyayı sil
        var oldUrl = getUrl(user);
        if (!string.IsNullOrEmpty(oldUrl))
        {
            var oldPath = Path.Combine(_env.WebRootPath ?? "wwwroot", oldUrl.TrimStart('/'));
            if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
        }

        var ext = Path.GetExtension(file.FileName);
        var fileName = $"{folder.TrimEnd('s')}_{id}_{DateTime.UtcNow.Ticks}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
            await file.CopyToAsync(stream);

        var newUrl = $"/uploads/{folder}/{fileName}";
        setUrl(user, newUrl);
        await _context.SaveChangesAsync();

        return Ok(new Dictionary<string, string> { [responseKey] = newUrl });
    }

    private async Task<IActionResult> RemoveImage(int id, Func<User, string?> getUrl,
        Action<User> clearUrl, string responseKey)
    {
        int currentUserId = GetCurrentUserId();
        if (currentUserId != id) return Forbid();

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        var oldUrl = getUrl(user);
        if (!string.IsNullOrEmpty(oldUrl))
        {
            var oldPath = Path.Combine(_env.WebRootPath ?? "wwwroot", oldUrl.TrimStart('/'));
            if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
        }

        clearUrl(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Kaldırıldı." });
    }
}

public class UpdateProfileRequest
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? UserName { get; set; }
}
