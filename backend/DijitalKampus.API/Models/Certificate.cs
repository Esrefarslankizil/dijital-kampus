using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DijitalKampus.API.Models
{
    public class Certificate
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int StudentProfileId { get; set; } // Hangi öğrenciye ait olduğunu tutar

        [Required]
        public string Name { get; set; } = string.Empty; // Frontend'den "React Bootcamp" gibi gelen veri

        // Yeni Sisteme Uygun Bağlantı Köprüsü (Hata vermemesi için ? eklendi)
        [ForeignKey(nameof(StudentProfileId))]
        public StudentProfile? StudentProfile { get; set; }
    }
}