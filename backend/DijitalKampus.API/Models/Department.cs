using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace DijitalKampus.API.Models;

public class Department
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    public ICollection<StudentProfile> StudentProfiles { get; set; } = new List<StudentProfile>();
    public ICollection<AlumniProfile> AlumniProfiles { get; set; } = new List<AlumniProfile>();
}