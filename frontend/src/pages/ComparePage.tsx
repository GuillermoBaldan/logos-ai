import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { BarChart3, BookOpen, Eye, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { compareAPI } from '@/services/api';

interface ComparisonResult {
  id: string;
  passage: string;
  versions: {
    version: string;
    text: string;
    differences?: string[];
  }[];
  analysis: {
    keyDifferences: string[];
    linguisticNotes: string[];
    theologicalImplications: string[];
  };
}

const ComparePage: React.FC = () => {
  const [passage, setPassage] = useState('');
  const [selectedVersions, setSelectedVersions] = useState<string[]>(['RVR1960', 'NVI']);
  const [comparisonType, setComparisonType] = useState<'basic' | 'detailed' | 'linguistic'>('basic');
  const [hasCompared, setHasCompared] = useState(false);

  const { data: versions } = useQuery({
    queryKey: ['bible-versions'],
    queryFn: () => compareAPI.getVersions(),
  });

  const { data: comparisonTypes } = useQuery({
    queryKey: ['comparison-types'],
    queryFn: () => compareAPI.getComparisonTypes(),
  });

  const { data: comparisonResult, isLoading, error, refetch } = useQuery({
    queryKey: ['comparison', passage, selectedVersions, comparisonType],
    queryFn: () => compareAPI.comparePassages({
      passage,
      versions: selectedVersions,
      type: comparisonType,
    }),
    enabled: false,
  });

  const handleCompare = (e: React.FormEvent) => {
    e.preventDefault();
    if (passage.trim() && selectedVersions.length >= 2) {
      setHasCompared(true);
      refetch();
    }
  };

  const handleVersionToggle = (version: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(version)) {
        return prev.filter(v => v !== version);
      } else {
        return [...prev, version];
      }
    });
  };

  const comparisonTypeOptions = [
    {
      value: 'basic',
      label: 'Comparación Básica',
      description: 'Muestra las diferencias principales entre versiones',
    },
    {
      value: 'detailed',
      label: 'Análisis Detallado',
      description: 'Incluye contexto histórico y notas lingüísticas',
    },
    {
      value: 'linguistic',
      label: 'Análisis Lingüístico',
      description: 'Enfoque en diferencias de traducción y idiomas originales',
    },
  ];

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <div className="d-flex align-items-center mb-4">
            <BarChart3 className="me-2 text-primary" size={32} />
            <h1 className="mb-0">Comparación de Versiones</h1>
          </div>
        </Col>
      </Row>

      {/* Comparison Form */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <BookOpen size={20} className="me-2" />
                Configurar Comparación
              </h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleCompare}>
                <Row className="g-3">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Pasaje Bíblico</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ej: Juan 3:16, Salmo 23:1-3, Romanos 8:28"
                        value={passage}
                        onChange={(e) => setPassage(e.target.value)}
                        size="lg"
                      />
                      <Form.Text className="text-muted">
                        Ingresa la referencia bíblica que deseas comparar entre diferentes versiones.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-3 mt-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Versiones Bíblicas</Form.Label>
                      <div className="versions-selection">
                        {versions?.map((version: any) => (
                          <Form.Check
                            key={version.code}
                            type="checkbox"
                            id={`version-${version.code}`}
                            label={`${version.name} (${version.code})`}
                            checked={selectedVersions.includes(version.code)}
                            onChange={() => handleVersionToggle(version.code)}
                            className="mb-2"
                          />
                        ))}
                      </div>
                      <Form.Text className="text-muted">
                        Selecciona al menos 2 versiones para comparar.
                      </Form.Text>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Tipo de Comparación</Form.Label>
                      {comparisonTypeOptions.map((option) => (
                        <Form.Check
                          key={option.value}
                          type="radio"
                          name="comparisonType"
                          id={`type-${option.value}`}
                          label={
                            <div>
                              <strong>{option.label}</strong>
                              <br />
                              <small className="text-muted">{option.description}</small>
                            </div>
                          }
                          checked={comparisonType === option.value}
                          onChange={() => setComparisonType(option.value as any)}
                          className="mb-3"
                        />
                      ))}
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mt-4">
                  <Col>
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={!passage.trim() || selectedVersions.length < 2}
                    >
                      <BarChart3 size={20} className="me-2" />
                      Comparar Versiones
                    </Button>
                    
                    <div className="mt-2">
                      <small className="text-muted">
                        Versiones seleccionadas: {selectedVersions.length}
                      </small>
                    </div>
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
            <p className="mt-3 text-muted">Comparando versiones bíblicas...</p>
          </Col>
        </Row>
      )}

      {/* Error State */}
      {error && (
        <Row>
          <Col>
            <Alert variant="danger">
              <Alert.Heading>Error en la comparación</Alert.Heading>
              <p>No se pudo realizar la comparación. Verifica la referencia bíblica e inténtalo de nuevo.</p>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Comparison Results */}
      {comparisonResult && (
        <>
          {/* Passage Header */}
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">
                      <BookOpen size={24} className="me-2 text-primary" />
                      {comparisonResult.passage}
                    </h4>
                    <Badge bg="primary">
                      {selectedVersions.length} versiones
                    </Badge>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Version Texts */}
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">
                    <Eye size={20} className="me-2" />
                    Textos por Versión
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row className="g-4">
                    {comparisonResult.versions.map((version, index) => (
                      <Col key={index} md={6} lg={selectedVersions.length > 2 ? 4 : 6}>
                        <Card className="version-card h-100">
                          <Card.Header className="bg-light">
                            <h6 className="mb-0 text-primary">{version.version}</h6>
                          </Card.Header>
                          <Card.Body>
                            <p className="version-text">{version.text}</p>
                            
                            {version.differences && version.differences.length > 0 && (
                              <div className="differences mt-3">
                                <h6 className="text-warning">Diferencias destacadas:</h6>
                                <ul className="small">
                                  {version.differences.map((diff, diffIndex) => (
                                    <li key={diffIndex} className="text-muted">{diff}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Analysis Results */}
          {comparisonResult.analysis && (
            <Row>
              <Col>
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">
                      <BarChart3 size={20} className="me-2" />
                      Análisis Comparativo
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Row className="g-4">
                      {comparisonResult.analysis.keyDifferences.length > 0 && (
                        <Col md={4}>
                          <div className="analysis-section">
                            <h6 className="text-primary mb-3">
                              <Plus size={16} className="me-1" />
                              Diferencias Clave
                            </h6>
                            <ul className="analysis-list">
                              {comparisonResult.analysis.keyDifferences.map((diff, index) => (
                                <li key={index} className="mb-2">{diff}</li>
                              ))}
                            </ul>
                          </div>
                        </Col>
                      )}

                      {comparisonResult.analysis.linguisticNotes.length > 0 && (
                        <Col md={4}>
                          <div className="analysis-section">
                            <h6 className="text-success mb-3">
                              <BookOpen size={16} className="me-1" />
                              Notas Lingüísticas
                            </h6>
                            <ul className="analysis-list">
                              {comparisonResult.analysis.linguisticNotes.map((note, index) => (
                                <li key={index} className="mb-2">{note}</li>
                              ))}
                            </ul>
                          </div>
                        </Col>
                      )}

                      {comparisonResult.analysis.theologicalImplications.length > 0 && (
                        <Col md={4}>
                          <div className="analysis-section">
                            <h6 className="text-warning mb-3">
                              <Eye size={16} className="me-1" />
                              Implicaciones Teológicas
                            </h6>
                            <ul className="analysis-list">
                              {comparisonResult.analysis.theologicalImplications.map((implication, index) => (
                                <li key={index} className="mb-2">{implication}</li>
                              ))}
                            </ul>
                          </div>
                        </Col>
                      )}
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </>
      )}

      {/* No Results */}
      {hasCompared && !comparisonResult && !isLoading && !error && (
        <Row>
          <Col className="text-center py-5">
            <BarChart3 size={64} className="text-muted mb-3" />
            <h4 className="text-muted">No se encontraron resultados</h4>
            <p className="text-muted">
              Verifica la referencia bíblica y las versiones seleccionadas.
            </p>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default ComparePage;