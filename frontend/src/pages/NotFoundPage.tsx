import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Home, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="text-center">
            <Card.Body className="py-5">
              <AlertTriangle size={64} className="text-warning mb-4" />
              <h1 className="display-4 mb-3">404</h1>
              <h2 className="h4 mb-3">Página no encontrada</h2>
              <p className="text-muted mb-4">
                Lo sentimos, la página que buscas no existe o ha sido movida.
              </p>
              <div className="d-flex gap-3 justify-content-center">
                <Button as={Link} to="/" variant="primary" size="lg">
                  <Home size={20} className="me-2" />
                  Volver al Inicio
                </Button>
                <Button as={Link} to="/search" variant="outline-primary" size="lg">
                  Ir a Búsqueda
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFoundPage;