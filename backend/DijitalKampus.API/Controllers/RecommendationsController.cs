using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DijitalKampus.API.Data;
using DijitalKampus.API.Models;

namespace DijitalKampus.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecommendationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public RecommendationsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("people-you-may-know")]
    public async Task<IActionResult> GetPeopleYouMayKnow([FromQuery] string email)
    {
        if (string.IsNullOrEmpty(email))
            return BadRequest("Email is required");

        var currentUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (currentUser == null)
            return NotFound("User not found");

        int currentUserId = currentUser.Id;

        // 1. Tüm takip ilişkilerini ve aktif kullanıcıları belleğe al (Uygulama küçük ölçekli olduğu için MySQL translation hatasını aşmak adına en güvenli yol)
        var allFollows = await _context.UserFollows.ToListAsync();
        var allUsers = await _context.Users
            .Where(u => u.DeletedAt == null && u.IsApproved && u.Id != currentUserId)
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new { u.Id, u.FirstName, u.LastName, u.UserName, u.AvatarUrl, u.Role })
            .ToListAsync();

        // Takip ettiğim kişilerin ID'leri
        var followedUserIds = allFollows
            .Where(f => f.FollowerId == currentUserId)
            .Select(f => f.FollowedId)
            .ToHashSet();

        // 2. Ortak arkadaşları bul (Benim takip ettiklerimin takip ettikleri)
        var mutualFollows = allFollows
            .Where(f => followedUserIds.Contains(f.FollowerId)) // Benim takip ettiklerim
            .Where(f => f.FollowedId != currentUserId) // Kendimi önerme
            .Where(f => !followedUserIds.Contains(f.FollowedId)) // Zaten takip ettiklerimi önerme
            .GroupBy(f => f.FollowedId)
            .Select(g => new { UserId = g.Key, MutualCount = g.Count() })
            .OrderByDescending(x => x.MutualCount)
            .Take(5)
            .ToList();

        var recommendedUserIds = mutualFollows.Select(m => m.UserId).ToHashSet();

        // 3. Eğer 5 kişiden az ortak arkadaş varsa, diğer kullanıcılardan tamamla (yeni kayıt olanlar)
        if (recommendedUserIds.Count < 5)
        {
            var fallbackUserIds = allUsers
                .Where(u => !followedUserIds.Contains(u.Id) && !recommendedUserIds.Contains(u.Id))
                .Take(5 - recommendedUserIds.Count)
                .Select(u => u.Id)
                .ToList();

            foreach (var id in fallbackUserIds)
                recommendedUserIds.Add(id);
        }

        // 4. Sonuçları oluştur
        var recommendations = allUsers
            .Where(u => recommendedUserIds.Contains(u.Id))
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.UserName,
                u.AvatarUrl,
                u.Role,
                MutualCount = mutualFollows.FirstOrDefault(m => m.UserId == u.Id)?.MutualCount ?? 0
            })
            .OrderByDescending(r => r.MutualCount)
            .ThenByDescending(r => r.Id)
            .ToList();
        return Ok(recommendations);
    }
}
