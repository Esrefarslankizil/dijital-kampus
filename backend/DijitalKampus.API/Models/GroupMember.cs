using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DijitalKampus.API.Models;

public class GroupMember
{
    [Key]
    public int Id { get; set; }

    public int GroupId { get; set; }
    public int UserId { get; set; }

    public string Role { get; set; } = "Uye"; // Yonetici, Uye
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(GroupId))]
    public Group Group { get; set; } = null!;

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
}
