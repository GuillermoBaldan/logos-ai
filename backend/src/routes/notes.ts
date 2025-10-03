import { Router } from 'express';
import { z } from 'zod';

const router = Router();

// Schema de validación para notas
const noteSchema = z.object({
  title: z.string().min(1, 'El título no puede estar vacío'),
  content: z.string().min(1, 'El contenido no puede estar vacío'),
  reference: z.object({
    book: z.string(),
    chapter: z.number(),
    verse: z.number().optional(),
    endVerse: z.number().optional(),
  }),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
});

const updateNoteSchema = noteSchema.partial();

// GET /api/notes - Obtener todas las notas del usuario
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, tag, search } = req.query;
    
    // TODO: Implementar lógica real con base de datos
    const mockNotes = [
      {
        id: '1',
        title: 'Reflexión sobre Juan 3:16',
        content: 'Este versículo es fundamental para entender el amor de Dios...',
        reference: {
          book: 'Juan',
          chapter: 3,
          verse: 16,
        },
        tags: ['amor', 'salvación'],
        isPublic: false,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      },
      {
        id: '2',
        title: 'Estudio de Romanos 8',
        content: 'Análisis completo del capítulo sobre la vida en el Espíritu...',
        reference: {
          book: 'Romanos',
          chapter: 8,
        },
        tags: ['espíritu santo', 'vida cristiana'],
        isPublic: true,
        createdAt: '2024-01-14T15:20:00Z',
        updatedAt: '2024-01-14T15:20:00Z',
      },
    ];

    res.json({
      notes: mockNotes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: mockNotes.length,
        totalPages: Math.ceil(mockNotes.length / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error obteniendo notas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las notas',
    });
  }
});

// POST /api/notes - Crear nueva nota
router.post('/', async (req, res) => {
  try {
    const validatedData = noteSchema.parse(req.body);
    
    // TODO: Implementar lógica real con base de datos
    const newNote = {
      id: Date.now().toString(),
      ...validatedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.status(201).json(newNote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: error.errors,
      });
    }
    
    console.error('Error creando nota:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo crear la nota',
    });
  }
});

// GET /api/notes/:id - Obtener nota específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Implementar lógica real con base de datos
    const mockNote = {
      id,
      title: 'Reflexión sobre Juan 3:16',
      content: 'Este versículo es fundamental para entender el amor de Dios...',
      reference: {
        book: 'Juan',
        chapter: 3,
        verse: 16,
      },
      tags: ['amor', 'salvación'],
      isPublic: false,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
    };

    res.json(mockNote);
  } catch (error) {
    console.error('Error obteniendo nota:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener la nota',
    });
  }
});

// PUT /api/notes/:id - Actualizar nota
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateNoteSchema.parse(req.body);
    
    // TODO: Implementar lógica real con base de datos
    const updatedNote = {
      id,
      title: 'Reflexión sobre Juan 3:16 (actualizada)',
      content: 'Este versículo es fundamental para entender el amor de Dios...',
      reference: {
        book: 'Juan',
        chapter: 3,
        verse: 16,
      },
      tags: ['amor', 'salvación'],
      isPublic: false,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: new Date().toISOString(),
      ...validatedData,
    };

    res.json(updatedNote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: error.errors,
      });
    }
    
    console.error('Error actualizando nota:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar la nota',
    });
  }
});

// DELETE /api/notes/:id - Eliminar nota
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Implementar lógica real con base de datos
    res.status(204).send();
  } catch (error) {
    console.error('Error eliminando nota:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo eliminar la nota',
    });
  }
});

export default router;