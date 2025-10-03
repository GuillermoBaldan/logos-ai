import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import { Book, Languages, Search, FileText, Globe, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { analysisAPI } from '@/services/api';

interface AnalysisResult {
  id: string;
  text: string;
  type: string;
  results: {
    morphological?: {
      words: Array<{
        word: string;
        lemma: string;
        partOfSpeech: string;
        morphology: string;
        translation: string;
      }>;
    };
    syntactic?: {
      structure: string;
      clauses: string[];
      relationships: string[];
    };
    semantic?: {
      themes: string[];
      concepts: string[];
      crossReferences: string[];
    };
    textual?: {
      variants: string[];
      manuscripts: string[];
      criticalNotes: string[];
    };
  };
  originalLanguage: string;
  passage?: string;
}

const AnalysisPage: React.FC = () => {
  const [text, setText] = useState('');
  const [passage, setPassage] = useState('');
  const [analysisType, setAnalysisType] = useState<'morphological' | 'syntactic' | 'semantic' | 'textual'>('morphological');
  const [language, setLanguage] = useState<'hebrew' | 'greek' | 'auto'>('auto');
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const { data: analysisTypes } = useQuery({
    queryKey: ['analysis-types'],
    queryFn: () => analysisAPI.getAnalysisTypes(),
  });

  const { data: analysisResult, isLoading, error, refetch } = useQuery({
    queryKey: ['analysis', text, passage, analysisType, language],
    queryFn: () => analysisAPI.analyzeText({
      text: text || passage,
      type: analysisType,
      language,
      passage: passage || undefined,
    }),
    enabled: false,
  });

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if ((text.trim() || passage.trim())) {
      setHasAnalyzed(true);
      refetch();
    }
  };

  const analysisTypeOptions = [
    {
      value: 'morphological',
      label: 'Análisis Morfológico',
      description: 'Analiza la estructura de palabras, raíces y formas gramaticales',
      icon: Languages,
    },
    {
      value: 'syntactic',
      label: 'Análisis Sintáctico',
      description: 'Examina la estructura de oraciones y relaciones gramaticales',
      icon: FileText,
    },
    {
      value: 'semantic',
      label: 'Análisis Semántico',
      description: 'Explora significados, temas y conceptos teológicos',
      icon: Search,
    },
    {
      value: 'textual',
      label: 'Crítica Textual',
      description: 'Compara manuscritos y variantes textuales',
      icon: Book,
    },
  ];

  const languageOptions = [
    { value: 'auto', label: 'Detección Automática' },
    { value: 'hebrew', label: 'Hebreo (AT)' },
    { value: 'greek', label: 'Griego (NT)' },
  ];

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <div className="d-flex align-items-center mb-4">
            <Book className="me-2 text-primary" size={32} />
            <h1 className="mb-0">Análisis Lingüístico</h1>
          </div>
        </Col>
      </Row>

      {/* Analysis Form */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <Zap size={20} className="me-2" />
                Configurar Análisis
              </h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleAnalyze}>
                <Tabs defaultActiveKey="passage" className="mb-3">
                  <Tab eventKey="passage" title="Por Referencia">
                    <Form.Group className="mb-3">
                      <Form.Label>Referencia Bíblica</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ej: Juan 1:1, Génesis 1:1, Salmo 23:1"
                        value={passage}
                        onChange={(e) => {
                          setPassage(e.target.value);
                          setText(''); // Limpiar texto manual
                        }}
                        size="lg"
                      />
                      <Form.Text className="text-muted">
                        Ingresa una referencia bíblica para analizar el texto en idiomas originales.
                      </Form.Text>
                    </Form.Group>
                  </Tab>
                  
                  <Tab eventKey="text" title="Texto Manual">
                    <Form.Group className="mb-3">
                      <Form.Label>Texto en Idioma Original</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        placeholder="Ingresa texto en hebreo o griego..."
                        value={text}
                        onChange={(e) => {
                          setText(e.target.value);
                          setPassage(''); // Limpiar referencia
                        }}
                      />
                      <Form.Text className="text-muted">
                        Pega o escribe texto en hebreo o griego para análisis detallado.
                      </Form.Text>
                    </Form.Group>
                  </Tab>
                </Tabs>

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Tipo de Análisis</Form.Label>
                      <div className="analysis-types">
                        {analysisTypeOptions.map((option) => {
                          const IconComponent = option.icon;
                          return (
                            <Card 
                              key={option.value}
                              className={`analysis-type-card mb-2 ${analysisType === option.value ? 'border-primary' : ''}`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => setAnalysisType(option.value as any)}
                            >
                              <Card.Body className="py-2">
                                <Form.Check
                                  type="radio"
                                  name="analysisType"
                                  value={option.value}
                                  checked={analysisType === option.value}
                                  onChange={() => setAnalysisType(option.value as any)}
                                  className="d-flex align-items-start"
                                  label={
                                    <div className="d-flex align-items-start">
                                      <IconComponent size={20} className="me-2 mt-1 text-primary" />
                                      <div>
                                        <strong>{option.label}</strong>
                                        <br />
                                        <small className="text-muted">{option.description}</small>
                                      </div>
                                    </div>
                                  }
                                />
                              </Card.Body>
                            </Card>
                          );
                        })}
                      </div>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Idioma Original</Form.Label>
                      <Form.Select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as any)}
                        size="lg"
                      >
                        {languageOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    <div className="analysis-info p-3 bg-light rounded">
                      <h6 className="mb-2">
                        <Globe size={16} className="me-1" />
                        Información del Análisis
                      </h6>
                      <ul className="small mb-0">
                        <li>Utiliza herramientas de análisis bíblico avanzadas</li>
                        <li>Acceso a léxicos y gramáticas especializadas</li>
                        <li>Comparación con manuscritos antiguos</li>
                        <li>Contexto histórico y cultural</li>
                      </ul>
                    </div>
                  </Col>
                </Row>

                <Row className="mt-4">
                  <Col>
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={!text.trim() && !passage.trim()}
                    >
                      <Book size={20} className="me-2" />
                      Analizar Texto
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Loading State */}
      {isLoading && (
        <Row>
          <Col className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Analizando texto bíblico...</p>
          </Col>
        </Row>
      )}

      {/* Error State */}
      {error && (
        <Row>
          <Col>
            <Alert variant="danger">
              <Alert.Heading>Error en el análisis</Alert.Heading>
              <p>No se pudo realizar el análisis. Verifica el texto o referencia e inténtalo de nuevo.</p>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <>
          {/* Result Header */}
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h4 className="mb-1">
                        Resultado del Análisis {analysisTypeOptions.find(t => t.value === analysisType)?.label}
                      </h4>
                      {analysisResult.passage && (
                        <p className="text-muted mb-0">{analysisResult.passage}</p>
                      )}
                    </div>
                    <div className="text-end">
                      <Badge bg="primary" className="mb-1">
                        {analysisResult.originalLanguage === 'hebrew' ? 'Hebreo' : 
                         analysisResult.originalLanguage === 'greek' ? 'Griego' : 'Detectado'}
                      </Badge>
                      <br />
                      <Badge bg="outline-secondary">
                        {analysisTypeOptions.find(t => t.value === analysisType)?.label}
                      </Badge>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Original Text */}
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Header>
                  <h6 className="mb-0">
                    <Languages size={16} className="me-2" />
                    Texto Original
                  </h6>
                </Card.Header>
                <Card.Body>
                  <div className="original-text p-3 bg-light rounded" style={{ fontSize: '1.2em', direction: analysisResult.originalLanguage === 'hebrew' ? 'rtl' : 'ltr' }}>
                    {analysisResult.text}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Analysis Results by Type */}
          <Row>
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Resultados del Análisis</h5>
                </Card.Header>
                <Card.Body>
                  {/* Morphological Analysis */}
                  {analysisResult.results.morphological && (
                    <div className="morphological-analysis">
                      <h6 className="text-primary mb-3">Análisis Morfológico</h6>
                      <div className="table-responsive">
                        <table className="table table-striped">
                          <thead>
                            <tr>
                              <th>Palabra</th>
                              <th>Lema</th>
                              <th>Parte del Discurso</th>
                              <th>Morfología</th>
                              <th>Traducción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analysisResult.results.morphological.words.map((word, index) => (
                              <tr key={index}>
                                <td className="fw-bold">{word.word}</td>
                                <td>{word.lemma}</td>
                                <td>
                                  <Badge bg="outline-primary">{word.partOfSpeech}</Badge>
                                </td>
                                <td>
                                  <small className="text-muted">{word.morphology}</small>
                                </td>
                                <td>{word.translation}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Syntactic Analysis */}
                  {analysisResult.results.syntactic && (
                    <div className="syntactic-analysis">
                      <h6 className="text-success mb-3">Análisis Sintáctico</h6>
                      <Row className="g-3">
                        <Col md={12}>
                          <div className="mb-3">
                            <strong>Estructura:</strong>
                            <p className="mt-2">{analysisResult.results.syntactic.structure}</p>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div>
                            <strong>Cláusulas:</strong>
                            <ul className="mt-2">
                              {analysisResult.results.syntactic.clauses.map((clause, index) => (
                                <li key={index}>{clause}</li>
                              ))}
                            </ul>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div>
                            <strong>Relaciones:</strong>
                            <ul className="mt-2">
                              {analysisResult.results.syntactic.relationships.map((rel, index) => (
                                <li key={index}>{rel}</li>
                              ))}
                            </ul>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  )}

                  {/* Semantic Analysis */}
                  {analysisResult.results.semantic && (
                    <div className="semantic-analysis">
                      <h6 className="text-warning mb-3">Análisis Semántico</h6>
                      <Row className="g-3">
                        <Col md={4}>
                          <div>
                            <strong>Temas:</strong>
                            <div className="mt-2">
                              {analysisResult.results.semantic.themes.map((theme, index) => (
                                <Badge key={index} bg="outline-warning" className="me-1 mb-1">
                                  {theme}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div>
                            <strong>Conceptos:</strong>
                            <div className="mt-2">
                              {analysisResult.results.semantic.concepts.map((concept, index) => (
                                <Badge key={index} bg="outline-info" className="me-1 mb-1">
                                  {concept}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div>
                            <strong>Referencias Cruzadas:</strong>
                            <ul className="mt-2 small">
                              {analysisResult.results.semantic.crossReferences.map((ref, index) => (
                                <li key={index}>{ref}</li>
                              ))}
                            </ul>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  )}

                  {/* Textual Criticism */}
                  {analysisResult.results.textual && (
                    <div className="textual-analysis">
                      <h6 className="text-danger mb-3">Crítica Textual</h6>
                      <Row className="g-3">
                        <Col md={4}>
                          <div>
                            <strong>Variantes:</strong>
                            <ul className="mt-2">
                              {analysisResult.results.textual.variants.map((variant, index) => (
                                <li key={index} className="small">{variant}</li>
                              ))}
                            </ul>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div>
                            <strong>Manuscritos:</strong>
                            <div className="mt-2">
                              {analysisResult.results.textual.manuscripts.map((ms, index) => (
                                <Badge key={index} bg="outline-secondary" className="me-1 mb-1">
                                  {ms}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div>
                            <strong>Notas Críticas:</strong>
                            <ul className="mt-2">
                              {analysisResult.results.textual.criticalNotes.map((note, index) => (
                                <li key={index} className="small">{note}</li>
                              ))}
                            </ul>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* No Results */}
      {hasAnalyzed && !analysisResult && !isLoading && !error && (
        <Row>
          <Col className="text-center py-5">
            <Book size={64} className="text-muted mb-3" />
            <h4 className="text-muted">No se pudo analizar el texto</h4>
            <p className="text-muted">
              Verifica que el texto esté en el idioma correcto o intenta con una referencia bíblica.
            </p>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default AnalysisPage;