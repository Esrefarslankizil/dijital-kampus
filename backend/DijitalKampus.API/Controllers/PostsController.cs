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
                .Include(p => p.User)
                .Include(p => p.PostLikes)
                .Include(p => p.Comments)
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

            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Gönderi başarıyla silindi." });
        }
    }

    public class CreatePostRequest
    {
        public int UserId { get; set; }
        public string Content { get; set; } = string.Empty;
    }
}
