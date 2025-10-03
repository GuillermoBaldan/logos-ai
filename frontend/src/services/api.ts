// API Client Configuration
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Search API
export const searchAPI = {
  searchVerses: async (params: {
    query: string;
    type: 'text' | 'reference';
    version?: string;
    limit?: number;
  }) => {
    const response = await apiClient.get('/search', { params });
    return response.data;
  },

  getSuggestions: async (query: string) => {
    const response = await apiClient.get('/search/suggestions', {
      params: { q: query },
    });
    return response.data;
  },
};

// Analysis API
export const analysisAPI = {
  analyzeText: async (params: {
    text: string;
    type: 'morphological' | 'syntactic' | 'semantic' | 'textual';
    language?: 'hebrew' | 'greek' | 'auto';
    passage?: string;
  }) => {
    const response = await apiClient.post('/analysis', params);
    return response.data;
  },

  getAnalysisTypes: async () => {
    const response = await apiClient.get('/analysis/types');
    return response.data;
  },
};

// Notes API
export const notesAPI = {
  getNotes: async (params?: {
    search?: string;
    tag?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/notes', { params });
    return response.data;
  },

  createNote: async (data: {
    title: string;
    content: string;
    passage?: string;
    tags: string[];
  }) => {
    const response = await apiClient.post('/notes', data);
    return response.data;
  },

  updateNote: async (id: string, data: {
    title?: string;
    content?: string;
    passage?: string;
    tags?: string[];
  }) => {
    const response = await apiClient.put(`/notes/${id}`, data);
    return response.data;
  },

  deleteNote: async (id: string) => {
    const response = await apiClient.delete(`/notes/${id}`);
    return response.data;
  },

  getNote: async (id: string) => {
    const response = await apiClient.get(`/notes/${id}`);
    return response.data;
  },
};

// Flashcards API
export const flashcardsAPI = {
  getFlashcards: async (params?: {
    category?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    limit?: number;
  }) => {
    const response = await apiClient.get('/flashcards', { params });
    return response.data;
  },

  createFlashcard: async (data: {
    question: string;
    answer: string;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    passage?: string;
  }) => {
    const response = await apiClient.post('/flashcards', data);
    return response.data;
  },

  startStudySession: async (params: {
    category?: string;
    count?: number;
  }) => {
    const response = await apiClient.post('/flashcards/study/start', params);
    return response.data;
  },

  recordAnswer: async (data: {
    sessionId: string;
    flashcardId: string;
    isCorrect: boolean;
    responseTime: number;
  }) => {
    const response = await apiClient.post('/flashcards/study/answer', data);
    return response.data;
  },

  getCategories: async () => {
    const response = await apiClient.get('/flashcards/categories');
    return response.data;
  },
};

// Compare API
export const compareAPI = {
  comparePassages: async (params: {
    passage: string;
    versions: string[];
    type: 'basic' | 'detailed' | 'linguistic';
  }) => {
    const response = await apiClient.post('/compare', params);
    return response.data;
  },

  getVersions: async () => {
    const response = await apiClient.get('/compare/versions');
    return response.data;
  },

  getComparisonTypes: async () => {
    const response = await apiClient.get('/compare/types');
    return response.data;
  },

  parallelCompare: async (params: {
    passages: string[];
    versions: string[];
  }) => {
    const response = await apiClient.post('/compare/parallel', params);
    return response.data;
  },
};

// Summarize API
export const summarizeAPI = {
  generateSummary: async (params: {
    text: string;
    type: 'quick' | 'detailed' | 'thematic';
    language?: string;
  }) => {
    const response = await apiClient.post('/summarize', params);
    return response.data;
  },

  batchSummarize: async (params: {
    texts: string[];
    type: 'quick' | 'detailed' | 'thematic';
    language?: string;
  }) => {
    const response = await apiClient.post('/summarize/batch', params);
    return response.data;
  },

  getTemplates: async () => {
    const response = await apiClient.get('/summarize/templates');
    return response.data;
  },

  getUserHistory: async (params?: {
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/summarize/history', { params });
    return response.data;
  },

  getSummary: async (id: string) => {
    const response = await apiClient.get(`/summarize/${id}`);
    return response.data;
  },
};

export default apiClient;