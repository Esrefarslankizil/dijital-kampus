using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DijitalKampus.API.Models;

public class UserFollow
{
    [Required]
    public int FollowerId { get; set; }

    [Required]
    public int FollowedId { get; set; }

    [ForeignKey(nameof(FollowerId))]
    public User Follower { get; set; } = null!;

    [ForeignKey(nameof(FollowedId))]
    public User Followed { get; set; } = null!;
}