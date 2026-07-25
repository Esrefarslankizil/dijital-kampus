using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace DijitalKampus.API.Models
{    
    public class User : IdentityUser<int> // <int> user ID nin guid yerine 1 2 3 diye artması için kullanılır. 
    {
        

        [Required]
        public string Role { get; set; } = string.Empty; // Admin, Student, Alumni, Employer

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? DeletedAt { get; set; }
        public bool IsApproved { get; set; } = true;

        // ---- Navigation Properties ----  // User tablosu ve diğer rol tabloları arası join işlemi için köptrü 
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