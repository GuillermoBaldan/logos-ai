import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useTheme } from '@/contexts/ThemeContext';

const Footer: React.FC = () => {
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`mt-auto py-4 border-top ${theme === 'dark' ? 'bg-dark' : 'bg-light'}`}>
      <Container>
        <Row>
          <Col md={6}>
            <p className="mb-0 text-muted">
              © {currentYear} Logos AI. Plataforma inteligente para el análisis de textos bíblicos.
            </p>
          </Col>
          <Col md={6} className="text-md-end">
            <p className="mb-0 text-muted">
              Desarrollado con ❤️ para el estudio de la Palabra
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;