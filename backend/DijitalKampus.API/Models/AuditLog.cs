using System;
using System.ComponentModel.DataAnnotations;

namespace DijitalKampus.API.Models;

public class AuditLog
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string AdminEmail { get; set; } = string.Empty;

    [Required]
    public string Action { get; set; } = string.Empty; // e.g. "USER_DEACTIVATED"

    public int? TargetUserId { get; set; }

    public string Details { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
