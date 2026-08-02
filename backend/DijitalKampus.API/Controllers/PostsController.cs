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
        public async Task<IActionResult> GetPosts()
        {
        var posts = await _context.Posts
            .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    p.Id,
                    p.Content,
                    p.CreatedAt,
                    Author = p.User != null ? p.User.Email : "Anonim Kullanıcı",
                    LikeCount = p.PostLikes.Count,
                    CommentCount = p.Comments.Count
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
                
                return Ok(new
                {
                    newPost.Id,
                    newPost.Content,
                    newPost.CreatedAt,
                    Author = "Kullanıcı"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Kayıt sırasında bir hata oluştu.", error = ex.Message });
            }
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
                    Author = string.IsNullOrEmpty(c.User.FirstName) ? c.User.Email : c.User.FirstName + " " + c.User.LastName,
                    Role = c.User.Role
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

            // Dönüşte author bilgisini de doldurmak için User'ı manuel de alabiliriz veya basit dönebiliriz.
            return Ok(new
            {
                comment.Id,
                comment.Content,
                comment.CreatedAt,
                Author = "Kullanıcı", // Yorumu ekleyen kullanıcı bilgisi
                Role = "Öğrenci"
            });
        }
    }

    public class CreatePostRequest
    {
        public int UserId { get; set; }
        public string Content { get; set; } = string.Empty;
    }

    public class CreateCommentRequest
    {
        public int UserId { get; set; }
        public string Content { get; set; } = string.Empty;
    }
}
