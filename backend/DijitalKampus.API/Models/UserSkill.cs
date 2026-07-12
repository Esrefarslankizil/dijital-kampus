using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DijitalKampus.API.Models;

public class UserSkill
{
    [Required]
    public int UserId { get; set; }

    [Required]
    public int SkillId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    [ForeignKey(nameof(SkillId))]
    public Skill Skill { get; set; } = null!;
}