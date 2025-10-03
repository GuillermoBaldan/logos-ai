import React from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Search, BookOpen, StickyNote, Layers, BarChart3, Book, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  
  const features = [
    {
      icon: Search,
      title: 'Búsqueda Inteligente',
      description: 'Encuentra versículos y pasajes con búsqueda semántica avanzada',
      link: '/search',
      color: 'primary',
    },
    {
      icon: Book,
      title: 'Análisis Lingüístico',
      description: 'Analiza textos en idiomas originales con herramientas de IA',
      link: '/analysis',
      color: 'success',
    },
    {
      icon: BookOpen,
      title: 'Estudio Guiado',
      description: 'Sesiones de estudio estructuradas con resúmenes automáticos',
      link: '/study',
      color: 'info',
    },
    {
      icon: StickyNote,
      title: 'Notas Personales',
      description: 'Organiza tus reflexiones y estudios de manera inteligente',
      link: '/notes',
      color: 'warning',
    },
    {
      icon: Layers,
      title: 'Flashcards',
      description: 'Memoriza versículos y conceptos con repetición espaciada',
      link: '/flashcards',
      color: 'secondary',
    },
    {
      icon: BarChart3,
      title: 'Comparación',
      description: 'Compara versiones bíblicas y analiza diferencias',
      link: '/compare',
      color: 'danger',
    },
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <Container className="py-5">
        <Row className="text-center mb-5">
          <Col>
            <h1 className="display-4 fw-bold mb-3">
              Logos AI
            </h1>
            <p className="lead mb-4">
              Plataforma inteligente para el análisis profundo de textos bíblicos
            </p>
            <p className="text-muted mb-4">
              Utiliza inteligencia artificial para explorar las Escrituras con mayor profundidad,
              desde análisis lingüístico hasta estudios temáticos personalizados.
            </p>
            <div className="d-flex gap-3 justify-content-center">
              <Button as={Link} to="/search" variant="primary" size="lg">
                Comenzar Búsqueda
              </Button>
              <Button as={Link} to="/study" variant="outline-primary" size="lg">
                Iniciar Estudio
              </Button>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Welcome Message for Authenticated Users */}
      {isAuthenticated && user && (
        <Container className="py-3">
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              <Alert variant="success" className="text-center border-0 shadow-sm">
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <User size={24} className="me-2" />
                  <h4 className="mb-0 fw-bold">¡Bienvenido {user.name}!</h4>
                </div>
                <p className="mb-0 text-muted">
                  Nos alegra verte de nuevo. ¿Listo para continuar tu estudio bíblico?
                </p>
              </Alert>
            </Col>
          </Row>
        </Container>
      )}

      {/* Features Section */}
      <Container className="py-5">
        <Row className="mb-5">
          <Col className="text-center">
            <h2 className="h1 mb-3">Funcionalidades Principales</h2>
            <p className="lead text-muted">
              Herramientas diseñadas para enriquecer tu estudio bíblico
            </p>
          </Col>
        </Row>
        
        <Row className="g-4">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Col key={index} md={6} lg={4}>
                <Card className="h-100 shadow-sm border-0 feature-card">
                  <Card.Body className="d-flex flex-column text-center p-4">
                    <div className={`text-${feature.color} mb-3`}>
                      <IconComponent size={48} />
                    </div>
                    <Card.Title className="h4 mb-3">{feature.title}</Card.Title>
                    <Card.Text className="text-muted mb-4 flex-grow-1">
                      {feature.description}
                    </Card.Text>
                    <Button 
                      as={Link} 
                      to={feature.link} 
                      variant={`outline-${feature.color}`}
                      className="mt-auto"
                    >
                      Explorar
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>

      {/* Stats Section */}
      <Container className="py-5">
        <Row className="text-center">
          <Col md={3} sm={6} className="mb-4">
            <div className="stat-item">
              <h3 className="display-6 fw-bold text-primary">66</h3>
              <p className="text-muted">Libros Bíblicos</p>
            </div>
          </Col>
          <Col md={3} sm={6} className="mb-4">
            <div className="stat-item">
              <h3 className="display-6 fw-bold text-success">31,000+</h3>
              <p className="text-muted">Versículos</p>
            </div>
          </Col>
          <Col md={3} sm={6} className="mb-4">
            <div className="stat-item">
              <h3 className="display-6 fw-bold text-info">3</h3>
              <p className="text-muted">Idiomas Originales</p>
            </div>
          </Col>
          <Col md={3} sm={6} className="mb-4">
            <div className="stat-item">
              <h3 className="display-6 fw-bold text-warning">∞</h3>
              <p className="text-muted">Posibilidades de Estudio</p>
            </div>
          </Col>
        </Row>
      </Container>

      {/* CTA Section */}
      <Container className="py-5">
        <Row>
          <Col>
            <Card className="bg-primary text-white text-center border-0">
              <Card.Body className="py-5">
                <h2 className="h1 mb-3">¿Listo para profundizar en la Palabra?</h2>
                <p className="lead mb-4">
                  Únete a miles de estudiantes que ya utilizan Logos AI para enriquecer su comprensión bíblica
                </p>
                <Button as={Link} to="/search" variant="light" size="lg">
                  Comenzar Ahora
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default HomePage;