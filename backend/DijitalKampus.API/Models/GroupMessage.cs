using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DijitalKampus.API.Models;

public class GroupMessage
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int GroupId { get; set; }

    [ForeignKey(nameof(GroupId))]
    public Group Group { get; set; } = null!;

    [Required]
    public int SenderId { get; set; }

    [ForeignKey(nameof(SenderId))]
    public User Sender { get; set; } = null!;

    [Required]
    public string Content { get; set; } = string.Empty;

    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    public DateTime? DeletedAt { get; set; }
}
