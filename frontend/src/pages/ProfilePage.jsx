import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast'; // 1. TOAST KÜTÜPHANESİ EKLENDİ

const ProfilePage = () => {
  const userId = 1; 
  const API_BASE_URL = 'http://localhost:5181/api';

  // --- STATE'LER ---
  const [bio, setBio] = useState('Yükleniyor...');
  const [projects, setProjects] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [profileExists, setProfileExists] = useState(false);

  const [showCertForm, setShowCertForm] = useState(false);
  const [newCert, setNewCert] = useState({ name: '' });

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');

  const [showProjectForm, setShowProjectForm] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', link: '', description: '' });

  // --- 1. VERİ ÇEKME ---
  useEffect(() => {
    axios.get(`${API_BASE_URL}/profiles/${userId}`)
      .then(response => {
        const data = response.data;
        if (data) {
          setBio(data.biography || 'Henüz bir biyografi eklenmemiş.');
          setProjects(data.projects || []);
          setCertificates(data.certificates || []);
          setProfileExists(true);
        } else {
          setBio('Henüz bir biyografi eklenmemiş.');
          setProfileExists(false);
        }
      })
      .catch(error => {
        console.log("Profil çekilirken hata:", error);
        setBio("Henüz bir biyografi eklenmemiş.");
        setProfileExists(false);
      });
  }, [userId]);

  // --- 2. FONKSİYONLAR ---
  const handleBioSave = () => {
    const payload = {
      userId: userId,
      UserId: userId,        
      departmentId: 1, 
      DepartmentId: 1,
      biography: newBio,
      Biography: newBio
    };

    const request = profileExists 
      ? axios.put(`${API_BASE_URL}/profiles/${userId}`, payload)
      : axios.post(`${API_BASE_URL}/profiles`, payload);

    request
      .then(() => {
        setBio(newBio); 
        setIsEditingBio(false); 
        setProfileExists(true);
        
        // ALERT YERİNE TOAST GELDİ
        toast.success('Biyografi başarıyla kaydedildi! 🎉');
      })
      .catch(error => {
        console.error("Biyografi kaydedilemedi! Detay:", error.response?.data);
        
        // HATA TOAST'U
        toast.error('Biyografi kaydedilirken bir hata oluştu!');
      });
  };

  const handleAddProject = () => {
    if (newProject.title.trim() === '') return;

    const payload = {
      studentProfileId: userId,
      StudentProfileId: userId, 
      title: newProject.title,
      Title: newProject.title,
      link: newProject.link,
      Link: newProject.link,
      description: newProject.description,
      Description: newProject.description
    };

    axios.post(`${API_BASE_URL}/portfolio/projects`, payload)
      .then(response => {
        setProjects([...projects, response.data]); 
        setNewProject({ title: '', link: '', description: '' }); 
        setShowProjectForm(false); 
        
        // ALERT YERİNE TOAST GELDİ
        toast.success('Proje başarıyla eklendi! 🚀');
      })
      .catch(error => {
        console.error("Proje ekleme hatası:", error.response?.data);
        toast.error('Proje eklenirken bir hata oluştu!');
      });
  };

  const handleAddCert = () => {
    if (newCert.name.trim() === '') return;

    const payload = {
      studentProfileId: userId,
      StudentProfileId: userId, 
      name: newCert.name,
      Name: newCert.name
    };

    axios.post(`${API_BASE_URL}/portfolio/certificates`, payload)
      .then(response => {
        setCertificates([...certificates, response.data]);
        setNewCert({ name: '' });
        setShowCertForm(false);
        
        // ALERT YERİNE TOAST GELDİ
        toast.success('Sertifika başarıyla eklendi! 🏆');
      })
      .catch(error => {
        console.error("Sertifika ekleme hatası:", error.response?.data);
        toast.error('Sertifika eklenirken bir hata oluştu!');
      });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#036264', fontWeight: 'bold', margin: 0, fontSize: '24px' }}>Profilim & Portfolyom</h2>
      </div>

      {/* BİYOGRAFİ KARTI */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '24px', border: '1px solid #eef2f6' }}>
        <h3 style={{ color: '#333', fontSize: '18px', marginBottom: '16px' }}>Biyografi</h3>
        {isEditingBio ? (
          <div>
            <textarea 
              style={{ width: '100%', minHeight: '100px', borderRadius: '8px', border: '1px solid #ccc', padding: '12px', marginBottom: '12px', outlineColor: '#036264' }}
              value={newBio} 
              onChange={(e) => setNewBio(e.target.value)} 
              placeholder="Kendinden bahset..."
            />
            <div>
              <button onClick={handleBioSave} style={{ backgroundColor: '#036264', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', marginRight: '10px', fontWeight: '500' }}>Kaydet</button>
              <button onClick={() => setIsEditingBio(false)} style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '8px 20px', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>İptal</button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ color: '#555', lineHeight: '1.6', marginBottom: '16px' }}>{bio}</p>
            <button 
              onClick={() => { 
                setIsEditingBio(true); 
                setNewBio(bio === 'Henüz bir biyografi eklenmemiş.' ? '' : bio); 
              }} 
              style={{ backgroundColor: '#e2f0f0', color: '#036264', padding: '8px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
              Düzenle
            </button>
          </div>
        )}
      </div>

      {/* PROJELER KARTI */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '24px', border: '1px solid #eef2f6' }}>
        <h3 style={{ color: '#333', fontSize: '18px', marginBottom: '16px' }}>Projeler & Çalışmalar</h3>
        
        {projects.length === 0 ? (
            <p style={{ color: '#888' }}>Henüz eklenmiş bir proje yok.</p>
        ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
                {projects.map((proj, index) => (
                    <div key={index} style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: '#0f172a', fontSize: '16px' }}>{proj.title || proj.Title}</strong>
                            <a href={proj.link || proj.Link} target="_blank" rel="noreferrer" style={{ color: '#0284c7', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>İncele ↗</a>
                        </div>
                        <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '14px' }}>{proj.description || proj.Description}</p>
                    </div>
                ))}
            </div>
        )}

        {showProjectForm ? (
            <div style={{ marginTop: '20px', padding: '16px', border: '1px dashed #cbd5e1', borderRadius: '12px', backgroundColor: '#fafafa' }}>
                <input type="text" placeholder="Proje Adı" value={newProject.title} onChange={(e) => setNewProject({...newProject, title: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
                <input type="text" placeholder="Proje Linki (Github vb.)" value={newProject.link} onChange={(e) => setNewProject({...newProject, link: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
                <textarea placeholder="Proje Açıklaması" value={newProject.description} onChange={(e) => setNewProject({...newProject, description: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ccc', minHeight: '60px' }} />
                
                <button onClick={handleAddProject} style={{ backgroundColor: '#036264', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', marginRight: '10px' }}>Ekle</button>
                <button onClick={() => setShowProjectForm(false)} style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '8px 20px', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>İptal</button>
            </div>
        ) : (
            <button onClick={() => setShowProjectForm(true)} style={{ backgroundColor: '#036264', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '16px', fontWeight: '500' }}>+ Yeni Proje Ekle</button>
        )}
      </div>

      {/* SERTİFİKALAR KARTI */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #eef2f6' }}>
        <h3 style={{ color: '#333', fontSize: '18px', marginBottom: '16px' }}>Sertifikalar</h3>
        
        {certificates.length === 0 ? (
            <p style={{ color: '#888' }}>Henüz eklenmiş bir sertifika yok.</p>
        ) : (
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {certificates.map((cert, index) => (
                    <li key={index} style={{ backgroundColor: '#e2f0f0', color: '#036264', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '500' }}>
                        🏆 {cert.name || cert.Name}
                    </li>
                ))}
            </ul>
        )}
        
        {showCertForm ? (
            <div style={{ marginTop: '20px', padding: '16px', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
                <input type="text" placeholder="Sertifika Adı (Örn: React Bootcamp)" value={newCert.name} onChange={(e) => setNewCert({ name: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
                <button onClick={handleAddCert} style={{ backgroundColor: '#036264', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', marginRight: '10px' }}>Ekle</button>
                <button onClick={() => setShowCertForm(false)} style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '8px 20px', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>İptal</button>
            </div>
        ) : (
            <button onClick={() => setShowCertForm(true)} style={{ backgroundColor: '#036264', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '16px', fontWeight: '500' }}>+ Yeni Sertifika</button>
        )}
      </div>

    </div>
  );
};

export default ProfilePage;