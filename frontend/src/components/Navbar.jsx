import React, { useState } from 'react';
import axios from 'axios';

const Navbar = () => {
    const [keyword, setKeyword] = useState("");
    const [results, setResults] = useState([]);

    const handleSearch = async (e) => {
        const val = e.target.value;
        setKeyword(val);
        if (val.length > 2) {
            try {
                const response = await axios.get(`http://localhost:5181/api/Follow/search?keyword=${val}`);
                setResults(response.data);
            } catch (error) {
                console.error("Arama hatası:", error);
            }
        } else {
            setResults([]);
        }
    };

    return (
        <nav style={{
            backgroundColor: '#fff',
            padding: '15px 50px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            fontFamily: 'Arial, sans-serif'
        }}>
            {/* Logo */}
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00A859' }}>
                Dijital Kampüs
            </div>

            {/* Arama Kutusu */}
            <div style={{ position: 'relative', width: '400px',display:'flex' }}>
                <input
                    type="text"
                    placeholder="Kullanıcı ara..."
                    value={keyword}
                    onChange={handleSearch}
                    style={{
                        padding: '13px 20px',
                        borderRadius: '25px',
                        border: '1px solid #ddd',
                        width: '100%',
                        outline: 'none'
                    }}
                />

                {/* Arama Sonuçları */}
                {results.length > 0 && (
                    <ul style={{
                        position: 'absolute',
                        top: '50px',
                        left: 0,
                        background: '#fff',
                        width: '100%',
                        listStyle: 'none',
                        border: '1px solid #ddd',
                        borderRadius: '10px',
                        padding: '10px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        zIndex: 1000
                    }}>
                        {results.map(user => (
                            <li key={user.id} style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                                <strong>{user.firstName} {user.lastName}</strong> <span style={{ fontSize: '12px', color: '#727271' }}>({user.email})</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            
        </nav>
    );
};

export default Navbar;
