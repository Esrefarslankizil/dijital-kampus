using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DijitalKampus.API.Models
{
    public class Project
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int StudentProfileId { get; set; } // Hangi öğrenciye ait olduğunu tutar

        [Required]
        public string Title { get; set; } = string.Empty;

        public string? Link { get; set; }

        public string? Description { get; set; }

        // Yeni Sisteme Uygun Bağlantı Köprüsü
        [ForeignKey(nameof(StudentProfileId))]
        public StudentProfile? StudentProfile { get; set; }
    }
}