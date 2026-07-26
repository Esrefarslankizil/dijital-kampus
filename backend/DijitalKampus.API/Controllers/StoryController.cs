using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DijitalKampus.API.Models;
using DijitalKampus.API.Data;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace DijitalKampus.API.Controllers 
{
    [ApiController] 
    [Route("api/[controller]")] 
    public class StoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context; 

        public StoryController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadStory([FromForm] int userId, [FromForm] IFormFile? file, [FromForm] string? textContent, [FromForm] string? backgroundColor, [FromForm] string? textColor)
        {
            try
            {
                if ((file == null || file.Length == 0) && string.IsNullOrWhiteSpace(textContent))
                {
                    return BadRequest("Lütfen bir dosya seçin veya metin girin."); 
                }

                string? uploadedMediaUrl = null;

                if (file != null && file.Length > 0)
                {
                    using var memoryStream = new System.IO.MemoryStream();
                    await file.CopyToAsync(memoryStream);

                    var fotograf = new Fotograf
                    {
                        FileName = file.FileName,
                        ContentType = file.ContentType,
                        Data = memoryStream.ToArray(),
                        CreatedAt = DateTime.UtcNow
                    };
                    
                    _context.Fotograflar.Add(fotograf);
                    await _context.SaveChangesAsync();

                    uploadedMediaUrl = $"/api/Story/image/{fotograf.Id}";
                }

                var newStory = new Story
                {
                    UserId = userId,
                    MediaPath = uploadedMediaUrl,
                    TextContent = textContent,
                    BackgroundColor = backgroundColor ?? "#000000",
                    TextColor = textColor ?? "#ffffff",
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddHours(24)
                };

                _context.Stories.Add(newStory);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Hikaye başarıyla yüklendi.", story = newStory });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Hikaye Yükleme Hatası: {ex.Message}");
                return StatusCode(500, $"Sunucu hatası oluştu: {ex.Message}");
            }
        }

        [HttpGet("image/{id}")]
        public async Task<IActionResult> GetImage(int id)
        {
            var fotograf = await _context.Fotograflar.FindAsync(id);
            if (fotograf == null) return NotFound();
            
            return File(fotograf.Data, fotograf.ContentType);
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveStories()
        {
            try
            {
                var activeStories = await _context.Stories
                    .Include(s => s.User)
                    .Where(s => s.ExpiresAt > DateTime.UtcNow)
                    .OrderByDescending(s => s.CreatedAt)
                    .Select(s => new
                    {
                        id = s.Id,
                        userId = s.UserId,
                        mediaPath = s.MediaPath,
                        textContent = s.TextContent,
                        backgroundColor = s.BackgroundColor,
                        textColor = s.TextColor,
                        createdAt = s.CreatedAt,
                        userName = s.User != null ? s.User.Email : "Bilinmiyor"
                    })
                    .ToListAsync();

                return Ok(activeStories);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Hikayeler getirilirken hata oluştu: {ex.Message}");
            }
        }
    }
}