using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DijitalKampus.API.Data; 
using DijitalKampus.API.Models; 

namespace DijitalKampus.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PortfolioController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PortfolioController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Belirli bir öğrencinin projelerini getir
        // GET: api/portfolio/projects/5
        [HttpGet("projects/{profileId}")]
        public async Task<IActionResult> GetProjects(int profileId)
        {
            var projects = await _context.Projects
                .Where(p => p.StudentProfileId == profileId)
                .ToListAsync();
                
            return Ok(projects); 
        }

        // Yeni proje ekle
        // POST: api/portfolio/projects
        [HttpPost("projects")]
        public async Task<IActionResult> AddProject([FromBody] Project newProject)
        {
            if (newProject == null) 
            {
                return BadRequest(new { message = "Geçersiz proje verisi." });
            }
            
            _context.Projects.Add(newProject);
            await _context.SaveChangesAsync();
            
            return Ok(newProject); 
        }

        // Belirli bir öğrencinin sertifikalarını getir
        // GET: api/portfolio/certificates/5
        [HttpGet("certificates/{profileId}")]
        public async Task<IActionResult> GetCertificates(int profileId)
        {
            var certs = await _context.Certificates
                .Where(c => c.StudentProfileId == profileId)
                .ToListAsync();
                
            return Ok(certs);
        }

        // Yeni sertifika ekle
        // POST: api/portfolio/certificates
        [HttpPost("certificates")]
        public async Task<IActionResult> AddCertificate([FromBody] Certificate newCert)
        {
            if (newCert == null) 
            {
                return BadRequest(new { message = "Geçersiz sertifika verisi." });
            }

            _context.Certificates.Add(newCert);
            await _context.SaveChangesAsync();
            
            return Ok(newCert); 
        }
    }
}