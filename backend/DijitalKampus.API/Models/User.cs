using System;
using System.ComponentModel.DataAnnotations;

namespace DijitalKampus.API.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        public string? PasswordHash { get; set; }

        [Required]
        public string Role { get; set; } = string.Empty; // Admin, Student, Alumni, Employer

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? DeletedAt { get; set; }

        // ---- Navigation Properties ----
        public StudentProfile? StudentProfile { get; set; }
        public AlumniProfile? AlumniProfile { get; set; }
        public EmployerProfile? EmployerProfile { get; set; }

        public ICollection<UserToken> UserTokens { get; set; } = new List<UserToken>();
        public ICollection<UserSkill> UserSkills { get; set; } = new List<UserSkill>();
        public ICollection<Post> Posts { get; set; } = new List<Post>();
        public ICollection<Story> Stories { get; set; } = new List<Story>();
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public ICollection<PostLike> PostLikes { get; set; } = new List<PostLike>();
        public ICollection<Event> OrganizedEvents { get; set; } = new List<Event>();
        public ICollection<EventAttendance> EventAttendances { get; set; } = new List<EventAttendance>();
        public ICollection<UserFollow> Followers { get; set; } = new List<UserFollow>();
        public ICollection<UserFollow> FollowedUsers { get; set; } = new List<UserFollow>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    }
}