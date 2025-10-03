import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HomePage from '@/pages/HomePage';
import SearchPage from '@/pages/SearchPage';
import StudyPage from '@/pages/StudyPage';
import NotesPage from '@/pages/NotesPage';
import FlashcardsPage from '@/pages/FlashcardsPage';
import ComparePage from '@/pages/ComparePage';
import AnalysisPage from '@/pages/AnalysisPage';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Sessions from '@/pages/Sessions';
import Profile from '@/pages/Profile';
import NotFoundPage from '@/pages/NotFoundPage';

import { useTheme } from '@/contexts/ThemeContext';

const App: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className={`app ${theme}`} data-bs-theme={theme}>
      <Navbar />
      <main className="main-content">
        <Container fluid className="py-4">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/study" element={<StudyPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/flashcards" element={<FlashcardsPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default App;