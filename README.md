# 🎓 Dijital Kampüs

Dijital Kampüs, durağan üniversite portallarını rafa kaldırıp iletişim ve kariyer odaklı kapalı bir sosyal ağ (LinkedIn & Instagram hibriti) kurmayı hedefleyen kapsamlı bir yazılım mühendisliği projesidir. 

Fırat Üniversitesi akademik standartlarına uygun olarak tasarlanan bu platform, öğrenci ve mezunları tek çatı altında toplayarak staj, iş fırsatları ve sektörel tecrübeleri dinamik bir akış (feed) üzerinden sunar.

## 🚀 Teknolojiler ve Mimari

Proje, **Monorepo** (tek depo) yaklaşımıyla tasarlanmış olup istemci ve sunucu tarafları birbirinden tamamen izole edilmiştir.

### Frontend (Gövde)
*   **Kütüphane:** React.js (Fonksiyonel Komponentler & Hooks)
*   **Stil:** Tailwind CSS (Modern, oversize ve ferah tasarım prensipleri)
*   **İkonlar:** Lucide-React

### Backend (Motor)
*   **Çatı:** ASP.NET Core Web API / PHP
*   **Mimari:** N-Katmanlı Mimari (N-Tier Architecture)
*   **Gerçek Zamanlı İletişim:** SignalR / WebSocket
*   **Veritabanı:** MySQL (Code-First)

### Güvenlik Standartları
Sistem, uçtan uca güvenli iletişimi merkeze alır:
*   Stateless **JWT (JSON Web Token)** tabanlı yetkilendirme.
*   Rol bazlı erişim kontrolü (Öğrenci, Mezun, Admin).
*   IDOR ve XSS gibi zafiyetlere karşı sıkılaştırılmış uç noktalar ve katı siber güvenlik pratikleri.

---

## 📁 Klasör Yapısı

Depo, dikey dilimleme (vertical slicing) ve bağımsız geliştirme süreçlerini destekleyecek şekilde iki ana klasöre ayrılmıştır:

```text
dijital-kampus/
├── frontend/          # Sadece React ve Tailwind kodları (İstemci)
├── backend/           # API, Veritabanı Modelleri ve İş Kuralları (Sunucu)
├── .gitignore         # Gereksiz dosyaların (node_modules, bin/obj) engellenmesi
└── README.md          # Proje dokümantasyonu
