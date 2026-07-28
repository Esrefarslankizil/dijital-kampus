using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DijitalKampus.API.Models;

public class Story
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    public string? MediaPath { get; set; }
    public string? TextContent { get; set; }
    public string? BackgroundColor { get; set; }
    public string? TextColor { get; set; }

    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
}