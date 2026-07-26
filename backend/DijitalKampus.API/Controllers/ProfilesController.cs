using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DijitalKampus.API.Data;   
using DijitalKampus.API.Models; 

namespace DijitalKampus.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProfilesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProfilesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/profiles/test
        [HttpGet("test")]
        public IActionResult TestEndpoint()
        {
            return Ok(new { message = "Profiles API is up and running." });
        }

        // TÜM PROFİLLERİ LİSTELEME (Proje ve Sertifikalarla Birlikte)
        // GET: api/profiles
        [HttpGet]
        public async Task<IActionResult> GetAllProfiles()
        {
            var profiles = await _context.StudentProfiles
                .Include(p => p.Projects)
                .Include(p => p.Certificates)
                .Include(p => p.Department)
                .ToListAsync();

            return Ok(profiles);
        }

        // TEK BİR PROFİLİ GETİRME (UserId'ye Göre)
        // GET: api/profiles/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProfileById(int id)
        {
            var profile = await _context.StudentProfiles
                .Include(p => p.Projects)
                .Include(p => p.Certificates)
                .Include(p => p.Department)
                .FirstOrDefaultAsync(p => p.UserId == id);

            if (profile == null)
            {
                return NotFound(new { message = "Belirtilen ID'ye sahip profil bulunamadı." });
            }

            return Ok(profile);
        }

        // YENİ PROFİL OLUŞTURMA (CREATE)
        // POST: api/profiles
        [HttpPost]
        public async Task<IActionResult> CreateProfile([FromBody] StudentProfile newProfile)
        {
            if (newProfile == null)
            {
                return BadRequest(new { message = "Geçersiz profil verisi." });
            }

            _context.StudentProfiles.Add(newProfile);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProfileById), new { id = newProfile.UserId }, newProfile);
        }

        // MEVCUT BİR PROFİLİ GÜNCELLEME (UPDATE)
        // PUT: api/profiles/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProfile(int id, [FromBody] StudentProfile updatedProfile)
        {
            if (id != updatedProfile.UserId)
            {
                return BadRequest(new { message = "URL'deki ID ile profil ID'si eşleşmiyor." });
            }

            _context.Entry(updatedProfile).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.StudentProfiles.Any(e => e.UserId == id))
                {
                    return NotFound(new { message = "Güncellenecek profil bulunamadı." });
                }
                else
                {
                    throw;
                }
            }

            return NoContent(); 
        }

        // MEVCUT BİR PROFİLİ SİLME (DELETE)
        // DELETE: api/profiles/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProfile(int id)
        {
            var profile = await _context.StudentProfiles.FirstOrDefaultAsync(p => p.UserId == id);
            
            if (profile == null)
            {
                return NotFound(new { message = "Silinecek profil bulunamadı." });
            }

            _context.StudentProfiles.Remove(profile);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Profil başarıyla silindi." });
        }
    }
}