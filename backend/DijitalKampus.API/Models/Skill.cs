using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace DijitalKampus.API.Models;

public class Skill
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty; // Python, React, C#

    public ICollection<UserSkill> UserSkills { get; set; } = new List<UserSkill>();
}