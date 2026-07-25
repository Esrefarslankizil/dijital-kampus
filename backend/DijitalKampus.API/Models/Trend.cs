using System;
using System.ComponentModel.DataAnnotations;

namespace DijitalKampus.API.Models;

public class Trend
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Category { get; set; } = string.Empty; // Akademik, Etkinlik, Spor vb.

    [Required]
    [MaxLength(200)]
    public string Topic { get; set; } = string.Empty; // #VizeHaftası, #BaharŞenliği vb.

    public int PostCount { get; set; } = 0; // 1245 Gönderi
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
