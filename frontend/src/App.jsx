import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import FeedPage from './pages/FeedPage';
import OnboardingPage from './pages/OnboardingPage';

import BadgesPage from './pages/BadgesPage';
import GroupsPage from './pages/GroupsPage';
import EventsPage from './pages/EventsPage';
import MessagesPage from './pages/MessagesPage';
import ProfilePage from './pages/ProfilePage';

function AppContent() {
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);
  const location = useLocation();

  const hideHeaderRoutes = ['/login', '/onboarding', '/'];
  const shouldShowHeader = !hideHeaderRoutes.includes(location.pathname);

  return (
    <>
      <div className="main-wrap">
        {shouldShowHeader && (
          <Header 
            onOpenLogin={() => setLoginModalOpen(true)} 
            onOpenRegister={() => setRegisterModalOpen(true)} 
          />
        )}
        
        <Routes>
          {/* Ana Sayfa giriş ekranına yönlendirir */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          {/* Giriş ve Kayıt Ekranı */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* İlk Kayıt Sihirbazı */}
          <Route path="/onboarding" element={<OnboardingPage />} />
          
          {/* Dijital Kampüs Ana Akış */}
          <Route path="/feed" element={<FeedPage />} />

          {/* Yeni Sayfalar */}
          <Route path="/badges" element={<BadgesPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
      />
      <RegisterModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setRegisterModalOpen(false)} 
      />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
