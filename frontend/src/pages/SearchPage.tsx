import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { Search as SearchIcon, Filter, BookOpen, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { searchAPI } from '@/services/api';

interface SearchResult {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  version: string;
  relevance: number;
}

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'text' | 'reference'>('text');
  const [version, setVersion] = useState('RVR1960');
  const [hasSearched, setHasSearched] = useState(false);

  const { data: searchResults, isLoading, error, refetch } = useQuery({
    queryKey: ['search', query, searchType, version],
    queryFn: () => searchAPI.searchVerses({ query, type: searchType, version }),
    enabled: false, // Solo ejecutar cuando se haga búsqueda manual
  });

  const { data: suggestions } = useQuery({
    queryKey: ['suggestions', query],
    queryFn: () => searchAPI.getSuggestions(query),
    enabled: query.length > 2,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setHasSearched(true);
      refetch();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setHasSearched(true);
    refetch();
  };

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <div className="d-flex align-items-center mb-4">
            <SearchIcon className="me-2 text-primary" size={32} />
            <h1 className="mb-0">Búsqueda Bíblica</h1>
          </div>
        </Col>
      </Row>

      {/* Search Form */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Form onSubmit={handleSearch}>
                <Row className="g-3">
                  <Col md={8}>
                    <Form.Group>
                      <Form.Label>Buscar en las Escrituras</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ej: amor de Dios, Juan 3:16, esperanza..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        size="lg"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Tipo</Form.Label>
                      <Form.Select
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value as 'text' | 'reference')}
                        size="lg"
                      >
                        <option value="text">Texto</option>
                        <option value="reference">Referencia</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Versión</Form.Label>
                      <Form.Select
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        size="lg"
                      >
                        <option value="RVR1960">RVR1960</option>
                        <option value="NVI">NVI</option>
                        <option value="LBLA">LBLA</option>
                        <option value="DHH">DHH</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Col>
                    <Button type="submit" variant="primary" size="lg" disabled={!query.trim()}>
                      <SearchIcon size={20} className="me-2" />
                      Buscar
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && !hasSearched && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Body>
                <h6 className="mb-3">
                  <Filter size={16} className="me-2" />
                  Sugerencias
                </h6>
                <div className="d-flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <Badge
                      key={index}
                      bg="secondary"
                      className="p-2 cursor-pointer"
                      onClick={() => handleSuggestionClick(suggestion)}
                      style={{ cursor: 'pointer' }}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Loading State */}
      {isLoading && (
        <Row>
          <Col className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Buscando en las Escrituras...</p>
          </Col>
        </Row>
      )}

      {/* Error State */}
      {error && (
        <Row>
          <Col>
            <Alert variant="danger">
              <Alert.Heading>Error en la búsqueda</Alert.Heading>
              <p>No se pudo realizar la búsqueda. Por favor, inténtalo de nuevo.</p>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Search Results */}
      {searchResults && searchResults.length > 0 && (
        <Row>
          <Col>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4>
                Resultados de búsqueda
                <Badge bg="primary" className="ms-2">
                  {searchResults.length}
                </Badge>
              </h4>
              <small className="text-muted">
                <Clock size={14} className="me-1" />
                Búsqueda realizada
              </small>
            </div>
            
            <div className="search-results">
              {searchResults.map((result: SearchResult) => (
                <Card key={result.id} className="mb-3 search-result-card">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center">
                        <BookOpen size={16} className="me-2 text-primary" />
                        <strong className="text-primary">
                          {result.book} {result.chapter}:{result.verse}
                        </strong>
                        <Badge bg="outline-secondary" className="ms-2">
                          {result.version}
                        </Badge>
                      </div>
                      <Badge 
                        bg={result.relevance > 0.8 ? 'success' : result.relevance > 0.6 ? 'warning' : 'secondary'}
                      >
                        {Math.round(result.relevance * 100)}% relevancia
                      </Badge>
                    </div>
                    <p className="mb-0 search-result-text">
                      {result.text}
                    </p>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </Col>
        </Row>
      )}

      {/* No Results */}
      {hasSearched && searchResults && searchResults.length === 0 && !isLoading && (
        <Row>
          <Col className="text-center py-5">
            <SearchIcon size={64} className="text-muted mb-3" />
            <h4 className="text-muted">No se encontraron resultados</h4>
            <p className="text-muted">
              Intenta con diferentes términos de búsqueda o verifica la referencia bíblica.
            </p>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default SearchPage;