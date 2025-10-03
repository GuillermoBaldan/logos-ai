import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Book, Search, BookOpen, StickyNote, Layers, BarChart3 } from 'lucide-react';

import { useTheme } from '@/contexts/ThemeContext';

const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navItems = [
    { path: '/search', label: 'Buscar', icon: Search },
    { path: '/study', label: 'Estudio', icon: BookOpen },
    { path: '/notes', label: 'Notas', icon: StickyNote },
    { path: '/flashcards', label: 'Flashcards', icon: Layers },
    { path: '/compare', label: 'Comparar', icon: BarChart3 },
    { path: '/analysis', label: 'Análisis', icon: Book },
  ];

  return (
    <BootstrapNavbar bg={theme === 'dark' ? 'dark' : 'light'} variant={theme} expand="lg" sticky="top" className="shadow-sm">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/" className="fw-bold d-flex align-items-center">
          <Book className="me-2" size={24} />
          Logos AI
        </BootstrapNavbar.Brand>
        
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Nav.Link
                key={path}
                as={Link}
                to={path}
                className={`d-flex align-items-center ${location.pathname === path ? 'active' : ''}`}
              >
                <Icon size={16} className="me-1" />
                {label}
              </Nav.Link>
            ))}
          </Nav>
          
          <div className="d-flex align-items-center">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={toggleTheme}
              className="d-flex align-items-center"
              aria-label={`Cambiar a tema ${theme === 'light' ? 'oscuro' : 'claro'}`}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </Button>
          </div>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;