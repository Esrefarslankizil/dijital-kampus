using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DijitalKampus.API.Models;

public class Comment
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int PostId { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    public string Content { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(PostId))]
    public Post Post { get; set; } = null!;

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
}