using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace DijitalKampus.API.Models;

public class Group
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    public string Category { get; set; } = "Sosyal"; // Sosyal, Akademik, Spor, Kariyer, Oyun

    public string? ImageUrl { get; set; } // Kapak gorseli URL

    [Required]
    public int CreatorId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }
    public bool IsApproved { get; set; } = false;

    [ForeignKey(nameof(CreatorId))]
    public User Creator { get; set; } = null!;

    public ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
}
