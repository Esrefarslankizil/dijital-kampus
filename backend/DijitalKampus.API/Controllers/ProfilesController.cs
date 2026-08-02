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

        // MEVCUT BİR PROFİLİ GÜNCELLEME VEYA OLUŞTURMA (UPSERT)
        // PUT: api/profiles/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProfile(int id, [FromBody] StudentProfile updatedProfile)
        {
            if (id != updatedProfile.UserId)
            {
                return BadRequest(new { message = "URL'deki ID ile profil ID'si eşleşmiyor." });
            }

            // Profil var mı kontrol et
            var existing = await _context.StudentProfiles.FirstOrDefaultAsync(p => p.UserId == id);

            if (existing == null)
            {
                // 🚀 DÜZELTİLEN KISIM BURASI 🚀
                // Veritabanında hiç bölüm yoksa önce garanti olsun diye genel bir bölüm oluştur
                var firstDept = await _context.Departments.FirstOrDefaultAsync();
                if (firstDept == null)
                {
                    firstDept = new Department { Name = "Genel Bölüm" };
                    _context.Departments.Add(firstDept);
                    await _context.SaveChangesAsync(); 
                }

                // Frontend'den gelen kirli objeyi (updatedProfile) değil, 
                // SADECE ihtiyacımız olan alanları alıp tertemiz yeni bir profil oluşturuyoruz!
                var safeNewProfile = new StudentProfile
                {
                    UserId = id,
                    Biography = updatedProfile.Biography,
                    Grade = updatedProfile.Grade,
                    TargetPosition = updatedProfile.TargetPosition,
                    TargetSector = updatedProfile.TargetSector,
                    DepartmentId = updatedProfile.DepartmentId > 0 ? updatedProfile.DepartmentId : firstDept.Id
                };

                _context.StudentProfiles.Add(safeNewProfile);
            }
            else
            {
                // Profil zaten varsa sadece izin verilen alanları güncelle
                if (updatedProfile.Biography != null) existing.Biography = updatedProfile.Biography;
                if (updatedProfile.Grade != null) existing.Grade = updatedProfile.Grade;
                if (updatedProfile.TargetSector != null) existing.TargetSector = updatedProfile.TargetSector;
                if (updatedProfile.TargetPosition != null) existing.TargetPosition = updatedProfile.TargetPosition;
                if (updatedProfile.DepartmentId > 0) existing.DepartmentId = updatedProfile.DepartmentId;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Profil başarıyla güncellendi." });
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