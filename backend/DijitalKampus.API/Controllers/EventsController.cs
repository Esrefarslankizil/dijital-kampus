using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DijitalKampus.API.Models;
using DijitalKampus.API.Data;

namespace DijitalKampus.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class EventsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _env;

    public EventsController(ApplicationDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    // GET: api/events
    [HttpGet]
    public async Task<IActionResult> GetEvents([FromQuery] string? category, [FromQuery] string? search, [FromQuery] int userId = 0)
    {
        var query = _context.Events
            .Where(e => e.DeletedAt == null && e.IsApproved);

        if (!string.IsNullOrWhiteSpace(category) && category != "all")
            query = query.Where(e => e.EventType == category);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(e => e.Title.Contains(search) || e.Location.Contains(search));

        var events = await query
            .OrderBy(e => e.EventDate)
            .Select(e => new
            {
                e.Id,
                e.Title,
                e.Description,
                e.EventDate,
                e.EndDate,
                e.Location,
                e.EventType,
                e.MaxParticipants,
                e.ImagePath,
                e.CreatedAt,
                e.OrganizerId,
                OrganizerEmail = e.Organizer != null ? e.Organizer.Email : "Bilinmiyor",
                AttendeeCount = e.Attendances.Count,
                IsFull = e.MaxParticipants.HasValue && e.Attendances.Count >= e.MaxParticipants.Value,
                IsAttending = userId > 0 && e.Attendances.Any(a => a.UserId == userId)
            })
            .ToListAsync();

        return Ok(events);
    }

    // GET: api/events/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetEvent(int id)
    {
        var ev = await _context.Events
            .Where(e => e.Id == id && e.DeletedAt == null)
            .Select(e => new
            {
                e.Id,
                e.Title,
                e.Description,
                e.EventDate,
                e.EndDate,
                e.Location,
                e.EventType,
                e.MaxParticipants,
                e.ImagePath,
                e.OrganizerId,
                OrganizerEmail = e.Organizer != null ? e.Organizer.Email : "Bilinmiyor",
                AttendeeCount = e.Attendances.Count,
                IsFull = e.MaxParticipants.HasValue && e.Attendances.Count >= e.MaxParticipants.Value
            })
            .FirstOrDefaultAsync();

        if (ev == null) return NotFound(new { message = "Etkinlik bulunamadi." });
        return Ok(ev);
    }

    // POST: api/events  (multipart/form-data ile gorsel + JSON alani)
    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> CreateEvent([FromForm] CreateEventFormRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(new { message = "Etkinlik basligi bos olamaz." });

        string? imagePath = null;

        // Gorsel yukleme
        if (request.Image != null && request.Image.Length > 0)
        {
            var uploadsDir = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", "events");
            Directory.CreateDirectory(uploadsDir);
            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(request.Image.FileName)}";
            var filePath = Path.Combine(uploadsDir, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
                await request.Image.CopyToAsync(stream);
            imagePath = $"/uploads/events/{fileName}";
        }

        var newEvent = new Event
        {
            OrganizerId = request.OrganizerId > 0 ? request.OrganizerId : 1,
            Title = request.Title,
            Description = request.Description,
            EventDate = request.EventDate,
            EndDate = request.EndDate,
            Location = request.Location,
            EventType = request.EventType ?? "Genel",
            MaxParticipants = request.MaxParticipants,
            ImagePath = imagePath,
            CreatedAt = DateTime.UtcNow,
            IsApproved = true // Otomatik onay
        };

        _context.Events.Add(newEvent);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            newEvent.Id,
            newEvent.Title,
            newEvent.EventDate,
            newEvent.Location,
            newEvent.EventType,
            newEvent.ImagePath,
            AttendeeCount = 0,
            IsFull = false
        });
    }

    // POST: api/events/{id}/attend
    [HttpPost("{id}/attend")]
    public async Task<IActionResult> Attend(int id, [FromBody] AttendRequest request)
    {
        var ev = await _context.Events.Include(e => e.Attendances).FirstOrDefaultAsync(e => e.Id == id && e.DeletedAt == null);
        if (ev == null) return NotFound(new { message = "Etkinlik bulunamadi." });

        if (ev.EventDate < DateTime.UtcNow)
            return BadRequest(new { message = "Suresi gecmis etkinlige katilamazsiniz." });

        if (ev.MaxParticipants.HasValue && ev.Attendances.Count >= ev.MaxParticipants.Value)
            return BadRequest(new { message = "Kontenjan dolu." });

        var existing = await _context.EventAttendances.FirstOrDefaultAsync(a => a.EventId == id && a.UserId == request.UserId);
        if (existing != null) return Conflict(new { message = "Zaten katildiniz." });

        _context.EventAttendances.Add(new EventAttendance { EventId = id, UserId = request.UserId });
        await _context.SaveChangesAsync();

        return Ok(new { message = "Etkinlige katildiniz.", attendeeCount = ev.Attendances.Count + 1 });
    }

    // DELETE: api/events/{id}/attend
    [HttpDelete("{id}/attend")]
    public async Task<IActionResult> LeaveEvent(int id, [FromBody] AttendRequest request)
    {
        var attendance = await _context.EventAttendances.FirstOrDefaultAsync(a => a.EventId == id && a.UserId == request.UserId);
        if (attendance == null) return NotFound(new { message = "Katilim kaydi bulunamadi." });

        _context.EventAttendances.Remove(attendance);
        await _context.SaveChangesAsync();

        var count = await _context.EventAttendances.CountAsync(a => a.EventId == id);
        return Ok(new { message = "Etkinlikten ayrildiniz.", attendeeCount = count });
    }

    // DELETE: api/events/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEvent(int id)
    {
        var ev = await _context.Events.FindAsync(id);
        if (ev == null) return NotFound(new { message = "Etkinlik bulunamadi." });
        ev.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Etkinlik silindi." });
    }
}

public class CreateEventFormRequest
{
    public int OrganizerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime EventDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string Location { get; set; } = string.Empty;
    public string? EventType { get; set; }
    public int? MaxParticipants { get; set; }
    public IFormFile? Image { get; set; }
}

public class AttendRequest
{
    public int UserId { get; set; }
}
