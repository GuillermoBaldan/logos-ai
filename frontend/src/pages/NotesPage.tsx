import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, Badge, Spinner } from 'react-bootstrap';
import { StickyNote, Plus, Edit, Trash2, Search, Calendar, Tag } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface Note {
  id: string;
  title: string;
  content: string;
  passage?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const NotesPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    passage: '',
    tags: '',
  });

  const queryClient = useQueryClient();

  const { data: notes, isLoading } = useQuery({
    queryKey: ['notes', searchTerm, selectedTag],
    queryFn: () => notesAPI.getNotes({ 
      search: searchTerm || undefined,
      tag: selectedTag || undefined,
    }),
  });

  const createNoteMutation = useMutation({
    mutationFn: notesAPI.createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Nota creada exitosamente');
      handleCloseModal();
    },
    onError: () => {
      toast.error('Error al crear la nota');
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => notesAPI.updateNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Nota actualizada exitosamente');
      handleCloseModal();
    },
    onError: () => {
      toast.error('Error al actualizar la nota');
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: notesAPI.deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Nota eliminada exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar la nota');
    },
  });

  const handleShowModal = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      setFormData({
        title: note.title,
        content: note.content,
        passage: note.passage || '',
        tags: note.tags.join(', '),
      });
    } else {
      setEditingNote(null);
      setFormData({
        title: '',
        content: '',
        passage: '',
        tags: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingNote(null);
    setFormData({
      title: '',
      content: '',
      passage: '',
      tags: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const noteData = {
      title: formData.title,
      content: formData.content,
      passage: formData.passage || undefined,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
    };

    if (editingNote) {
      updateNoteMutation.mutate({ id: editingNote.id, data: noteData });
    } else {
      createNoteMutation.mutate(noteData);
    }
  };

  const handleDelete = (noteId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  // Extraer todas las etiquetas únicas
  const allTags = notes ? Array.from(new Set(notes.flatMap((note: Note) => note.tags))) : [];

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center">
              <StickyNote className="me-2 text-primary" size={32} />
              <h1 className="mb-0">Mis Notas</h1>
            </div>
            <Button variant="primary" onClick={() => handleShowModal()}>
              <Plus size={20} className="me-2" />
              Nueva Nota
            </Button>
          </div>
        </Col>
      </Row>

      {/* Search and Filter */}
      <Row className="mb-4">
        <Col md={8}>
          <Form.Group>
            <div className="position-relative">
              <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={16} />
              <Form.Control
                type="text"
                placeholder="Buscar en notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-5"
              />
            </div>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
          >
            <option value="">Todas las etiquetas</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {/* Notes Grid */}
      {isLoading ? (
        <Row>
          <Col className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Cargando notas...</p>
          </Col>
        </Row>
      ) : notes && notes.length > 0 ? (
        <Row className="g-4">
          {notes.map((note: Note) => (
            <Col key={note.id} md={6} lg={4}>
              <Card className="h-100 note-card">
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="card-title mb-0">{note.title}</h6>
                    <div className="note-actions">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => handleShowModal(note)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(note.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  {note.passage && (
                    <div className="mb-2">
                      <Badge bg="outline-primary" className="passage-badge">
                        {note.passage}
                      </Badge>
                    </div>
                  )}

                  <p className="card-text flex-grow-1 note-content">
                    {note.content.length > 150 
                      ? `${note.content.substring(0, 150)}...` 
                      : note.content
                    }
                  </p>

                  {note.tags.length > 0 && (
                    <div className="mb-2">
                      {note.tags.map((tag, index) => (
                        <Badge key={index} bg="secondary" className="me-1 mb-1">
                          <Tag size={12} className="me-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="note-meta text-muted small">
                    <Calendar size={12} className="me-1" />
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Row>
          <Col className="text-center py-5">
            <StickyNote size={64} className="text-muted mb-3" />
            <h4 className="text-muted">No hay notas</h4>
            <p className="text-muted">
              {searchTerm || selectedTag 
                ? 'No se encontraron notas con los filtros aplicados.'
                : 'Comienza creando tu primera nota de estudio bíblico.'
              }
            </p>
            {!searchTerm && !selectedTag && (
              <Button variant="primary" onClick={() => handleShowModal()}>
                <Plus size={20} className="me-2" />
                Crear Primera Nota
              </Button>
            )}
          </Col>
        </Row>
      )}

      {/* Note Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingNote ? 'Editar Nota' : 'Nueva Nota'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Título</Form.Label>
              <Form.Control
                type="text"
                placeholder="Título de la nota"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Pasaje Bíblico (opcional)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej: Juan 3:16, Salmo 23, etc."
                value={formData.passage}
                onChange={(e) => setFormData({ ...formData, passage: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Contenido</Form.Label>
              <Form.Control
                as="textarea"
                rows={8}
                placeholder="Escribe tu nota aquí..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Etiquetas</Form.Label>
              <Form.Control
                type="text"
                placeholder="Separa las etiquetas con comas (ej: oración, fe, esperanza)"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
              <Form.Text className="text-muted">
                Las etiquetas te ayudan a organizar y encontrar tus notas más fácilmente.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={createNoteMutation.isPending || updateNoteMutation.isPending}
            >
              {createNoteMutation.isPending || updateNoteMutation.isPending ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  {editingNote ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                editingNote ? 'Actualizar Nota' : 'Crear Nota'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default NotesPage;