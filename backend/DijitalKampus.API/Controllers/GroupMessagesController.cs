using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DijitalKampus.API.Data;
using DijitalKampus.API.Models;

namespace DijitalKampus.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GroupMessagesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public GroupMessagesController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/groupmessages/{groupId}
    [HttpGet("{groupId}")]
    public async Task<IActionResult> GetGroupMessages(int groupId)
    {
        var messages = await _context.GroupMessages
            .Where(m => m.GroupId == groupId && m.DeletedAt == null)
            .OrderBy(m => m.SentAt) // Eski mesajlar üstte
            .Include(m => m.Sender)
            .Select(m => new
            {
                m.Id,
                m.GroupId,
                m.SenderId,
                SenderName = (m.Sender.FirstName != null && m.Sender.LastName != null) 
                             ? $"{m.Sender.FirstName} {m.Sender.LastName}" 
                             : m.Sender.UserName,
                SenderAvatar = m.Sender.AvatarUrl,
                m.Content,
                m.SentAt
            })
            .ToListAsync();

        return Ok(messages);
    }

    // POST: api/groupmessages
    [HttpPost]
    public async Task<IActionResult> SendGroupMessage([FromBody] SendGroupMessageDto dto)
    {
        // Grup veya üyelik kontrolü (opsiyonel ancak tavsiye edilir)
        var isMember = await _context.GroupMembers
            .AnyAsync(gm => gm.GroupId == dto.GroupId && gm.UserId == dto.SenderId);

        // Kurucusu ise her halükarda girebilir
        var isCreator = await _context.Groups
            .AnyAsync(g => g.Id == dto.GroupId && g.CreatorId == dto.SenderId);

        if (!isMember && !isCreator)
            return Forbid(); // Sadece grup üyeleri ve kurucusu mesaj gönderebilir

        var message = new GroupMessage
        {
            GroupId = dto.GroupId,
            SenderId = dto.SenderId,
            Content = dto.Content,
            SentAt = DateTime.UtcNow
        };

        _context.GroupMessages.Add(message);
        await _context.SaveChangesAsync();

        // Gruptaki diğer üyelere bildirim gönder (Sadece basit bir örnek, büyük gruplarda asenkron job veya SignalR tercih edilmelidir)
        var senderUser = await _context.Users.FindAsync(dto.SenderId);
        var senderName = (senderUser?.FirstName != null && senderUser?.LastName != null) 
                         ? $"{senderUser.FirstName} {senderUser.LastName}" 
                         : senderUser?.UserName ?? "Biri";

        var group = await _context.Groups.FindAsync(dto.GroupId);
        var groupName = group?.Name ?? "Gruba";

        // Gruptaki diğer üyeleri bul
        var otherMembers = await _context.GroupMembers
            .Where(gm => gm.GroupId == dto.GroupId && gm.UserId != dto.SenderId)
            .Select(gm => gm.UserId)
            .ToListAsync();
            
        // Kurucu grupta bir GroupMember kaydı olmayabilir, kontrol edelim
        if (group?.CreatorId != dto.SenderId && group != null && !otherMembers.Contains(group.CreatorId))
        {
            otherMembers.Add(group.CreatorId);
        }

        var notifications = otherMembers.Select(userId => new Notification
        {
            UserId = userId,
            Content = $"{senderName}, {groupName} grubuna yeni bir mesaj gönderdi."
        }).ToList();

        if (notifications.Any())
        {
            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync();
        }

        // Geri dönerken yollayan kişinin bilgilerini de verelim ki UI anında güncellensin
        var sender = await _context.Users.FindAsync(dto.SenderId);
        
        return Ok(new
        {
            message.Id,
            message.GroupId,
            message.SenderId,
            SenderName = (sender?.FirstName != null && sender?.LastName != null) 
                         ? $"{sender.FirstName} {sender.LastName}" 
                         : sender?.UserName,
            SenderAvatar = sender?.AvatarUrl,
            message.Content,
            message.SentAt
        });
    }
}

public class SendGroupMessageDto
{
    public int GroupId { get; set; }
    public int SenderId { get; set; }
    public string Content { get; set; } = string.Empty;
}
