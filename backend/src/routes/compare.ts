import { Router } from 'express';
import { z } from 'zod';

const router = Router();

// Schema de validación para comparación
const compareSchema = z.object({
  passages: z.array(z.object({
    reference: z.object({
      book: z.string(),
      chapter: z.number(),
      verse: z.number(),
      endVerse: z.number().optional(),
    }),
    version: z.string().default('RVR1960'),
  })).min(2, 'Debe incluir al menos 2 pasajes para comparar').max(5, 'Máximo 5 pasajes'),
  compareType: z.enum(['versions', 'themes', 'linguistic', 'contextual']).default('versions'),
  options: z.object({
    includeOriginalLanguage: z.boolean().default(false),
    includeCommentary: z.boolean().default(false),
    highlightDifferences: z.boolean().default(true),
  }).optional(),
});

// POST /api/compare - Comparar pasajes bíblicos
router.post('/', async (req, res) => {
  try {
    const validatedData = compareSchema.parse(req.body);
    
    // TODO: Implementar lógica real de comparación
    const mockComparison = {
      passages: validatedData.passages.map((passage, index) => ({
        id: `passage_${index + 1}`,
        reference: passage.reference,
        version: passage.version,
        text: index === 0 
          ? 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.'
          : 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
        originalLanguage: validatedData.options?.includeOriginalLanguage ? {
          text: 'οὕτως γὰρ ἠγάπησεν ὁ θεὸς τὸν κόσμον, ὥστε τὸν υἱὸν τὸν μονογενῆ ἔδωκεν...',
          language: 'Greek',
        } : undefined,
      })),
      comparison: {
        type: validatedData.compareType,
        analysis: {
          similarities: [
            'Ambas versiones enfatizan el amor de Dios',
            'El concepto de "vida eterna" está presente en ambas',
            'La estructura gramatical es similar',
          ],
          differences: [
            {
              aspect: 'Traducción de "unigénito"',
              passage1: 'Hijo unigénito',
              passage2: 'one and only Son',
              explanation: 'Diferentes enfoques para traducir "μονογενῆ"',
            },
            {
              aspect: 'Orden de palabras',
              passage1: 'no se pierda, mas tenga',
              passage2: 'shall not perish but have',
              explanation: 'Variación en la estructura sintáctica',
            },
          ],
          keyInsights: [
            'El mensaje central permanece consistente entre versiones',
            'Las diferencias son principalmente estilísticas',
            'Ambas transmiten efectivamente el concepto del amor sacrificial',
          ],
        },
        crossReferences: [
          {
            reference: 'Romanos 5:8',
            relevance: 'Tema similar sobre el amor sacrificial de Dios',
          },
          {
            reference: '1 Juan 4:9',
            relevance: 'Menciona también al Hijo unigénito',
          },
        ],
      },
      timestamp: new Date().toISOString(),
    };

    res.json(mockComparison);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: error.errors,
      });
    }
    
    console.error('Error en comparación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo realizar la comparación',
    });
  }
});

// GET /api/compare/versions - Obtener versiones bíblicas disponibles
router.get('/versions', (req, res) => {
  res.json({
    versions: [
      {
        id: 'RVR1960',
        name: 'Reina-Valera 1960',
        language: 'Spanish',
        year: 1960,
        description: 'Versión tradicional en español',
      },
      {
        id: 'NVI',
        name: 'Nueva Versión Internacional',
        language: 'Spanish',
        year: 1999,
        description: 'Traducción moderna en español',
      },
      {
        id: 'NIV',
        name: 'New International Version',
        language: 'English',
        year: 1978,
        description: 'Popular English translation',
      },
      {
        id: 'ESV',
        name: 'English Standard Version',
        language: 'English',
        year: 2001,
        description: 'Literal English translation',
      },
      {
        id: 'NASB',
        name: 'New American Standard Bible',
        language: 'English',
        year: 1971,
        description: 'Highly literal English translation',
      },
    ],
  });
});

// GET /api/compare/types - Tipos de comparación disponibles
router.get('/types', (req, res) => {
  res.json({
    types: [
      {
        id: 'versions',
        name: 'Comparación de Versiones',
        description: 'Compara diferentes traducciones del mismo pasaje',
      },
      {
        id: 'themes',
        name: 'Comparación Temática',
        description: 'Compara pasajes con temas similares',
      },
      {
        id: 'linguistic',
        name: 'Comparación Lingüística',
        description: 'Analiza diferencias en idiomas originales',
      },
      {
        id: 'contextual',
        name: 'Comparación Contextual',
        description: 'Examina contextos históricos y culturales',
      },
    ],
  });
});

// POST /api/compare/parallel - Comparación paralela de múltiples versiones
router.post('/parallel', async (req, res) => {
  try {
    const { reference, versions } = req.body;
    
    if (!reference || !versions || !Array.isArray(versions)) {
      return res.status(400).json({
        error: 'Se requiere referencia bíblica y lista de versiones',
      });
    }

    // TODO: Implementar lógica real de comparación paralela
    const mockParallel = {
      reference,
      versions: versions.map((version: string) => ({
        version,
        text: version === 'RVR1960' 
          ? 'Porque de tal manera amó Dios al mundo...'
          : version === 'NVI'
          ? 'Porque tanto amó Dios al mundo...'
          : 'For God so loved the world...',
      })),
      analysis: {
        commonWords: ['Dios', 'amó', 'mundo'],
        uniquePhrases: [
          { version: 'RVR1960', phrase: 'de tal manera' },
          { version: 'NVI', phrase: 'tanto' },
        ],
      },
    };

    res.json(mockParallel);
  } catch (error) {
    console.error('Error en comparación paralela:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo realizar la comparación paralela',
    });
  }
});

export default router;