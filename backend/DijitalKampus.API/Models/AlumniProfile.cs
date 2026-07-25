using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DijitalKampus.API.Models
{
    public class AlumniProfile
    {
        [Key, ForeignKey(nameof(User))]
        public int UserId { get; set; }

        [Required]
        public int DepartmentId { get; set; }

        [Required]
        public int GraduationYear { get; set; }

        [Required]
        public string CurrentCompany { get; set; } = string.Empty;

        [Required]
        public string FieldOfWork { get; set; } = string.Empty;

        
        [Required]
        public string CurrentPosition { get; set; } = string.Empty;

        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;

        [ForeignKey(nameof(DepartmentId))]
        public Department Department { get; set; } = null!;
    }
}