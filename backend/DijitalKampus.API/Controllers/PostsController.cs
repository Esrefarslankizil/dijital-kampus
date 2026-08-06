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
        private readonly IWebHostEnvironment _env;

        public PostsController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // Yardımcı: Token'dan userId çek
        private int GetCurrentUserId()
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            if (authHeader.StartsWith("Bearer dummy-jwt-token-"))
            {
                int.TryParse(authHeader.Substring("Bearer dummy-jwt-token-".Length), out int userId);
                return userId;
            }
            return 0;
        }

        // GET: api/posts  — Tüm gönderiler, FullName ile
        [HttpGet]
        public async Task<IActionResult> GetPosts([FromQuery] int userId = 0)
        {
            var posts = await _context.Posts
                .Where(p => p.DeletedAt == null)
                .OrderByDescending(p => p.CreatedAt)
                .Include(p => p.User)
                .Include(p => p.PostMedias)
                .Include(p => p.PostLikes)
                .Include(p => p.Comments)
                .Select(p => new
                {
                    p.Id,
                    UserId = p.UserId,
                    p.Content,
                    p.CreatedAt,
                    // Senin düzeltmen: Email yerine FullName kullan
                    Author = (p.User != null && !string.IsNullOrWhiteSpace(p.User.FirstName))
                        ? $"{p.User.FirstName} {p.User.LastName}".Trim()
                        : (p.User != null ? p.User.UserName ?? p.User.Email ?? "Anonim" : "Anonim Kullanıcı"),
                    AuthorId = p.UserId,
                    AvatarUrl = p.User != null ? p.User.AvatarUrl : null,
                    LikeCount = p.PostLikes.Count,
                    CommentCount = p.Comments.Count,
                    // Eşref'in eklediği faydalı özellik:
                    IsLikedByCurrentUser = userId > 0 && p.PostLikes.Any(l => l.UserId == userId),
                    Medias = p.PostMedias.Select(m => new { m.Url })
                })
                .ToListAsync();

            return Ok(posts);
        }

        // GET: api/posts/user/{userId}  — Kullanıcıya ait gönderiler
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserPosts(int userId)
        {
            var posts = await _context.Posts
                .Where(p => p.DeletedAt == null && p.UserId == userId)
                .OrderByDescending(p => p.CreatedAt)
                .Include(p => p.User)
                .Include(p => p.PostMedias)
                .Include(p => p.PostLikes)
                .Include(p => p.Comments)
                .Select(p => new
                {
                    p.Id,
                    p.Content,
                    p.CreatedAt,
                    Author = (p.User != null && !string.IsNullOrWhiteSpace(p.User.FirstName))
                        ? $"{p.User.FirstName} {p.User.LastName}".Trim()
                        : (p.User != null ? p.User.UserName ?? p.User.Email ?? "Anonim" : "Anonim"),
                    AuthorId = p.UserId,
                    AvatarUrl = p.User != null ? p.User.AvatarUrl : null,
                    LikeCount = p.PostLikes.Count,
                    CommentCount = p.Comments.Count,
                    Medias = p.PostMedias.Select(m => new { m.Url })
                })
                .ToListAsync();

            return Ok(posts);
        }

        // POST: api/posts  — multipart/form-data ile fotoğraf + etiket desteği
        [HttpPost]
        public async Task<IActionResult> CreatePost([FromForm] CreatePostRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Content))
                return BadRequest(new { message = "Gönderi içeriği boş olamaz." });

            var userId = request.UserId > 0 ? request.UserId : GetCurrentUserId();
            if (userId <= 0) userId = 1;

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

                // Fotoğraf varsa kaydet (Senin mantığın)
                if (request.Image != null && request.Image.Length > 0)
                {
                    var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
                    if (allowedTypes.Contains(request.Image.ContentType.ToLower()))
                    {
                        var uploadsDir = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", "posts");
                        Directory.CreateDirectory(uploadsDir);

                        var ext = Path.GetExtension(request.Image.FileName);
                        var fileName = $"post_{newPost.Id}_{DateTime.UtcNow.Ticks}{ext}";
                        var filePath = Path.Combine(uploadsDir, fileName);

                        using (var stream = new FileStream(filePath, FileMode.Create))
                            await request.Image.CopyToAsync(stream);

                        var mediaUrl = $"/uploads/posts/{fileName}";
                        _context.PostMedias.Add(new PostMedia { PostId = newPost.Id, Url = mediaUrl });
                        await _context.SaveChangesAsync();
                    }
                }
                // Eşref'in mantığı (Alternatif URL girişi)
                else if (!string.IsNullOrEmpty(request.MediaUrl))
                {
                    _context.PostMedias.Add(new PostMedia { PostId = newPost.Id, Url = request.MediaUrl });
                    await _context.SaveChangesAsync();
                }

                // Kullanıcı bilgisini çek (İsimlerin patlamaması için senin dinamik kodun)
                var user = await _context.Users.FindAsync(userId);
                string authorName = (user != null && !string.IsNullOrWhiteSpace(user.FirstName))
                    ? $"{user.FirstName} {user.LastName}".Trim()
                    : user?.UserName ?? "Kullanıcı";

                var media = await _context.PostMedias.Where(m => m.PostId == newPost.Id).ToListAsync();

                return Ok(new
                {
                    newPost.Id,
                    newPost.Content,
                    newPost.CreatedAt,
                    Author = authorName,
                    AuthorId = userId,
                    AvatarUrl = user?.AvatarUrl,
                    LikeCount = 0,
                    CommentCount = 0,
                    Medias = media.Select(m => new { m.Url })
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
        // Senin eklediğin
        public IFormFile? Image { get; set; }
        public string? Hashtags { get; set; }
        // Eşref'in eklediği
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