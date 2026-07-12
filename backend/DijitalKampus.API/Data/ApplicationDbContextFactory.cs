using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace DijitalKampus.API.Data;

public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        
        // MySQL bağlantı cümleni buraya yaz
        var connectionString = "server=localhost;database=DijitalKampus;user=dijitaluser;password=Sifre123";
        
        optionsBuilder.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));
        
        return new ApplicationDbContext(optionsBuilder.Options);
    }
}