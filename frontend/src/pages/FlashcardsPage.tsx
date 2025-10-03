import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, ProgressBar } from 'react-bootstrap';
import { Layers, Play, RotateCcw, CheckCircle, XCircle, Brain, Trophy } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flashcardsAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  passage?: string;
}

interface StudySession {
  id: string;
  flashcards: Flashcard[];
  currentIndex: number;
  correctAnswers: number;
  totalAnswers: number;
  isActive: boolean;
}

const FlashcardsPage: React.FC = () => {
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const queryClient = useQueryClient();

  const { data: flashcards, isLoading: loadingFlashcards } = useQuery({
    queryKey: ['flashcards', selectedCategory],
    queryFn: () => flashcardsAPI.getFlashcards({ 
      category: selectedCategory !== 'all' ? selectedCategory : undefined 
    }),
  });

  const { data: categories } = useQuery({
    queryKey: ['flashcard-categories'],
    queryFn: () => flashcardsAPI.getCategories(),
  });

  const startSessionMutation = useMutation({
    mutationFn: flashcardsAPI.startStudySession,
    onSuccess: (session) => {
      setActiveSession({
        ...session,
        currentIndex: 0,
        correctAnswers: 0,
        totalAnswers: 0,
        isActive: true,
      });
      setShowAnswer(false);
      toast.success('Sesión de estudio iniciada');
    },
    onError: () => {
      toast.error('Error al iniciar la sesión');
    },
  });

  const recordAnswerMutation = useMutation({
    mutationFn: flashcardsAPI.recordAnswer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
    },
  });

  const handleStartSession = () => {
    if (!flashcards || flashcards.length === 0) {
      toast.error('No hay flashcards disponibles para estudiar');
      return;
    }

    startSessionMutation.mutate({
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      count: Math.min(flashcards.length, 20), // Máximo 20 tarjetas por sesión
    });
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (!activeSession) return;

    const currentCard = activeSession.flashcards[activeSession.currentIndex];
    
    // Registrar respuesta
    recordAnswerMutation.mutate({
      sessionId: activeSession.id,
      flashcardId: currentCard.id,
      isCorrect,
      responseTime: 5000, // Placeholder
    });

    // Actualizar sesión local
    const updatedSession = {
      ...activeSession,
      correctAnswers: activeSession.correctAnswers + (isCorrect ? 1 : 0),
      totalAnswers: activeSession.totalAnswers + 1,
    };

    // Avanzar a la siguiente tarjeta
    if (activeSession.currentIndex < activeSession.flashcards.length - 1) {
      setActiveSession({
        ...updatedSession,
        currentIndex: activeSession.currentIndex + 1,
      });
      setShowAnswer(false);
    } else {
      // Sesión completada
      setActiveSession({ ...updatedSession, isActive: false });
      toast.success(`Sesión completada! ${updatedSession.correctAnswers}/${updatedSession.totalAnswers} correctas`);
    }
  };

  const handleResetSession = () => {
    setActiveSession(null);
    setShowAnswer(false);
  };

  const currentCard = activeSession ? activeSession.flashcards[activeSession.currentIndex] : null;
  const progress = activeSession ? ((activeSession.currentIndex + 1) / activeSession.flashcards.length) * 100 : 0;
  const accuracy = activeSession && activeSession.totalAnswers > 0 
    ? (activeSession.correctAnswers / activeSession.totalAnswers) * 100 
    : 0;

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center">
              <Layers className="me-2 text-primary" size={32} />
              <h1 className="mb-0">Flashcards</h1>
            </div>
            {!activeSession && (
              <Button 
                variant="primary" 
                onClick={handleStartSession}
                disabled={startSessionMutation.isPending || !flashcards || flashcards.length === 0}
              >
                <Play size={20} className="me-2" />
                Iniciar Estudio
              </Button>
            )}
          </div>
        </Col>
      </Row>

      {!activeSession ? (
        /* Setup View */
        <>
          {/* Category Selection */}
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Body>
                  <h5 className="mb-3">Seleccionar Categoría</h5>
                  <div className="d-flex flex-wrap gap-2">
                    <Button
                      variant={selectedCategory === 'all' ? 'primary' : 'outline-primary'}
                      onClick={() => setSelectedCategory('all')}
                    >
                      Todas las categorías
                    </Button>
                    {categories?.map((category: string) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? 'primary' : 'outline-primary'}
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Flashcards Preview */}
          <Row>
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">
                    Flashcards Disponibles
                    {flashcards && (
                      <Badge bg="primary" className="ms-2">
                        {flashcards.length}
                      </Badge>
                    )}
                  </h5>
                </Card.Header>
                <Card.Body>
                  {loadingFlashcards ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-3 text-muted">Cargando flashcards...</p>
                    </div>
                  ) : flashcards && flashcards.length > 0 ? (
                    <Row className="g-3">
                      {flashcards.slice(0, 6).map((card: Flashcard) => (
                        <Col key={card.id} md={6} lg={4}>
                          <Card className="flashcard-preview h-100">
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <Badge bg="outline-secondary">{card.category}</Badge>
                                <Badge 
                                  bg={
                                    card.difficulty === 'easy' ? 'success' :
                                    card.difficulty === 'medium' ? 'warning' : 'danger'
                                  }
                                >
                                  {card.difficulty}
                                </Badge>
                              </div>
                              <h6 className="card-title">{card.question}</h6>
                              {card.passage && (
                                <small className="text-muted">{card.passage}</small>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <div className="text-center py-4">
                      <Layers size={64} className="text-muted mb-3" />
                      <h4 className="text-muted">No hay flashcards disponibles</h4>
                      <p className="text-muted">
                        {selectedCategory !== 'all' 
                          ? `No hay flashcards en la categoría "${selectedCategory}".`
                          : 'No hay flashcards creadas aún.'
                        }
                      </p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        /* Study Session View */
        <>
          {/* Session Header */}
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">
                      Sesión de Estudio
                      {activeSession.isActive && (
                        <Badge bg="success" className="ms-2">Activa</Badge>
                      )}
                    </h5>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={handleResetSession}
                    >
                      <RotateCcw size={16} className="me-1" />
                      Reiniciar
                    </Button>
                  </div>

                  <Row className="g-3">
                    <Col md={6}>
                      <div className="session-stat">
                        <small className="text-muted">Progreso</small>
                        <ProgressBar 
                          now={progress} 
                          label={`${activeSession.currentIndex + 1}/${activeSession.flashcards.length}`}
                          className="mb-1"
                        />
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="session-stat">
                        <small className="text-muted">Precisión</small>
                        <div className="d-flex align-items-center">
                          <Brain size={16} className="me-1 text-info" />
                          <strong>{accuracy.toFixed(0)}%</strong>
                        </div>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="session-stat">
                        <small className="text-muted">Puntuación</small>
                        <div className="d-flex align-items-center">
                          <Trophy size={16} className="me-1 text-warning" />
                          <strong>{activeSession.correctAnswers}/{activeSession.totalAnswers}</strong>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Current Flashcard */}
          {currentCard && activeSession.isActive ? (
            <Row>
              <Col>
                <Card className="flashcard-study">
                  <Card.Body className="text-center py-5">
                    <div className="mb-3">
                      <Badge bg="outline-primary">{currentCard.category}</Badge>
                      <Badge 
                        bg={
                          currentCard.difficulty === 'easy' ? 'success' :
                          currentCard.difficulty === 'medium' ? 'warning' : 'danger'
                        }
                        className="ms-2"
                      >
                        {currentCard.difficulty}
                      </Badge>
                    </div>

                    {currentCard.passage && (
                      <p className="text-muted mb-3">{currentCard.passage}</p>
                    )}

                    <h3 className="mb-4">{currentCard.question}</h3>

                    {showAnswer ? (
                      <div className="answer-section">
                        <div className="answer-content mb-4 p-4 bg-light rounded">
                          <h5 className="text-success mb-2">Respuesta:</h5>
                          <p className="mb-0">{currentCard.answer}</p>
                        </div>
                        
                        <div className="answer-buttons">
                          <Button
                            variant="outline-danger"
                            size="lg"
                            className="me-3"
                            onClick={() => handleAnswer(false)}
                          >
                            <XCircle size={20} className="me-2" />
                            Incorrecta
                          </Button>
                          <Button
                            variant="outline-success"
                            size="lg"
                            onClick={() => handleAnswer(true)}
                          >
                            <CheckCircle size={20} className="me-2" />
                            Correcta
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={() => setShowAnswer(true)}
                      >
                        Mostrar Respuesta
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          ) : (
            /* Session Completed */
            <Row>
              <Col>
                <Card className="text-center">
                  <Card.Body className="py-5">
                    <Trophy size={64} className="text-warning mb-3" />
                    <h2 className="mb-3">¡Sesión Completada!</h2>
                    <p className="lead mb-4">
                      Has completado {activeSession.flashcards.length} flashcards
                    </p>
                    
                    <Row className="justify-content-center mb-4">
                      <Col md={6}>
                        <div className="session-results">
                          <div className="result-stat mb-3">
                            <h4 className="text-success">
                              {activeSession.correctAnswers}/{activeSession.totalAnswers}
                            </h4>
                            <p className="text-muted">Respuestas correctas</p>
                          </div>
                          <div className="result-stat">
                            <h4 className="text-info">{accuracy.toFixed(0)}%</h4>
                            <p className="text-muted">Precisión</p>
                          </div>
                        </div>
                      </Col>
                    </Row>

                    <div className="session-actions">
                      <Button
                        variant="primary"
                        size="lg"
                        className="me-3"
                        onClick={handleStartSession}
                      >
                        <Play size={20} className="me-2" />
                        Nueva Sesión
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="lg"
                        onClick={handleResetSession}
                      >
                        Volver al Inicio
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </>
      )}
    </Container>
  );
};

export default FlashcardsPage;