using Microsoft.EntityFrameworkCore;
using DijitalKampus.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

namespace DijitalKampus.API.Data;

public class ApplicationDbContext : IdentityDbContext<User, IdentityRole<int>, int>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    // DbSet'ler
    public DbSet<UserToken> AppUserTokens => Set<UserToken>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<StudentProfile> StudentProfiles => Set<StudentProfile>();
    public DbSet<AlumniProfile> AlumniProfiles => Set<AlumniProfile>();
    public DbSet<EmployerProfile> EmployerProfiles => Set<EmployerProfile>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<UserSkill> UserSkills => Set<UserSkill>();
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<PostMedia> PostMedias => Set<PostMedia>();
    public DbSet<Story> Stories => Set<Story>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<PostLike> PostLikes => Set<PostLike>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<EventAttendance> EventAttendances => Set<EventAttendance>();
    public DbSet<UserFollow> UserFollows => Set<UserFollow>();
    public DbSet<Fotograf> Fotograflar => Set<Fotograf>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Certificate> Certificates => Set<Certificate>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User: email unique, soft delete filter
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasQueryFilter(u => u.DeletedAt == null);
        });

        // Bileşik anahtar (composite key) ve silme davranışları
        modelBuilder.Entity<UserSkill>(entity =>
        {
            entity.HasKey(us => new { us.UserId, us.SkillId });
        });

        modelBuilder.Entity<PostLike>(entity =>
        {
            entity.HasKey(pl => new { pl.PostId, pl.UserId });
            entity.HasOne(pl => pl.User)
                  .WithMany(u => u.PostLikes)
                  .HasForeignKey(pl => pl.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EventAttendance>(entity =>
        {
            entity.HasKey(ea => new { ea.EventId, ea.UserId });
        });

        modelBuilder.Entity<UserFollow>(entity =>
        {
            entity.HasKey(uf => new { uf.FollowerId, uf.FollowedId });
            entity.HasOne(uf => uf.Follower)
                  .WithMany(u => u.FollowedUsers)
                  .HasForeignKey(uf => uf.FollowerId)
                  .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(uf => uf.Followed)
                  .WithMany(u => u.Followers)
                  .HasForeignKey(uf => uf.FollowedId)
                  .OnDelete(DeleteBehavior.NoAction);
        });
    }
}