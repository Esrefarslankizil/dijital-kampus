using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DijitalKampus.API.Models;

public class Message
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public int ConversationId { get; set; }
    
    [ForeignKey("ConversationId")]
    public Conversation Conversation { get; set; } = null!;
    
    [Required]
    public int SenderId { get; set; }
    
    [ForeignKey("SenderId")]
    public User Sender { get; set; } = null!;
    
    [Required]
    public string Content { get; set; } = string.Empty;
    
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    
    public bool IsRead { get; set; } = false;
    
    public DateTime? DeletedAt { get; set; }
}
