using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using DijitalKampus.API.Data;
using DijitalKampus.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DijitalKampus.API.Hubs;

public class ChatHub : Hub
{
    private readonly ApplicationDbContext _context;

    public ChatHub(ApplicationDbContext context)
    {
        _context = context;
    }

    private int GetUserId()
    {
        var httpContext = Context.GetHttpContext();
        var token = httpContext?.Request.Query["access_token"].ToString();
        if (string.IsNullOrEmpty(token))
        {
            var authHeader = httpContext?.Request.Headers["Authorization"].ToString();
            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
                token = authHeader.Substring("Bearer ".Length);
        }

        if (!string.IsNullOrEmpty(token) && token.StartsWith("dummy-jwt-token-"))
        {
            if (int.TryParse(token.Replace("dummy-jwt-token-", ""), out int id))
                return id;
        }
        return 0;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        if (userId > 0)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
        await base.OnConnectedAsync();
    }

    public async Task SendMessage(int conversationId, string content)
    {
        int senderId = GetUserId();
        if (senderId <= 0)
            throw new HubException("Unauthorized");

        // Konuşmanın varlığını ve kullanıcının yetkisini kontrol et
        var participant = await _context.ConversationParticipants
            .FirstOrDefaultAsync(cp => cp.ConversationId == conversationId && cp.UserId == senderId);

        if (participant == null)
            throw new HubException("Bu sohbete mesaj gönderme yetkiniz yok.");

        // Mesajı oluştur ve DB'ye kaydet
        var message = new Message
        {
            ConversationId = conversationId,
            SenderId = senderId,
            Content = content,
            SentAt = DateTime.UtcNow,
            IsRead = false
        };

        _context.Messages.Add(message);
        
        var conversation = await _context.Conversations.FindAsync(conversationId);
        if(conversation != null)
        {
            conversation.LastMessageAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Sohbetin diğer üyelerine mesajı ilet
        var otherParticipants = await _context.ConversationParticipants
            .Where(cp => cp.ConversationId == conversationId)
            .Select(cp => cp.UserId)
            .ToListAsync();

        var senderUser = await _context.Users.FindAsync(senderId);
        string senderName = senderUser != null 
            ? (!string.IsNullOrWhiteSpace(senderUser.FirstName) ? $"{senderUser.FirstName} {senderUser.LastName}" : senderUser.UserName) 
            : "Biri";

        foreach (var userId in otherParticipants)
        {
            if (userId != senderId)
            {
                var notification = new Notification
                {
                    UserId = userId,
                    Content = $"{senderName} sana bir mesaj gönderdi."
                };
                _context.Notifications.Add(notification);
            }

            // Mesajı herkese (kendisi dahil) ilet ki UI güncellensin
            await Clients.Group($"user_{userId}").SendAsync("ReceiveMessage", new 
            {
                Id = message.Id,
                ConversationId = message.ConversationId,
                SenderId = message.SenderId,
                SenderEmail = senderUser?.Email ?? "",
                Content = message.Content,
                SentAt = message.SentAt
            });
        }
        await _context.SaveChangesAsync();
    }
}
