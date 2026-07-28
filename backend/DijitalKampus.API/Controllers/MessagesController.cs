using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DijitalKampus.API.Data;
using DijitalKampus.API.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace DijitalKampus.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class MessagesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public MessagesController(ApplicationDbContext context)
    {
        _context = context;
    }

    // Kullanıcının sohbet listesini getirir
    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations()
    {
        int userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();

        var conversations = await _context.ConversationParticipants
            .Where(cp => cp.UserId == userId)
            .Select(cp => new
            {
                cp.Conversation.Id,
                cp.Conversation.IsGroup,
                Title = cp.Conversation.IsGroup ? cp.Conversation.Title : 
                        cp.Conversation.Participants.FirstOrDefault(p => p.UserId != userId)!.User.Email, // Birebir sohbette karşı tarafın adı/emaili
                cp.Conversation.LastMessageAt,
                cp.HasMuted,
                UnreadCount = cp.Conversation.Messages.Count(m => m.SenderId != userId && !m.IsRead)
            })
            .OrderByDescending(c => c.LastMessageAt)
            .ToListAsync();

        return Ok(conversations);
    }

    // Belirli bir sohbetin mesaj geçmişini getirir
    [HttpGet("{conversationId}/history")]
    public async Task<IActionResult> GetMessageHistory(int conversationId, [FromQuery] int page = 1, [FromQuery] int limit = 50)
    {
        int userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();

        // Kullanıcının bu sohbette olup olmadığını kontrol et
        var isParticipant = await _context.ConversationParticipants
            .AnyAsync(cp => cp.ConversationId == conversationId && cp.UserId == userId);

        if (!isParticipant)
            return Forbid();

        var messages = await _context.Messages
            .Where(m => m.ConversationId == conversationId)
            .OrderByDescending(m => m.SentAt) // Önce en yeniler
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(m => new
            {
                m.Id,
                m.SenderId,
                SenderEmail = m.Sender.Email,
                m.Content,
                m.SentAt,
                m.IsRead
            })
            .ToListAsync();

        return Ok(messages.OrderBy(m => m.SentAt)); // UI'da göstermek için kronolojik sıraya çevir
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

    // Yeni bir birebir sohbet başlatır
    [HttpPost("start/{targetUserId}")]
    public async Task<IActionResult> StartConversation(int targetUserId)
    {
        int userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();

        if (userId == targetUserId) return BadRequest("Kendinizle mesajlaşamazsınız.");

        // İkisi arasında halihazırda birebir sohbet var mı kontrolü
        var existingConversationId = await _context.Conversations
            .Where(c => !c.IsGroup)
            .Where(c => c.Participants.Any(p => p.UserId == userId) && c.Participants.Any(p => p.UserId == targetUserId))
            .Select(c => c.Id)
            .FirstOrDefaultAsync();

        if (existingConversationId > 0)
        {
            return Ok(new { ConversationId = existingConversationId });
        }

        // Yoksa yeni oluştur
        var newConversation = new Conversation
        {
            IsGroup = false,
            CreatedAt = DateTime.UtcNow,
            LastMessageAt = DateTime.UtcNow,
            Participants = new List<ConversationParticipant>
            {
                new ConversationParticipant { UserId = userId },
                new ConversationParticipant { UserId = targetUserId }
            }
        };

        _context.Conversations.Add(newConversation);
        await _context.SaveChangesAsync();

        return Ok(new { ConversationId = newConversation.Id });
    }
}
