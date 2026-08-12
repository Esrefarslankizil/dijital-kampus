using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DijitalKampus.API.Data;
using DijitalKampus.API.Models;

namespace DijitalKampus.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public NotificationsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/notifications/{userId}
    [HttpGet("{userId}")]
    public async Task<IActionResult> GetNotifications(int userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50) // Son 50 bildirim
            .Select(n => new
            {
                n.Id,
                n.Content,
                n.IsRead,
                n.CreatedAt
            })
            .ToListAsync();

        return Ok(notifications);
    }

    // GET: api/notifications/unread/{userId}
    [HttpGet("unread/{userId}")]
    public async Task<IActionResult> GetUnreadCount(int userId)
    {
        var count = await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);

        return Ok(new { Count = count });
    }

    // PUT: api/notifications/{id}/read
    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var notification = await _context.Notifications.FindAsync(id);
        if (notification == null) return NotFound();

        notification.IsRead = true;
        await _context.SaveChangesAsync();

        return Ok(new { Success = true });
    }

    // PUT: api/notifications/readall/{userId}
    [HttpPut("readall/{userId}")]
    public async Task<IActionResult> MarkAllAsRead(int userId)
    {
        var unreadNotifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var n in unreadNotifications)
        {
            n.IsRead = true;
        }

        if (unreadNotifications.Any())
        {
            await _context.SaveChangesAsync();
        }

        return Ok(new { Success = true });
    }
}
