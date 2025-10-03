# Logos AI - Plataforma de Estudio Bíblico Inteligente

Una aplicación web moderna para el estudio bíblico con análisis lingüístico avanzado, búsqueda inteligente y herramientas de aprendizaje personalizadas.

## 🌟 Características

- **Búsqueda Inteligente**: Busca versículos por texto o referencia con sugerencias automáticas
- **Análisis Lingüístico**: Análisis morfológico, sintáctico, semántico y textual de textos bíblicos
- **Estudio Guiado**: Sesiones de estudio estructuradas con diferentes enfoques
- **Notas Personales**: Sistema completo de gestión de notas con etiquetas y búsqueda
- **Flashcards**: Tarjetas de estudio interactivas con seguimiento de progreso
- **Comparación de Versiones**: Compara diferentes versiones bíblicas lado a lado
- **Resúmenes Inteligentes**: Genera resúmenes automáticos de pasajes bíblicos
- **Tema Claro/Oscuro**: Interfaz adaptable con soporte para preferencias del usuario

## 🛠️ Tecnologías

### Frontend
- **React 18** con TypeScript
- **Vite** para desarrollo y construcción
- **React Router** para navegación
- **React Query** para gestión de estado del servidor
- **Bootstrap 5** para UI/UX
- **Lucide React** para iconografía
- **React Hook Form** + **Zod** para formularios y validación

### Backend
- **Node.js** con **Express**
- **TypeScript** para tipado estático
- **Zod** para validación de esquemas
- **Helmet** para seguridad
- **Morgan** para logging
- **CORS** configurado
- **Rate Limiting** implementado

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Configuración del Backend

1. Navega al directorio del backend:
```bash
cd backend
```

2. Instala las dependencias:
```bash
npm install
```

3. Copia el archivo de configuración de ejemplo:
```bash
copy .env.example .env
```

4. Configura las variables de entorno en `.env`:
```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5174
MONGODB_URI=mongodb://localhost:27017/logos-ai
JWT_SECRET=tu-jwt-secret-muy-seguro
OPENAI_API_KEY=tu-openai-api-key
BIBLE_API_KEY=tu-bible-api-key
```

5. Inicia el servidor de desarrollo:
```bash
npm run dev
```

El backend estará disponible en `http://localhost:3000`

### Configuración del Frontend

1. Navega al directorio del frontend:
```bash
cd frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env.local` (opcional):
```env
VITE_API_URL=http://localhost:3000/api
```

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

El frontend estará disponible en `http://localhost:5174`

## 📁 Estructura del Proyecto

```
logos-ai/
├── backend/
│   ├── src/
│   │   ├── routes/          # Rutas de la API
│   │   ├── middleware/      # Middleware personalizado
│   │   ├── models/          # Modelos de datos
│   │   ├── services/        # Lógica de negocio
│   │   └── index.ts         # Punto de entrada
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/           # Páginas de la aplicación
│   │   ├── contexts/        # Contextos de React
│   │   ├── services/        # Cliente API
│   │   ├── styles/          # Estilos globales
│   │   └── main.tsx         # Punto de entrada
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 🔧 Scripts Disponibles

### Backend
- `npm run dev` - Inicia el servidor en modo desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm start` - Inicia el servidor en modo producción
- `npm run lint` - Ejecuta el linter
- `npm test` - Ejecuta las pruebas

### Frontend
- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la construcción de producción
- `npm run lint` - Ejecuta el linter
- `npm test` - Ejecuta las pruebas

## 🌐 API Endpoints

### Búsqueda
- `GET /api/search` - Buscar versículos
- `GET /api/search/suggestions` - Obtener sugerencias

### Análisis
- `POST /api/analysis` - Analizar texto
- `GET /api/analysis/types` - Tipos de análisis disponibles

### Notas
- `GET /api/notes` - Listar notas
- `POST /api/notes` - Crear nota
- `PUT /api/notes/:id` - Actualizar nota
- `DELETE /api/notes/:id` - Eliminar nota

### Flashcards
- `GET /api/flashcards` - Listar flashcards
- `POST /api/flashcards` - Crear flashcard
- `POST /api/flashcards/study/start` - Iniciar sesión de estudio

### Comparación
- `POST /api/compare` - Comparar pasajes
- `GET /api/compare/versions` - Versiones disponibles

### Resúmenes
- `POST /api/summarize` - Generar resumen
- `GET /api/summarize/history` - Historial de resúmenes

## 🎨 Características de UI/UX

- **Diseño Responsivo**: Optimizado para dispositivos móviles y escritorio
- **Tema Adaptable**: Soporte para modo claro y oscuro
- **Animaciones Suaves**: Transiciones y efectos visuales elegantes
- **Accesibilidad**: Cumple con estándares de accesibilidad web
- **Carga Progresiva**: Estados de carga y manejo de errores

## 🔒 Seguridad

- Validación de entrada con Zod
- Rate limiting implementado
- Headers de seguridad con Helmet
- Sanitización de datos
- Autenticación JWT (preparado)

## 🚀 Despliegue

### Desarrollo
Ambos servidores (frontend y backend) pueden ejecutarse simultáneamente para desarrollo local.

### Producción
1. Construye el frontend: `npm run build` en `/frontend`
2. Construye el backend: `npm run build` en `/backend`
3. Configura las variables de entorno de producción
4. Despliega en tu plataforma preferida (Vercel, Netlify, Heroku, etc.)

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes preguntas o necesitas ayuda, por favor abre un issue en el repositorio.

---

**Logos AI** - Transformando el estudio bíblico con tecnología moderna 📖✨