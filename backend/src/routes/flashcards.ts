import { Router } from 'express';
import { z } from 'zod';

const router = Router();

// Schema de validación para flashcards
const flashcardSchema = z.object({
  front: z.string().min(1, 'El frente de la tarjeta no puede estar vacío'),
  back: z.string().min(1, 'El reverso de la tarjeta no puede estar vacío'),
  reference: z.object({
    book: z.string(),
    chapter: z.number(),
    verse: z.number().optional(),
    endVerse: z.number().optional(),
  }).optional(),
  category: z.string().default('general'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  tags: z.array(z.string()).default([]),
});

const studySessionSchema = z.object({
  flashcardIds: z.array(z.string()).min(1, 'Debe incluir al menos una flashcard'),
  sessionType: z.enum(['review', 'new', 'mixed']).default('mixed'),
});

// GET /api/flashcards - Obtener flashcards del usuario
router.get('/', async (req, res) => {
  try {
    const { category, difficulty, tag, limit = 20 } = req.query;
    
    // TODO: Implementar lógica real con base de datos
    const mockFlashcards = [
      {
        id: '1',
        front: '¿Cuál es el versículo más conocido sobre el amor de Dios?',
        back: 'Juan 3:16 - "Porque de tal manera amó Dios al mundo..."',
        reference: {
          book: 'Juan',
          chapter: 3,
          verse: 16,
        },
        category: 'versículos clave',
        difficulty: 'easy',
        tags: ['amor', 'salvación'],
        stats: {
          timesStudied: 5,
          correctAnswers: 4,
          lastStudied: '2024-01-15T10:30:00Z',
        },
        createdAt: '2024-01-10T08:00:00Z',
      },
      {
        id: '2',
        front: '¿Qué significa "ἀγάπη" (agape) en griego?',
        back: 'Amor incondicional, sacrificial y divino. Es el tipo de amor que Dios tiene por nosotros.',
        category: 'idiomas originales',
        difficulty: 'medium',
        tags: ['griego', 'amor', 'teología'],
        stats: {
          timesStudied: 3,
          correctAnswers: 2,
          lastStudied: '2024-01-14T15:20:00Z',
        },
        createdAt: '2024-01-12T14:30:00Z',
      },
    ];

    res.json({
      flashcards: mockFlashcards,
      total: mockFlashcards.length,
    });
  } catch (error) {
    console.error('Error obteniendo flashcards:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las flashcards',
    });
  }
});

// POST /api/flashcards - Crear nueva flashcard
router.post('/', async (req, res) => {
  try {
    const validatedData = flashcardSchema.parse(req.body);
    
    // TODO: Implementar lógica real con base de datos
    const newFlashcard = {
      id: Date.now().toString(),
      ...validatedData,
      stats: {
        timesStudied: 0,
        correctAnswers: 0,
        lastStudied: null,
      },
      createdAt: new Date().toISOString(),
    };

    res.status(201).json(newFlashcard);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: error.errors,
      });
    }
    
    console.error('Error creando flashcard:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo crear la flashcard',
    });
  }
});

// POST /api/flashcards/study - Iniciar sesión de estudio
router.post('/study', async (req, res) => {
  try {
    const validatedData = studySessionSchema.parse(req.body);
    
    // TODO: Implementar lógica real con algoritmo de repetición espaciada
    const mockSession = {
      sessionId: Date.now().toString(),
      flashcards: [
        {
          id: '1',
          front: '¿Cuál es el versículo más conocido sobre el amor de Dios?',
          back: 'Juan 3:16 - "Porque de tal manera amó Dios al mundo..."',
          difficulty: 'easy',
        },
        {
          id: '2',
          front: '¿Qué significa "ἀγάπη" (agape) en griego?',
          back: 'Amor incondicional, sacrificial y divino.',
          difficulty: 'medium',
        },
      ],
      sessionType: validatedData.sessionType,
      startedAt: new Date().toISOString(),
    };

    res.json(mockSession);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: error.errors,
      });
    }
    
    console.error('Error iniciando sesión de estudio:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo iniciar la sesión de estudio',
    });
  }
});

// POST /api/flashcards/:id/answer - Registrar respuesta de flashcard
router.post('/:id/answer', async (req, res) => {
  try {
    const { id } = req.params;
    const { correct, timeSpent } = req.body;
    
    if (typeof correct !== 'boolean') {
      return res.status(400).json({
        error: 'El campo "correct" debe ser un booleano',
      });
    }
    
    // TODO: Implementar lógica real con algoritmo de repetición espaciada
    const updatedStats = {
      timesStudied: 6,
      correctAnswers: correct ? 5 : 4,
      lastStudied: new Date().toISOString(),
      nextReview: new Date(Date.now() + (correct ? 7 : 1) * 24 * 60 * 60 * 1000).toISOString(),
    };

    res.json({
      flashcardId: id,
      stats: updatedStats,
      message: correct ? '¡Correcto!' : 'Sigue practicando',
    });
  } catch (error) {
    console.error('Error registrando respuesta:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo registrar la respuesta',
    });
  }
});

// GET /api/flashcards/categories - Obtener categorías disponibles
router.get('/categories', (req, res) => {
  res.json({
    categories: [
      'versículos clave',
      'idiomas originales',
      'teología',
      'historia bíblica',
      'personajes bíblicos',
      'geografía bíblica',
      'doctrinas',
      'general',
    ],
  });
});

export default router;