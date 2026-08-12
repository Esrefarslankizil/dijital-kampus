import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Stories = () => {
    const [stories, setStories] = useState([]);
    const [selectedStory, setSelectedStory] = useState(null);

    // 1. Hikayeleri çek
    useEffect(() => {
        const fetchStories = async () => {
            try {
                const response = await axios.get('http://localhost:5181/api/Story/active');
                setStories(response.data);
            } catch (error) {
                console.error("Hikayeler yüklenirken hata oluştu:", error);
            }
        };
        fetchStories();
    }, []);

    // 2. Yeni hikaye yükle
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("userId", 1); // İleride bunu Auth sisteminden gelen gerçek ID ile değiştireceğiz
        formData.append("file", file);

        try {
            await axios.post('http://localhost:5181/api/Story/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Hikaye başarıyla yüklendi!");
            window.location.reload();
        } catch (error) {
            console.error("Yükleme hatası:", error);
            alert("Yükleme başarısız oldu.");
        }
    };

    return (
        <>
        <div className="stories-container" style={{ display: 'flex', gap: '15px', overflowX: 'auto', padding: '10px' }}>
            {/* Mevcut Hikayeleri Listele */}
            {stories.map(story => (
                <div key={story.id} className="story-item" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setSelectedStory(story)}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid red', overflow: 'hidden' }}>
                        <img src={story.mediaPath} alt="Hikaye" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                </div>
            ))}

            {/* Yeni Hikaye Ekle Butonu */}
            <label className="add-story" style={{ textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    +
                </div>
                <input type="file" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
        </div>

        {/* Hikaye Görüntüleme Modalı */}
            {selectedStory && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, width: '100%', height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.9)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        zIndex: 9999,
                        backdropFilter: 'blur(5px)'
                    }}
                    onClick={() => setSelectedStory(null)}
                >
                    <img 
                        src={selectedStory.mediaPath} 
                        alt="Tam Ekran Hikaye" 
                        style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '15px', objectFit: 'contain', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} 
                        onClick={(e) => e.stopPropagation()} 
                    />
                    <button 
                        onClick={() => setSelectedStory(null)}
                        style={{
                            position: 'absolute', top: '20px', right: '30px',
                            background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                            fontSize: '30px', cursor: 'pointer', width: '50px', height: '50px',
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.3s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.4)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                    >
                        &times;
                    </button>
                </div>
            )}
        </>
    );
};

export default Stories;
