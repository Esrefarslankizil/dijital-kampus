// SignalR (Gerçek zamanlı web işlemleri) kütüphanesini projeye dahil ediyoruz.
using Microsoft.AspNetCore.SignalR;
// Yetkilendirme (kimlik doğrulama) işlemleri için gerekli kütüphane.
using Microsoft.AspNetCore.Authorization;
// Veritabanı bağlamımız (ApplicationDbContext) için gerekli kütüphane.
using DijitalKampus.API.Data;
// Veritabanı tablolarımızın (Models) C# karşılıklarını dahil ediyoruz.
using DijitalKampus.API.Models;
// Entity Framework Core (veritabanı sorguları) kütüphanesini dahil ediyoruz.
using Microsoft.EntityFrameworkCore;
// Kullanıcı kimlik (Claim) bilgilerini okumak için gerekli kütüphane.
using System.Security.Claims;

// Bu sınıfın hangi proje klasörüne ait olduğunu belirtiyoruz (Namespace).
namespace DijitalKampus.API.Hubs;

// ChatHub adında bir sınıf oluşturuyoruz ve bunun SignalR'ın "Hub" (Merkez/Santral) sınıfından miras aldığını belirtiyoruz.
public class ChatHub : Hub
{
    // Veritabanına erişmek için kullanacağımız Context nesnesini tanımlıyoruz.
    private readonly ApplicationDbContext _context;

    // CONSTRUCTOR: Controller/Hub ilk çalıştığında veritabanı bağlantısı Dependency Injection ile buraya otomatik gelir.
    public ChatHub(ApplicationDbContext context)
    {
        // Gelen veritabanı bağlantısını sınıf içindeki private değişkene atıyoruz.
        _context = context;
    }

    // GİRİŞ YAPAN KULLANICININ ID'SİNİ BULAN YARDIMCI METOT
    private int GetUserId()
    {
        // Şu anki HTTP isteğinin tüm detaylarını (Headers vb.) alıyoruz.
        var httpContext = Context.GetHttpContext();
        
        // SignalR bazen token'ı URL'nin sonuna "?access_token=..." şeklinde ekler. Önce oraya bakıyoruz.
        var token = httpContext?.Request.Query["access_token"].ToString();
        
        // Eğer URL'de token yoksa...
        if (string.IsNullOrEmpty(token))
        {
            // İsteğin "Authorization" (Yetkilendirme) başlığında token var mı diye kontrol ediyoruz.
            var authHeader = httpContext?.Request.Headers["Authorization"].ToString();
            
            // Eğer başlık "Bearer " ile başlıyorsa...
            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
                // "Bearer " kelimesini kesip atıyoruz, sadece token kısmını alıyoruz.
                token = authHeader.Substring("Bearer ".Length);
        }

        // Eğer elimizde bir token varsa ve "dummy-jwt-token-" ile başlıyorsa (test aşamasında böyle ayarlamıştık)...
        if (!string.IsNullOrEmpty(token) && token.StartsWith("dummy-jwt-token-"))
        {
            // Token'ın içindeki yazıyı silip sadece en sondaki sayıyı (Kullanıcı ID'si) okumaya çalışıyoruz.
            if (int.TryParse(token.Replace("dummy-jwt-token-", ""), out int id))
                // ID başarıyla sayıya çevrildiyse bu sayıyı geri döndürüyoruz.
                return id;
        }
        
        // Token yoksa veya hatalıysa sıfır (0) dönüyoruz.
        return 0;
    }

    // 1. KULLANICI SİSTEME BAĞLANDIĞINDA ÇALIŞAN METOT
    // Kullanıcı siteye girdiği anda arka planda otomatik olarak tetiklenir (WebSockets).
    public override async Task OnConnectedAsync()
    {
        // Yukarıdaki metodumuzla giriş yapan kişinin ID'sini alıyoruz.
        var userId = GetUserId();
        
        // Eğer geçerli bir kullanıcıysa...
        if (userId > 0)
        {
            // Kullanıcıyı SignalR içinde kendi ID'sine özel bir "odaya" (Group) ekliyoruz.
            // Örn: ID'si 5 ise "user_5" adlı odaya dahil olur.
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
        
        // SignalR'ın standart bağlanma işlemini tamamlıyoruz.
        await base.OnConnectedAsync();
    }

    // 2. KULLANICI MESAJ GÖNDERDİĞİNDE ÇALIŞAN METOT
    // Kullanıcı "Gönder" butonuna bastığında HTTP isteği atmadan doğrudan SignalR üzerinden bu metodu tetikler.
    public async Task SendMessage(int conversationId, string content)
    {
        // Mesajı gönderen kişinin ID'sini buluyoruz.
        int senderId = GetUserId();
        
        // Eğer ID sıfırsa (giriş yapmamışsa) işlemi iptal edip hata fırlatıyoruz.
        if (senderId <= 0)
            throw new HubException("Unauthorized"); // Yetkisiz giriş!

        // Güvenlik kontrolü: Bu kullanıcının gerçekten bu sohbete (conversationId) dahil olup olmadığını veritabanından soruyoruz.
        var participant = await _context.ConversationParticipants
            .FirstOrDefaultAsync(cp => cp.ConversationId == conversationId && cp.UserId == senderId);

        // Eğer kullanıcı bu sohbette yoksa (örneğin başkasının sohbetine mesaj atmaya çalışıyorsa) hata veriyoruz.
        if (participant == null)
            throw new HubException("Bu sohbete mesaj gönderme yetkiniz yok.");

        // ADIM A: MESAJI VERİTABANINA KAYDET
        // Yeni bir mesaj nesnesi (Model) oluşturuyoruz.
        var message = new Message
        {
            ConversationId = conversationId, // Hangi sohbete ait olduğu
            SenderId = senderId,             // Kimin gönderdiği
            Content = content,               // Mesajın içeriği
            SentAt = DateTime.UtcNow,        // Mesajın gönderilme saati (Dünya standart saati)
            IsRead = false                   // Henüz okunmadı olarak işaretliyoruz
        };

        // Oluşturduğumuz mesajı veritabanına eklemesi için Entity Framework'e veriyoruz.
        _context.Messages.Add(message);
        
        // İlgili sohbeti (Conversation) veritabanından buluyoruz.
        var conversation = await _context.Conversations.FindAsync(conversationId);
        
        // Eğer sohbet bulunduysa...
        if(conversation != null)
        {
            // Sohbetin "Son Güncellenme Tarihi"ni şu anki saat yapıyoruz ki mesaj kutusunda en üste çıksın.
            conversation.LastMessageAt = DateTime.UtcNow;
        }

        // Tüm değişiklikleri (yeni mesaj ve tarih güncellenmesi) veritabanına kalıcı olarak kaydediyoruz.
        await _context.SaveChangesAsync(); 

        // ADIM B: SOHBETTEKİ DİĞER KİŞİLERİ BUL
        // Bu sohbet grubunda (Conversation) benden başka kimler var diye veritabanına soruyoruz.
        var otherParticipants = await _context.ConversationParticipants
            .Where(cp => cp.ConversationId == conversationId) // Bu sohbet id'sine sahip olanları filtrele
            .Select(cp => cp.UserId)                          // Sadece onların Kullanıcı ID'lerini seç
            .ToListAsync();                                   // Ve bir liste (List<int>) haline getir

        // Mesajı gönderen kişinin isim/soyisim bilgilerini veritabanından çekiyoruz (Bildirim için lazım olacak).
        var senderUser = await _context.Users.FindAsync(senderId);
        
        // Eğer ismini yazmışsa "Ad Soyad" alıyoruz, yazmamışsa Kullanıcı Adını (Email) alıyoruz.
        string senderName = senderUser != null 
            ? (!string.IsNullOrWhiteSpace(senderUser.FirstName) ? $"{senderUser.FirstName} {senderUser.LastName}" : senderUser.UserName) 
            : "Biri";

        // ADIM C: MESAJI CANLI OLARAK İLET (SIGNALR BÜYÜSÜ BURADA BAŞLIYOR)
        // Sohbetteki tüm kişilerin (kendi ID'miz ve karşı tarafın ID'si) üzerinde sırayla dönüyoruz (döngü).
        foreach (var userId in otherParticipants)
        {
            // Eğer sıradaki kişi mesajı GÖNDEREN kişi DEĞİLSE (yani mesajı alan kişiyse)...
            if (userId != senderId)
            {
                // Karşı tarafa "Sana mesaj geldi" diye bir bildirim (Notification) oluşturuyoruz.
                var notification = new Notification
                {
                    UserId = userId,
                    Content = $"{senderName} sana bir mesaj gönderdi."
                };
                // Bildirimi veritabanına ekliyoruz.
                _context.Notifications.Add(notification);
            }

            // SIGNALR YAYINI (BROADCAST): 
            // Hem karşı tarafın "user_{userId}" odasına, hem de kendi odamıza "ReceiveMessage" (Mesaj Al) sinyali yolluyoruz.
            // Bu sinyalin içine mesajın ID'si, kimden geldiği, içeriği ve saati gibi detayları koyuyoruz.
            // Frontend tarafında React bu sinyali havada yakalayıp sayfayı hiç yenilemeden mesajı ekrana yazdıracak.
            await Clients.Group($"user_{userId}").SendAsync("ReceiveMessage", new 
            {
                Id = message.Id,
                ConversationId = message.ConversationId,
                SenderId = message.SenderId,
                SenderEmail = senderUser?.Email ?? "", // Resmi/Email'i frontend'de gösterebilmek için gönderiyoruz
                Content = message.Content,
                SentAt = message.SentAt
            });
        }
        
        // Döngü bittikten sonra, oluşturduğumuz yeni bildirimleri de veritabanına kalıcı olarak kaydediyoruz.
        await _context.SaveChangesAsync(); 
    }
}
