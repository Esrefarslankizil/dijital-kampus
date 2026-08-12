using Microsoft.EntityFrameworkCore;
using DijitalKampus.API.Data;
using DijitalKampus.API.Models;

// Proje root'unu kullan
var builder = WebApplication.CreateBuilder(args);
var connectionString = "Server=localhost;Port=3306;Database=DijitalKampus;User=root;Password=Sifre123;";
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

var app = builder.Build();

using var scope = app.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

// Tüm onaylı kullanıcıları çek (kendi hesabın hariç tutulmayacak — seed için hepsi dahil)
var users = await db.Users
    .Where(u => u.DeletedAt == null && u.IsApproved)
    .Select(u => new { u.Id, u.FirstName, u.LastName, u.Email, u.Role })
    .ToListAsync();

if (users.Count() == 0)
{
    Console.WriteLine("Hiç onaylı kullanıcı bulunamadı! Önce kullanıcı ekleyin.");
    return;
}

Console.WriteLine($"Toplam {users.Count()} kullanıcı bulundu. Gönderiler oluşturuluyor...");

var postContents = new[]
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
    "Arkadaşlarımla kampüs kafede çalışma seansı yaptık. Verimliydi! ☕",
    "Dönemin son ödevi bitti! Artık biraz nefes alabilirim 😮‍💨",
    "Mezuniyet törenine sayılı günler kaldı. Dört yıl ne kadar hızlı geçti 😢",
    "Erasmus başvurusu yaptım. Umarım kabul edilir! 🌍",
    "Kampüste yeni açılan teknoloji kulübüne üye oldum. İlk toplantı bu Perşembe!",
    "Matematik sınavından 95 aldım! Çok mutluyum 🎉",
    "Araştırma projesine gönüllü olarak katıldım. Harika bir deneyim olacak.",
    "Kampüs kütüphanesi geceleri de açık mı? Sınav öncesi burada kalmak istiyorum.",
    "Grup projesinde lider oldum. Sorumluluk büyük ama öğreniyorum 📋",
    "Bugün hocam benim çalışmamı sınıfa örnek gösterdi. Çok mutlu ettim 🥹",
    "Bölüm gezisi İstanbul'a oldu. Müthiş bir deneyimdi, çok şey öğrendim.",
    "Online derse katılırken internet kesildi 😅 Teknoloji bazen şaka yapar.",
    "Yeni dönem ders programım çıktı. Yoğun ama heyecanlı bir dönem olacak!",
    "Staj günlüklerimi düzenli tutuyorum. İleride çok işe yarayacak.",
    "Kampüs kantinine çıkan yeni menüyü deneyin! Gerçekten lezzetli 🍽️",
    "Bitirme projesinin son aşamasına geldim. Heyecan had safhada! 🚀",
};

var rng = new Random(42);
int created = 0;

foreach (var user in users)
{
    // Her kullanıcıya rastgele 2-4 gönderi ata
    int postCount = rng.Next(2, 5);
    var shuffled = postContents.OrderBy(_ => rng.Next()).Take(postCount).ToArray();

    foreach (var content in shuffled)
    {
        // Rastgele bir tarih (son 30 gün içinde)
        var daysAgo = rng.Next(0, 30);
        var hoursAgo = rng.Next(0, 24);
        var createdAt = DateTime.UtcNow.AddDays(-daysAgo).AddHours(-hoursAgo);

        var post = new Post
        {
            UserId = user.Id,
            Content = content,
            CreatedAt = createdAt,
        };
        db.Posts.Add(post);
        created++;
    }
}

await db.SaveChangesAsync();
Console.WriteLine($"✅ {created} gönderi başarıyla oluşturuldu!");

// Rastgele beğeniler ekle
var allPosts = await db.Posts.Where(p => p.DeletedAt == null).Select(p => p.Id).ToListAsync();
var allUsers2 = await db.Users.Where(u => u.DeletedAt == null && u.IsApproved).Select(u => u.Id).ToListAsync();

int likeCount = 0;
foreach (var postId in allPosts)
{
    // Her gönderiye rastgele 0-8 kullanıcı beğeniyor
    int likers = rng.Next(0, Math.Min(9, allUsers2.Count()));
    var selectedUsers = allUsers2.OrderBy(_ => rng.Next()).Take(likers);
    foreach (var uid in selectedUsers)
    {
        bool exists = await db.PostLikes.AnyAsync(l => l.PostId == postId && l.UserId == uid);
        if (!exists)
        {
            db.PostLikes.Add(new PostLike { PostId = postId, UserId = uid });
            likeCount++;
        }
    }
}
await db.SaveChangesAsync();
Console.WriteLine($"✅ {likeCount} beğeni eklendi!");
Console.WriteLine("Seed tamamlandı 🎉");
