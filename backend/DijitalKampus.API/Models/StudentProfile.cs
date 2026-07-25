using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DijitalKampus.API.Models
{
    public class StudentProfile
    {
        [Key, ForeignKey(nameof(User))]
        public int UserId { get; set; }

        [Required]
        public int DepartmentId { get; set; }

        
        public string? Grade { get; set; } 
        public string? TargetSector { get; set; } 
        public string? TargetPosition { get; set; } 
        
        
        public string? Biography { get; set; } 

        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;

        [ForeignKey(nameof(DepartmentId))]
        public Department Department { get; set; } = null!;
    }
}