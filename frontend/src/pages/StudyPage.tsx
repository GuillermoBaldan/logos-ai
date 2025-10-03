import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Spinner, Alert } from 'react-bootstrap';
import { BookOpen, Play, Clock, FileText, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { summarizeAPI } from '@/services/api';

interface StudySession {
  id: string;
  title: string;
  passage: string;
  duration: number;
  summary: string;
  keyPoints: string[];
  questions: string[];
  createdAt: string;
}

const StudyPage: React.FC = () => {
  const [selectedPassage, setSelectedPassage] = useState('');
  const [studyType, setStudyType] = useState<'quick' | 'detailed' | 'thematic'>('quick');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);

  const { data: recentSessions, isLoading: loadingSessions } = useQuery({
    queryKey: ['recent-study-sessions'],
    queryFn: () => summarizeAPI.getUserHistory(),
  });

  const handleStartStudy = async () => {
    if (!selectedPassage.trim()) return;

    setIsGenerating(true);
    try {
      // Simular generación de sesión de estudio
      const response = await summarizeAPI.generateSummary({
        text: selectedPassage,
        type: studyType,
        language: 'es',
      });

      const newSession: StudySession = {
        id: Date.now().toString(),
        title: `Estudio de ${selectedPassage}`,
        passage: selectedPassage,
        duration: 0,
        summary: response.summary,
        keyPoints: response.keyPoints || [],
        questions: response.questions || [],
        createdAt: new Date().toISOString(),
      };

      setCurrentSession(newSession);
    } catch (error) {
      console.error('Error generating study session:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const studyTypes = [
    {
      value: 'quick',
      label: 'Estudio Rápido',
      description: 'Resumen conciso y puntos clave (5-10 min)',
      duration: '5-10 min',
    },
    {
      value: 'detailed',
      label: 'Estudio Detallado',
      description: 'Análisis profundo con contexto histórico (20-30 min)',
      duration: '20-30 min',
    },
    {
      value: 'thematic',
      label: 'Estudio Temático',
      description: 'Conexiones temáticas y aplicaciones prácticas (15-25 min)',
      duration: '15-25 min',
    },
  ];

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <div className="d-flex align-items-center mb-4">
            <BookOpen className="me-2 text-primary" size={32} />
            <h1 className="mb-0">Estudio Guiado</h1>
          </div>
        </Col>
      </Row>

      {!currentSession ? (
        <>
          {/* Study Setup */}
          <Row className="mb-4">
            <Col lg={8}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">
                    <Play size={20} className="me-2" />
                    Iniciar Nueva Sesión de Estudio
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Pasaje o Tema a Estudiar</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Ej: Juan 3:16, El amor de Dios, Salmo 23, etc."
                        value={selectedPassage}
                        onChange={(e) => setSelectedPassage(e.target.value)}
                      />
                      <Form.Text className="text-muted">
                        Puedes ingresar una referencia bíblica, un tema específico o un pasaje completo.
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Tipo de Estudio</Form.Label>
                      <Row className="g-3">
                        {studyTypes.map((type) => (
                          <Col md={4} key={type.value}>
                            <Card 
                              className={`study-type-card ${studyType === type.value ? 'border-primary' : ''}`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => setStudyType(type.value as any)}
                            >
                              <Card.Body className="text-center">
                                <Form.Check
                                  type="radio"
                                  name="studyType"
                                  value={type.value}
                                  checked={studyType === type.value}
                                  onChange={() => setStudyType(type.value as any)}
                                  className="mb-2"
                                />
                                <h6>{type.label}</h6>
                                <p className="small text-muted mb-2">{type.description}</p>
                                <Badge bg="outline-primary">{type.duration}</Badge>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </Form.Group>

                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleStartStudy}
                      disabled={!selectedPassage.trim() || isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Generando Estudio...
                        </>
                      ) : (
                        <>
                          <Play size={20} className="me-2" />
                          Comenzar Estudio
                        </>
                      )}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card>
                <Card.Header>
                  <h6 className="mb-0">
                    <Clock size={16} className="me-2" />
                    Sesiones Recientes
                  </h6>
                </Card.Header>
                <Card.Body>
                  {loadingSessions ? (
                    <div className="text-center py-3">
                      <Spinner animation="border" size="sm" />
                    </div>
                  ) : recentSessions && recentSessions.length > 0 ? (
                    <div className="recent-sessions">
                      {recentSessions.slice(0, 5).map((session: any) => (
                        <div key={session.id} className="recent-session-item mb-3 p-2 border rounded">
                          <h6 className="mb-1">{session.title}</h6>
                          <small className="text-muted">
                            {new Date(session.createdAt).toLocaleDateString()}
                          </small>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="mt-2 w-100"
                            onClick={() => setCurrentSession(session)}
                          >
                            Continuar
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted text-center py-3">
                      No hay sesiones recientes
                    </p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        /* Active Study Session */
        <Row>
          <Col>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{currentSession.title}</h5>
                <div>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="me-2"
                    onClick={() => setCurrentSession(null)}
                  >
                    Nueva Sesión
                  </Button>
                  <Button variant="outline-primary" size="sm">
                    <Download size={16} className="me-1" />
                    Exportar
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col lg={8}>
                    <div className="study-content">
                      <div className="mb-4">
                        <h6>
                          <FileText size={16} className="me-2" />
                          Resumen
                        </h6>
                        <p className="study-summary">{currentSession.summary}</p>
                      </div>

                      {currentSession.keyPoints.length > 0 && (
                        <div className="mb-4">
                          <h6>Puntos Clave</h6>
                          <ul className="key-points-list">
                            {currentSession.keyPoints.map((point, index) => (
                              <li key={index} className="mb-2">{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {currentSession.questions.length > 0 && (
                        <div className="mb-4">
                          <h6>Preguntas para Reflexión</h6>
                          <div className="reflection-questions">
                            {currentSession.questions.map((question, index) => (
                              <Card key={index} className="mb-2">
                                <Card.Body className="py-2">
                                  <p className="mb-0">{question}</p>
                                </Card.Body>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Col>

                  <Col lg={4}>
                    <Card className="study-sidebar">
                      <Card.Header>
                        <h6 className="mb-0">Información de la Sesión</h6>
                      </Card.Header>
                      <Card.Body>
                        <div className="session-info">
                          <div className="mb-3">
                            <strong>Pasaje:</strong>
                            <p className="mb-0">{currentSession.passage}</p>
                          </div>
                          <div className="mb-3">
                            <strong>Tipo:</strong>
                            <Badge bg="primary" className="ms-2">
                              {studyTypes.find(t => t.value === studyType)?.label}
                            </Badge>
                          </div>
                          <div className="mb-3">
                            <strong>Iniciado:</strong>
                            <p className="mb-0">
                              {new Date(currentSession.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default StudyPage;