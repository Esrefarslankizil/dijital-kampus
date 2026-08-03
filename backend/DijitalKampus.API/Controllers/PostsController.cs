using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DijitalKampus.API.Models;
using DijitalKampus.API.Data;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace DijitalKampus.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PostsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PostsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/posts
        [HttpGet]
        public async Task<IActionResult> GetPosts([FromQuery] int userId = 0)
        {
        var posts = await _context.Posts
            .Include(p => p.PostMedias)
            .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    p.Id,
                    UserId = p.UserId,
                    p.Content,
                    p.CreatedAt,
                    Author = p.User != null ? (p.User.UserName ?? p.User.Email) : "Anonim Kullanıcı",
                    AvatarUrl = p.User != null ? p.User.AvatarUrl : null,
                    LikeCount = p.PostLikes.Count,
                    CommentCount = p.Comments.Count,
                    IsLikedByCurrentUser = userId > 0 && p.PostLikes.Any(l => l.UserId == userId),
                    MediaUrl = p.PostMedias.Count > 0 ? p.PostMedias.First().Url : null
                })
                .ToListAsync();

            return Ok(posts);
        }

        // POST: api/posts
        [HttpPost]
        public async Task<IActionResult> CreatePost([FromBody] CreatePostRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Content))
                return BadRequest(new { message = "Gönderi içeriği boş olamaz." });

            // Frontend'den gelen UserId var ise onu kullan, yoksa veritabanındaki 1 numaralı kullanıcıyı varsay (test için)
            var userId = request.UserId > 0 ? request.UserId : 1;

            var newPost = new Post
            {
                UserId = userId,
                Content = request.Content,
                CreatedAt = DateTime.UtcNow
            };

            _context.Posts.Add(newPost);
            
            try 
            {
                await _context.SaveChangesAsync();

                // Eğer mediaUrl varsa PostMedia kaydı oluştur
                if (!string.IsNullOrEmpty(request.MediaUrl))
                {
                    _context.PostMedias.Add(new PostMedia { PostId = newPost.Id, Url = request.MediaUrl });
                    await _context.SaveChangesAsync();
                }
                
                return Ok(new
                {
                    newPost.Id,
                    newPost.Content,
                    newPost.CreatedAt,
                    Author = "Kullanıcı",
                    MediaUrl = request.MediaUrl
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Kayıt sırasında bir hata oluştu.", error = ex.Message });
            }
        }

        // POST: api/posts/upload-image
        [HttpPost("upload-image")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Dosya boş olamaz." });

            var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
            if (!allowedTypes.Contains(file.ContentType))
                return BadRequest(new { message = "Sadece resim dosyası yüklenebilir." });

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "posts");
            Directory.CreateDirectory(uploadsFolder);

            var ext = Path.GetExtension(file.FileName);
            var fileName = Guid.NewGuid().ToString() + ext;
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var url = "/uploads/posts/" + fileName;
            return Ok(new { url });
        }

        // DELETE: api/posts/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePost(int id)
        {
            var post = await _context.Posts.FindAsync(id);
            if (post == null)
                return NotFound(new { message = "Gönderi bulunamadı." });

            post.DeletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Gönderi başarıyla silindi." });
        }

        // POST: api/posts/{id}/like
        [HttpPost("{id}/like")]
        public async Task<IActionResult> ToggleLike(int id, [FromBody] LikeRequest request)
        {
            var userId = request.UserId > 0 ? request.UserId : 1;
            var existing = await _context.PostLikes
                .FirstOrDefaultAsync(l => l.PostId == id && l.UserId == userId);

            if (existing != null)
            {
                _context.PostLikes.Remove(existing);
                await _context.SaveChangesAsync();
                var count = await _context.PostLikes.CountAsync(l => l.PostId == id);
                return Ok(new { liked = false, likeCount = count });
            }
            else
            {
                _context.PostLikes.Add(new PostLike { PostId = id, UserId = userId });
                await _context.SaveChangesAsync();
                var count = await _context.PostLikes.CountAsync(l => l.PostId == id);
                return Ok(new { liked = true, likeCount = count });
            }
        }

        // GET: api/posts/{id}/comments
        [HttpGet("{id}/comments")]
        public async Task<IActionResult> GetComments(int id)
        {
            var comments = await _context.Comments
                .Include(c => c.User)
                .Where(c => c.PostId == id)
                .OrderBy(c => c.CreatedAt)
                .Select(c => new
                {
                    c.Id,
                    c.Content,
                    c.CreatedAt,
                    UserId = c.User.Id,
                    Author = string.IsNullOrEmpty(c.User.FirstName) ? c.User.Email : c.User.FirstName + " " + c.User.LastName,
                    Role = c.User.Role,
                    AvatarUrl = c.User.AvatarUrl
                })
                .ToListAsync();

            return Ok(comments);
        }

        // POST: api/posts/{id}/comments
        [HttpPost("{id}/comments")]
        public async Task<IActionResult> AddComment(int id, [FromBody] CreateCommentRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Content))
                return BadRequest(new { message = "Yorum içeriği boş olamaz." });

            var post = await _context.Posts.FindAsync(id);
            if (post == null)
                return NotFound(new { message = "Gönderi bulunamadı." });

            var userId = request.UserId > 0 ? request.UserId : 1;

            var comment = new Comment
            {
                PostId = id,
                UserId = userId,
                Content = request.Content,
                CreatedAt = DateTime.UtcNow
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            var user = await _context.Users.FindAsync(userId);

            return Ok(new
            {
                comment.Id,
                comment.Content,
                comment.CreatedAt,
                UserId = user?.Id,
                Author = user != null ? (string.IsNullOrEmpty(user.FirstName) ? user.Email : user.FirstName + " " + user.LastName) : "Kullanıcı",
                Role = user?.Role,
                AvatarUrl = user?.AvatarUrl
            });
        }
    }

    public class CreatePostRequest
    {
        public int UserId { get; set; }
        public string Content { get; set; } = string.Empty;
        public string? MediaUrl { get; set; }
    }

    public class CreateCommentRequest
    {
        public int UserId { get; set; }
        public string Content { get; set; } = string.Empty;
    }

    public class LikeRequest
    {
        public int UserId { get; set; }
    }
}
