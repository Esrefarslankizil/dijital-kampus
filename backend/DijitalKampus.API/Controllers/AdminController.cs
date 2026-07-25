using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DijitalKampus.API.Data;
using DijitalKampus.API.Models;

namespace DijitalKampus.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdminController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var totalUsers = await _context.Users.CountAsync();
        var totalPosts = await _context.Posts.CountAsync();
        var totalStories = await _context.Stories.CountAsync();
        var activeUsers = await _context.Users.CountAsync(u => u.DeletedAt == null && u.IsApproved);
        
        return Ok(new {
            TotalUsers = totalUsers,
            TotalPosts = totalPosts,
            TotalStories = totalStories,
            ActiveUsers = activeUsers
        });
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        // Ignoring query filters to get even deleted users
        var users = await _context.Users.IgnoreQueryFilters()
            .Select(u => new {
                u.Id,
                u.Email,
                u.Role,
                u.CreatedAt,
                u.IsApproved,
                IsActive = u.DeletedAt == null
            })
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();
        
        return Ok(users);
    }

    [HttpPost("users/{id}/toggle-status")]
    public async Task<IActionResult> ToggleUserStatus(int id, [FromBody] ToggleStatusRequest request)
    {
        var adminEmail = "admin@kampus.com"; // This should come from User.Identity.Name in a real JWT setup

        var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound("Kullanıcı bulunamadı.");

        if (request.Action == "APPROVE")
        {
            user.IsApproved = true;
            _context.AuditLogs.Add(new AuditLog { AdminEmail = adminEmail, Action = "USER_APPROVED", TargetUserId = user.Id, Details = $"{user.Email} onaylandı." });
        }
        else if (request.Action == "DEACTIVATE")
        {
            user.DeletedAt = DateTime.UtcNow;
            _context.AuditLogs.Add(new AuditLog { AdminEmail = adminEmail, Action = "USER_DEACTIVATED", TargetUserId = user.Id, Details = $"{user.Email} pasife alındı." });
        }
        else if (request.Action == "ACTIVATE")
        {
            user.DeletedAt = null;
            _context.AuditLogs.Add(new AuditLog { AdminEmail = adminEmail, Action = "USER_ACTIVATED", TargetUserId = user.Id, Details = $"{user.Email} aktifleştirildi." });
        }
        
        await _context.SaveChangesAsync();
        return Ok(new { message = "Kullanıcı durumu güncellendi." });
    }

    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs()
    {
        var logs = await _context.AuditLogs
            .OrderByDescending(l => l.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(logs);
    }
}

public class ToggleStatusRequest
{
    public string Action { get; set; } = string.Empty; // APPROVE, DEACTIVATE, ACTIVATE
}
