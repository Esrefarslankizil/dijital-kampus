# 🎓 Dijital Kampüs

Malatya Turgut Özal Üniversitesi öğrencileri ve personeli için geliştirilmiş, kurumsal kimliğe uygun modern bir sosyal ağ ve kampüs yönetim platformu.

## 🚀 Teknolojik Altyapı
Bu proje modern bir **Monorepo** mimarisi kullanılarak iki ana parçaya ayrılmıştır:
* **Frontend (Arayüz):** React.js + Vite
* **Backend (Sunucu):** .NET Core (C#) + Entity Framework Core + MYSQL

---

## 💻 Kurulum ve Çalıştırma

Projeyi bilgisayarınızda (lokalde) çalıştırmak için aşağıdaki adımları izleyin:

### 1. Backend (API) Kurulumu
1. Terminalde `backend/DijitalKampus.API` dizinine gidin.
2. Gerekli paketleri indirmek için: `dotnet restore`
3. Veritabanını oluşturmak için: `dotnet ef database update`
4. Projeyi ayağa kaldırmak için: `dotnet run`
   *(API varsayılan olarak `http://localhost:5000` veya `5181` portunda çalışacaktır).*

### 2. Frontend (React) Kurulumu
1. Yeni bir terminal açıp `frontend` dizinine gidin.
2. Bağımlılıkları (kütüphaneleri) indirmek için: `npm install`
3. Projeyi ayağa kaldırmak için: `npm run dev`
   *(Arayüz varsayılan olarak `http://localhost:5173` portunda açılacaktır).*

---

## 🏗️ Proje Mimarisi ve Ekip Kuralları

Ekip içi çakışmaları (conflict) önlemek ve temiz kod yazmak için aşağıdaki kurallara uyulmalıdır:

### 📂 Klasör Ağacı (Özet)
```text
dijital-kampus/
├── frontend/src/
│   ├── components/layout/    # Sabit şablonlar (Header, Sidebar)
│   ├── pages/                # Ana Sayfalar (Feed, Profile)
│   └── services/             # API çağrıları (Axios)
│
└── backend/DijitalKampus.API/
    ├── Controllers/          # İstekleri karşılayan yönlendiriciler
    ├── Models/               # Veritabanı tabloları
    └── DataAccess/           # Veritabanı (SQL) işlemleri
```

### 📂 Frontend (React) Klasör Kuralları
Tüm arayüz kodları `frontend/src/` altındadır.
- **`pages/`**: Ekranda gördüğümüz tam sayfalar buradadır (Örn: `FeedPage.jsx`, `ProfilePage.jsx`).
- **`components/layout/`**: Projenin sabit şablon parçaları buradadır (Örn: `Header.jsx`, `LeftSidebar.jsx`). Sayfalar geliştirilirken bu şablonun ortasına yerleştirilir.
- **`services/api.js`**: Backend'e giden tüm veri istekleri (Axios) sadece bu dosya üzerinden yapılır. Bileşenlerin (sayfaların) içine doğrudan API isteği yazılmaz.

### ⚙️ Backend (.NET) Klasör Kuralları
Tüm sunucu kodları `backend/DijitalKampus.API/` altındadır.
- **`Controllers/`**: Sadece Frontend'den gelen HTTP isteklerini karşılar.
- **`Models/`**: Veritabanı tablolarımızı temsil eder (Örn: `User.cs`, `Post.cs`).
- **`DataAccess/`**: Veritabanına (SQLite) yapılan tüm sorgu ve ekleme işlemleri sadece burada yapılır.

---

## 🌿 Git ve Branch (Dal) Stratejisi

Lütfen projeye doğrudan `main` veya `development` dalında kod **YAZMAYIN!**
Her yeni özellik ekleyeceğinizde veya tasarım yapacağınızda kendinize bir dal açın:

1. Güncel kodları çekin: `git checkout development` -> `git pull origin development`
2. Kendi dalınızı oluşturun: `git checkout -b feature/kendi-ozelliginiz` (Örn: `feature/profil-sayfasi`)
3. Kodunuzu yazın, test edin.
4. Kodunuzu GitHub'a gönderin ve GitHub üzerinden bir **Pull Request (PR)** açarak ekip arkadaşlarınızdan onay isteyin. Onaylandıktan sonra kodunuz `development` dalına birleştirilecektir.
