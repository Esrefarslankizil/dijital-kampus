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

        // GET: api/posts  — Sadece takip edilen kullanıcıların gönderileri + kendi gönderileri, en yeni önce
        [HttpGet]
        public async Task<IActionResult> GetPosts([FromQuery] int userId = 0)
        {
            int currentUserId = userId > 0 ? userId : GetCurrentUserId();

            // Takip edilen kullanıcı ID'leri
            var followedIds = currentUserId > 0
                ? await _context.UserFollows
                    .Where(f => f.FollowerId == currentUserId)
                    .Select(f => f.FollowedId)
                    .ToListAsync()
                : new List<int>();

            // Kendinin gönderileri de dahil
            if (currentUserId > 0 && !followedIds.Contains(currentUserId))
                followedIds.Add(currentUserId);

            // Hiç takip edilmiyorsa herkesi göster (yeni kullanıcılar için boş feed olmasın)
            bool showAll = followedIds.Count <= 1;

            var query = _context.Posts
                .Where(p => p.DeletedAt == null && (showAll || followedIds.Contains(p.UserId)))
                .OrderByDescending(p => p.CreatedAt)
                .Include(p => p.User)
                .Include(p => p.PostMedias)
                .Include(p => p.PostLikes)
                .Include(p => p.Comments);

            var posts = await query
                .Select(p => new
                {
                    p.Id,
                    UserId = p.UserId,
                    p.Content,
                    p.CreatedAt,
                    Author = (p.User != null && !string.IsNullOrWhiteSpace(p.User.FirstName))
                        ? $"{p.User.FirstName} {p.User.LastName}".Trim()
                        : (p.User != null ? p.User.UserName ?? p.User.Email ?? "Anonim" : "Anonim Kullanıcı"),
                    AuthorId = p.UserId,
                    AvatarUrl = p.User != null ? p.User.AvatarUrl : null,
                    LikeCount = p.PostLikes.Count,
                    CommentCount = p.Comments.Count,
                    IsLikedByCurrentUser = currentUserId > 0 && p.PostLikes.Any(l => l.UserId == currentUserId),
                    Medias = p.PostMedias.Select(m => new { m.Url })
                })
                .ToListAsync();

            return Ok(posts);
        }

        // POST: api/posts/seed — Test verisi oluştur (Sadece geliştirme ortamı için)
        [HttpPost("seed")]
        public async Task<IActionResult> SeedPosts()
        {
            var contents = new[]
            {
                "Bugün kampüste harika bir gün geçirdim! 🎓 Kütüphanede çalışırken yeni arkadaşlar edindim.",
                "Yazılım Mühendisliği dersi muhteşemdi. Hocamız algoritmaları çok güzel anlattı 💡",
                "Yurt yemeği bugün süper çıktı 😄 Mercimek çorbası en iyisi!",
                "Öğrenci kulübümüzde bu hafta etkinlik var, herkesi bekliyoruz! 📣",
                "Sınav haftası başladı. Başarılar arkadaşlar, birlikte başaracağız! 💪",
                "Kampüs bahçesinde güneşli bir mola. Doğa ile iç içe çalışmak bambaşka 🌿",
                "Bu dönem aldığım Yapay Zeka dersi hayatımı değiştiriyor. Her gün yeni şeyler öğreniyorum 🤖",
                "Staj görüşmem çok iyiydi! Umarım olumlu dönüş gelir 🤞",
                "Proje sunumunu tamamladık. Ekip çalışması her şey demek! 🙌",
                "Üniversite korosuna katıldım. Müzik ruhu besliyor 🎵",
                "Bugün ilk kez öğrenci danışma merkezine gittim. Çok faydalıydı, tavsiye ederim.",
                "Tez danışmanımla harika bir toplantı yaptık. Araştırma konum netleşti 📚",
                "Kampüs spor salonunu keşfettim! Artık her gün antrenman yapacağım 🏋️",
                "Bu hafta 3 farklı seminere katıldım. Kariyer planlamak için çok değerliydi.",
                "Dönemin son ödevi bitti! Artık biraz nefes alabilirim 😮‍💨",
                "Mezuniyet törenine sayılı günler kaldı. Dört yıl ne kadar hızlı geçti 😢",
                "Erasmus başvurusu yaptım. Umarım kabul edilir! 🌍",
                "Kampüste yeni açılan teknoloji kulübüne üye oldum. İlk toplantı bu Perşembe!",
                "Matematik sınavından 95 aldım! Çok mutluyum 🎉",
                "Araştırma projesine gönüllü olarak katıldım. Harika bir deneyim olacak.",
                "Grup projesinde lider oldum. Sorumluluk büyük ama öğreniyorum 📋",
                "Bugün hocam benim çalışmamı sınıfa örnek gösterdi. Çok mutlu ettim 🥹",
                "Staj günlüklerimi düzenli tutuyorum. İleride çok işe yarayacak.",
                "Bitirme projesinin son aşamasına geldim. Heyecan had safhada! 🚀",
                "Kampüs kafede yeni kahve çeşidi denedim. Harika! ☕",
                "Online derste yanlışlıkla mikrofonu açık unutunca herkes güldü 😅",
                "Dönem projesini 3 haftada bitirdik. Harika bir ekipti!",
                "Bugün kampüste kariyer fuarı vardı. Çok güzel stantlar kurulmuştu.",
                "Kütüphanede sessizce çalışmak bazen en verimli yöntem 📖",
                "Yeni dönem ders programım çıktı. Yoğun ama heyecanlı bir dönem olacak!",
            };

            var users = await _context.Users
                .Where(u => u.DeletedAt == null && u.IsApproved)
                .Select(u => u.Id)
                .ToListAsync();

            if (users.Count == 0)
                return BadRequest("Onaylı kullanıcı bulunamadı.");

            var rng = new Random(42);
            int created = 0;

            foreach (var userId in users)
            {
                int postCount = rng.Next(2, 5);
                var shuffled = contents.OrderBy(_ => rng.Next()).Take(postCount).ToArray();

                foreach (var content in shuffled)
                {
                    var daysAgo = rng.Next(0, 30);
                    var hoursAgo = rng.Next(0, 24);
                    var post = new Post
                    {
                        UserId = userId,
                        Content = content,
                        CreatedAt = DateTime.UtcNow.AddDays(-daysAgo).AddHours(-hoursAgo),
                    };
                    _context.Posts.Add(post);
                    created++;
                }
            }
            await _context.SaveChangesAsync();

            // Rastgele beğeniler ekle
            var allPostIds = await _context.Posts.Where(p => p.DeletedAt == null).Select(p => p.Id).ToListAsync();
            int likeCount = 0;
            foreach (var postId in allPostIds)
            {
                int likers = rng.Next(0, Math.Min(8, users.Count));
                var likerIds = users.OrderBy(_ => rng.Next()).Take(likers);
                foreach (var uid in likerIds)
                {
                    bool exists = await _context.PostLikes.AnyAsync(l => l.PostId == postId && l.UserId == uid);
                    if (!exists)
                    {
                        _context.PostLikes.Add(new PostLike { PostId = postId, UserId = uid });
                        likeCount++;
                    }
                }
            }
            await _context.SaveChangesAsync();

            return Ok(new { message = $"{created} gönderi ve {likeCount} beğeni oluşturuldu!", posts = created, likes = likeCount });
        }

        // GET: api/posts/explore — Tüm kullanıcıların en çok beğenilen gönderileri (Keşfet)
        [HttpGet("explore")]
        public async Task<IActionResult> GetExplorePosts([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            int currentUserId = GetCurrentUserId();

            // Keşfet: Herkesin gönderileri, en çok beğenilenden en aza
            var query = _context.Posts
                .Where(p => p.DeletedAt == null)
                .Include(p => p.User)
                .Include(p => p.PostMedias)
                .Include(p => p.PostLikes)
                .Include(p => p.Comments)
                .OrderByDescending(p => p.PostLikes.Count)
                .ThenByDescending(p => p.CreatedAt);

            var total = await query.CountAsync();

            var posts = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new
                {
                    p.Id,
                    UserId = p.UserId,
                    p.Content,
                    p.CreatedAt,
                    Author = (p.User != null && !string.IsNullOrWhiteSpace(p.User.FirstName))
                        ? $"{p.User.FirstName} {p.User.LastName}".Trim()
                        : (p.User != null ? p.User.UserName ?? p.User.Email ?? "Anonim" : "Anonim"),
                    AuthorId = p.UserId,
                    AvatarUrl = p.User != null ? p.User.AvatarUrl : null,
                    Role = p.User != null ? p.User.Role : null,
                    LikeCount = p.PostLikes.Count,
                    CommentCount = p.Comments.Count,
                    IsLikedByMe = currentUserId > 0 && p.PostLikes.Any(l => l.UserId == currentUserId),
                    Medias = p.PostMedias.Select(m => new { m.Url })
                })
                .ToListAsync();

            return Ok(new { total, page, pageSize, posts });
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

                var post = await _context.Posts.FindAsync(id);
                if (post != null && post.UserId != userId)
                {
                    var user = await _context.Users.FindAsync(userId);
                    var userName = user != null ? (!string.IsNullOrWhiteSpace(user.FirstName) ? $"{user.FirstName} {user.LastName}" : user.UserName) : "Biri";
                    _context.Notifications.Add(new Notification
                    {
                        UserId = post.UserId,
                        Content = $"{userName} gönderini beğendi."
                    });
                    await _context.SaveChangesAsync();
                }

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

            if (post.UserId != userId)
            {
                var userName = user != null ? (!string.IsNullOrWhiteSpace(user.FirstName) ? $"{user.FirstName} {user.LastName}" : user.UserName) : "Biri";
                var shortContent = request.Content.Length > 30 ? request.Content.Substring(0, 30) + "..." : request.Content;
                _context.Notifications.Add(new Notification
                {
                    UserId = post.UserId,
                    Content = $"{userName} gönderine yorum yaptı: \"{shortContent}\""
                });
                await _context.SaveChangesAsync();
            }

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