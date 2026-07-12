using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DijitalKampus.API.Models;

public class Post
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    public string? Content { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    public ICollection<PostMedia> PostMedias { get; set; } = new List<PostMedia>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<PostLike> PostLikes { get; set; } = new List<PostLike>();
}