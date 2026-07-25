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
            return BadRequest("Kendinizi takip edemezsiniz.");

        // Kullanıcılar gerçekten var mı kontrolü
        var followerExists = await _context.Users.AnyAsync(u => u.Id == followerId);
        var followedExists = await _context.Users.AnyAsync(u => u.Id == followedId);

        if (!followerExists || !followedExists)
            return NotFound("Kullanıcılardan biri bulunamadı.");

        // Zaten takip ediyor mu kontrolü
        var alreadyFollowing = await _context.UserFollows
            .AnyAsync(f => f.FollowerId == followerId && f.FollowedId == followedId);

        if (alreadyFollowing)
            return BadRequest("Bu kullanıcıyı zaten takip ediyorsunuz.");

        var newFollow = new UserFollow { FollowerId = followerId, FollowedId = followedId };
        _context.UserFollows.Add(newFollow);
        await _context.SaveChangesAsync();

        return Ok("Kullanıcı başarıyla takip edildi.");
    }

    // 2. TAKİPTEN ÇIK SERVİSİ
   
    [HttpDelete("{followerId}/unfollow/{followedId}")]
    public async Task<IActionResult> UnfollowUser(int followerId, int followedId)
    {
        var followRelation = await _context.UserFollows
            .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowedId == followedId);

        if (followRelation == null)
            return NotFound("Böyle bir takip ilişkisi bulunamadı.");

        _context.UserFollows.Remove(followRelation);
        await _context.SaveChangesAsync();

        return Ok("Takipten çıkıldı.");
    }

    // 3. KULLANICI ARAMA / FİLTRELEME SERVİSİ (Ağ ve Keşfet Görevi)
    
    [HttpGet("search")]
    public async Task<IActionResult> SearchUsers([FromQuery] string keyword)
    {
        if (string.IsNullOrWhiteSpace(keyword))
            return BadRequest("Lütfen aranacak bir kelime girin.");

     
        var users = await _context.Users
            .Where(u => u.Email.Contains(keyword))
            .Select(u => new { u.Id, FirstName = u.Email, LastName = "", u.Email, u.Role })
            .ToListAsync();

        return Ok(users);
    }
}