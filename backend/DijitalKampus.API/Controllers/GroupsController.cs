using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DijitalKampus.API.Models;
using DijitalKampus.API.Data;

namespace DijitalKampus.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class GroupsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public GroupsController(ApplicationDbContext context)
    {
        _context = context;
    }
 
    // GET: api/groups?category=Sosyal&search=yazilim      
    [HttpGet]
    public async Task<IActionResult> GetGroups([FromQuery] string? category, [FromQuery] string? search)
    {
        var query = _context.Groups
            .Where(g => g.DeletedAt == null && g.IsApproved);

        if (!string.IsNullOrWhiteSpace(category) && category != "all")
            query = query.Where(g => g.Category == category);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(g => g.Name.Contains(search) || (g.Description != null && g.Description.Contains(search)));

        var groups = await query
            .OrderByDescending(g => g.Members.Count)
            .Select(g => new
            {
                g.Id,
                g.Name,
                g.Description,
                g.Category,
                g.ImageUrl,
                g.CreatedAt,
                MemberCount = g.Members.Count
            })
            .ToListAsync();

        return Ok(groups);
    }

    // GET: api/groups/my?userId=1
    [HttpGet("my")]
    public async Task<IActionResult> GetMyGroups([FromQuery] int userId)
    {
        var myGroups = await _context.GroupMembers
            .Where(gm => gm.UserId == userId)
            .Where(gm => gm.Group.DeletedAt == null && gm.Group.IsApproved)
            .Select(gm => new
            {
                gm.Group.Id,
                gm.Group.Name,
                gm.Group.Description,
                gm.Group.Category,
                gm.Group.ImageUrl,
                gm.Role,
                MemberCount = gm.Group.Members.Count
            })
            .ToListAsync();

        return Ok(myGroups);
    }

    // POST: api/groups
    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> CreateGroup([FromForm] CreateGroupFormRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Grup adi bos olamaz." });

        string? imagePath = null;
        if (request.Image != null && request.Image.Length > 0)
        {
            var env = HttpContext.RequestServices.GetService<IWebHostEnvironment>();
            var uploadsDir = Path.Combine(env?.WebRootPath ?? "wwwroot", "uploads", "groups");
            Directory.CreateDirectory(uploadsDir);
            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(request.Image.FileName)}";
            var filePath = Path.Combine(uploadsDir, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
                await request.Image.CopyToAsync(stream);
            imagePath = $"/uploads/groups/{fileName}";
        }

        var group = new Group
        {
            Name = request.Name,
            Description = request.Description,
            Category = request.Category ?? "Sosyal",
            ImageUrl = imagePath,
            CreatorId = request.CreatorId > 0 ? request.CreatorId : 1,
            CreatedAt = DateTime.UtcNow,
            IsApproved = true // Otomatik onay
        };

        _context.Groups.Add(group);
        await _context.SaveChangesAsync();

        // Kurucuyu otomatik Yonetici yap
        _context.GroupMembers.Add(new GroupMember
        {
            GroupId = group.Id,
            UserId = group.CreatorId,
            Role = "Yonetici"
        });
        await _context.SaveChangesAsync();

        return Ok(new { group.Id, group.Name, group.Category, group.ImageUrl, MemberCount = 1, Role = "Yonetici" });
    }

    // POST: api/groups/{id}/join
    [HttpPost("{id}/join")]
    public async Task<IActionResult> JoinGroup(int id, [FromBody] GroupActionRequest request)
    {
        var group = await _context.Groups.FindAsync(id);
        if (group == null || group.DeletedAt != null)
            return NotFound(new { message = "Grup bulunamadi." });

        var existing = await _context.GroupMembers.FirstOrDefaultAsync(gm => gm.GroupId == id && gm.UserId == request.UserId);
        if (existing != null)
            return Conflict(new { message = "Zaten bu grubun uyesisiniz." });

        _context.GroupMembers.Add(new GroupMember { GroupId = id, UserId = request.UserId, Role = "Uye" });
        await _context.SaveChangesAsync();

        var count = await _context.GroupMembers.CountAsync(gm => gm.GroupId == id);
        return Ok(new { message = "Gruba katildiniz.", memberCount = count });
    }

    // DELETE: api/groups/{id}/leave
    [HttpDelete("{id}/leave")]
    public async Task<IActionResult> LeaveGroup(int id, [FromBody] GroupActionRequest request)
    {
        var membership = await _context.GroupMembers.FirstOrDefaultAsync(gm => gm.GroupId == id && gm.UserId == request.UserId);
        if (membership == null)
            return NotFound(new { message = "Uyelik kaydi bulunamadi." });

        _context.GroupMembers.Remove(membership);
        await _context.SaveChangesAsync();

        var count = await _context.GroupMembers.CountAsync(gm => gm.GroupId == id);
        return Ok(new { message = "Gruptan ayrildiniz.", memberCount = count });
    }

    // DELETE: api/groups/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteGroup(int id)
    {
        var group = await _context.Groups.FindAsync(id);
        if (group == null) return NotFound(new { message = "Grup bulunamadi." });
        group.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Grup silindi." });
    }
}

public class CreateGroupRequest
{
    public int CreatorId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string? ImageUrl { get; set; }
}

public class CreateGroupFormRequest
{
    public int CreatorId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Category { get; set; }
    public IFormFile? Image { get; set; }
}

public class GroupActionRequest
{
    public int UserId { get; set; }
}
