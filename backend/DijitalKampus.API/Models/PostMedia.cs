using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DijitalKampus.API.Models;

public class PostMedia
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int PostId { get; set; }

    [Required]
    public string Url { get; set; } = string.Empty;

    [ForeignKey(nameof(PostId))]
    public Post Post { get; set; } = null!;
}