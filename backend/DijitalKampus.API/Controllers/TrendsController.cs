using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DijitalKampus.API.Data;
using System.Text.RegularExpressions;

namespace DijitalKampus.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class TrendsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public TrendsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/trends
    // Gönderilerdeki #hashtag'leri sayarak gerçek zamanlı trendleri döner.
    [HttpGet]
    public async Task<IActionResult> GetTrends()
    {
        // Silinmemiş tüm gönderi içeriklerini çek
        var contents = await _context.Posts
            .Where(p => p.DeletedAt == null && p.Content != null)
            .Select(p => p.Content!)
            .ToListAsync();

        if (contents.Count == 0)
        {
            return Ok(new List<object>()); // Hiç gönderi yoksa boş döndür
        }

        // Her gönderi içindeki #hashtag'leri bul ve say
        var hashtagCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var hashtagRegex = new Regex(@"#\w+", RegexOptions.Compiled);

        // Her gonderi icindeki #hashtag'leri bul - ayni etiketi bir gonderide
        // kac kez yazilirsa yazilsin SADECE 1 kez say (Distinct per post)
        foreach (var content in contents)
        {
            var matches = hashtagRegex.Matches(content);
            var uniqueTagsInThisPost = matches
                .Select(m => m.Value.ToLower())
                .Distinct(); // Ayni gonderide tekrar eden etiketleri ele

            foreach (var tag in uniqueTagsInThisPost)
            {
                hashtagCounts.TryGetValue(tag, out int currentCount);
                hashtagCounts[tag] = currentCount + 1;
            }
        }

        // En popüler 5 hashtag'i sırala
        var trends = hashtagCounts
            .OrderByDescending(kv => kv.Value)
            .Take(5)
            .Select(kv => new
            {
                topic = kv.Key,
                postCount = kv.Value,
                category = "Kampüs · Gündem"
            })
            .ToList();

        return Ok(trends);
    }
}
