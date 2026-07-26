using System.ComponentModel.DataAnnotations;

namespace DijitalKampus.API.Models;

public class Conversation
{
    [Key]
    public int Id { get; set; }
    
    // Birebir mi, yoksa grup mu olduğunu belirtir.
    public bool IsGroup { get; set; } = false;
    
    // Eğer grup ise başlığı olabilir. Birebir mesajlaşmada null'dır.
    [MaxLength(100)]
    public string? Title { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? DeletedAt { get; set; }

    // Navigation Properties
    public ICollection<ConversationParticipant> Participants { get; set; } = new List<ConversationParticipant>();
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}
