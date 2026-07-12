using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DijitalKampus.API.Models;

public class EventAttendance
{
    [Required]
    public int EventId { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    public string Status { get; set; } = string.Empty; // Katılacak, Belki, Katılmayacak

    [ForeignKey(nameof(EventId))]
    public Event Event { get; set; } = null!;

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
}