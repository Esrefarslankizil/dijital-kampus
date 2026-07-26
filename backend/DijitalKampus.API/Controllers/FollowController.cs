using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DijitalKampus.API.Models;
using DijitalKampus.API.Data;

namespace DijitalKampus.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class FollowController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public FollowController(ApplicationDbContext context)
    {
        _context = context;
    }

    // 1. TAKİP ET SERVİSİ
   
    [HttpPost("{followerId}/follow/{followedId}")]
    public async Task<IActionResult> FollowUser(int followerId, int followedId)
    {
        if (followerId == followedId)
            return BadRequest(new { message = "Kendinizi takip edemezsiniz." });

        // Kullanıcılar gerçekten var mı kontrolü
        var followerExists = await _context.Users.AnyAsync(u => u.Id == followerId);
        var followedExists = await _context.Users.AnyAsync(u => u.Id == followedId);

        if (!followerExists || !followedExists)
            return NotFound(new { message = "Kullanıcılardan biri bulunamadı." });

        // Zaten takip ediyor mu kontrolü
        var alreadyFollowing = await _context.UserFollows
            .AnyAsync(f => f.FollowerId == followerId && f.FollowedId == followedId);

        if (alreadyFollowing)
            return BadRequest(new { message = "Bu kullanıcıyı zaten takip ediyorsunuz." });

        var newFollow = new UserFollow { FollowerId = followerId, FollowedId = followedId };
        _context.UserFollows.Add(newFollow);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Kullanıcı başarıyla takip edildi." });
    }

    // 2. TAKİPTEN ÇIK SERVİSİ
   
    [HttpDelete("{followerId}/unfollow/{followedId}")]
    public async Task<IActionResult> UnfollowUser(int followerId, int followedId)
    {
        var followRelation = await _context.UserFollows
            .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowedId == followedId);

        if (followRelation == null)
            return NotFound(new { message = "Böyle bir takip ilişkisi bulunamadı." });

        _context.UserFollows.Remove(followRelation);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Takipten çıkıldı." });
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

    // 3. KULLANICI ARAMA / FİLTRELEME SERVİSİ (Ağ ve Keşfet Görevi)
    
    [HttpGet("search")]
    public async Task<IActionResult> SearchUsers([FromQuery] string keyword)
    {
        if (string.IsNullOrWhiteSpace(keyword))
            return BadRequest("Lütfen aranacak bir kelime girin.");

        int currentUserId = GetCurrentUserId();
        var keywordLower = keyword.ToLower();
        
        var users = await _context.Users
            .Where(u => u.Id != currentUserId && (
                        u.Email.ToLower().Contains(keywordLower) || 
                        (u.FirstName != null && u.FirstName.ToLower().Contains(keywordLower)) ||
                        (u.LastName != null && u.LastName.ToLower().Contains(keywordLower)) ||
                        (u.UserName != null && u.UserName.ToLower().Contains(keywordLower))))
            .Select(u => new { 
                u.Id, 
                FirstName = u.FirstName, 
                LastName = u.LastName, 
                UserName = u.UserName,
                Email = u.Email, 
                Role = u.Role,
                AvatarUrl = u.AvatarUrl
            })
            .Take(10)
            .ToListAsync();

        return Ok(users);
    }
}