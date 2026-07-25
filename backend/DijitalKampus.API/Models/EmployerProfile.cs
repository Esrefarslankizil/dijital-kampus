using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DijitalKampus.API.Models
{
    public class EmployerProfile
    {
        [Key, ForeignKey(nameof(User))]
        public int UserId { get; set; }

        [Required]
        public string CompanyName { get; set; } = string.Empty;

        
        [Required]
        public string Sector { get; set; } = string.Empty;

        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;
    }
}