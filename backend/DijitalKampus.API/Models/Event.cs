using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DijitalKampus.API.Models;

public class Event
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int OrganizerId { get; set; }

    [Required]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public DateTime EventDate { get; set; }
    public DateTime? EndDate { get; set; }

    [Required]
    public string Location { get; set; } = string.Empty;

    [Required]
    public string EventType { get; set; } = string.Empty; // Seminer, Atölye...

    public int? MaxParticipants { get; set; }

    public string? ImagePath { get; set; }  // Yuklenen gorsel yolu
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }
    public bool IsApproved { get; set; } = false;

    [ForeignKey(nameof(OrganizerId))]
    public User Organizer { get; set; } = null!;

    public ICollection<EventAttendance> Attendances { get; set; } = new List<EventAttendance>();
}