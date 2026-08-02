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

    [HttpGet("pending-events")]
    public async Task<IActionResult> GetPendingEvents()
    {
        var events = await _context.Events.Include(e => e.Organizer)
            .Where(e => !e.IsApproved && e.DeletedAt == null)
            .Select(e => new { 
                e.Id, 
                e.Title, 
                e.Description, 
                Organizer = string.IsNullOrEmpty(e.Organizer.FirstName) ? e.Organizer.Email : e.Organizer.FirstName + " " + e.Organizer.LastName,
                OrganizerEmail = e.Organizer.Email,
                Role = e.Organizer.Role,
                e.CreatedAt 
            })
            .ToListAsync();
        return Ok(events);
    }

    [HttpPost("events/{id}/approve")]
    public async Task<IActionResult> ApproveEvent(int id)
    {
        var e = await _context.Events.FindAsync(id);
        if (e == null) return NotFound();
        e.IsApproved = true;
        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("events/{id}")]
    public async Task<IActionResult> DeleteEvent(int id)
    {
        var e = await _context.Events.FindAsync(id);
        if (e == null) return NotFound();
        _context.Events.Remove(e);
        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("pending-groups")]
    public async Task<IActionResult> GetPendingGroups()
    {
        var groups = await _context.Groups.Include(g => g.Creator)
            .Where(g => !g.IsApproved && g.DeletedAt == null)
            .Select(g => new { 
                g.Id, 
                g.Name, 
                g.Description, 
                Creator = string.IsNullOrEmpty(g.Creator.FirstName) ? g.Creator.Email : g.Creator.FirstName + " " + g.Creator.LastName,
                CreatorEmail = g.Creator.Email,
                Role = g.Creator.Role,
                g.CreatedAt 
            })
            .ToListAsync();
        return Ok(groups);
    }

    [HttpPost("groups/{id}/approve")]
    public async Task<IActionResult> ApproveGroup(int id)
    {
        var g = await _context.Groups.FindAsync(id);
        if (g == null) return NotFound();
        g.IsApproved = true;
        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("groups/{id}")]
    public async Task<IActionResult> DeleteGroup(int id)
    {
        var g = await _context.Groups.FindAsync(id);
        if (g == null) return NotFound();
        _context.Groups.Remove(g);
        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("posts")]
    public async Task<IActionResult> GetAllPosts()
    {
        var posts = await _context.Posts
            .Include(p => p.User)
            .Include(p => p.PostMedias)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new { 
                p.Id, 
                p.Content, 
                Author = string.IsNullOrEmpty(p.User.FirstName) ? p.User.Email : p.User.FirstName + " " + p.User.LastName,
                AuthorEmail = p.User.Email,
                Role = p.User.Role,
                p.CreatedAt,
                MediaCount = p.PostMedias.Count
            })
            .ToListAsync();
        return Ok(posts);
    }

    [HttpDelete("posts/{id}")]
    public async Task<IActionResult> DeletePost(int id)
    {
        var p = await _context.Posts.FindAsync(id);
        if (p == null) return NotFound();
        _context.Posts.Remove(p);
        await _context.SaveChangesAsync();
        return Ok();
    }
}

public class ToggleStatusRequest
{
    public string Action { get; set; } = string.Empty; // APPROVE, DEACTIVATE, ACTIVATE
}
