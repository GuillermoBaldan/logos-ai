import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  MapPin, 
  Calendar, 
  Shield, 
  Trash2, 
  AlertTriangle,
  RefreshCw,
  CheckCircle
} from 'lucide-react';

const Sessions: React.FC = () => {
  const { user, sessions, getSessions, revokeSession, logoutAll, isLoading } = useAuth();
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoadingSessions(true);
    setError(null);
    try {
      await getSessions();
    } catch (err: any) {
      setError('Error al cargar las sesiones');
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSession(sessionId);
    setError(null);
    setSuccess(null);
    
    try {
      await revokeSession(sessionId);
      setSuccess('Sesión revocada exitosamente');
    } catch (err: any) {
      setError('Error al revocar la sesión');
    } finally {
      setRevokingSession(null);
    }
  };

  const handleLogoutAll = async () => {
    setError(null);
    setSuccess(null);
    
    try {
      await logoutAll();
      setSuccess('Todas las sesiones han sido cerradas');
    } catch (err: any) {
      setError('Error al cerrar todas las sesiones');
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="w-5 h-5" />;
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return <Tablet className="w-5 h-5" />;
    } else {
      return <Monitor className="w-5 h-5" />;
    }
  };

  const getBrowserName = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    if (ua.includes('opera')) return 'Opera';
    return 'Navegador desconocido';
  };

  const getOSName = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('ios')) return 'iOS';
    return 'SO desconocido';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isCurrentSession = (sessionId: string) => {
    // Aquí podrías implementar lógica para identificar la sesión actual
    // Por ahora, asumimos que la primera sesión es la actual
    return sessions.length > 0 && sessions[0].id === sessionId;
  };

  if (isLoading || loadingSessions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando sesiones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Gestión de Sesiones
              </h1>
              <p className="text-gray-600">
                Administra tus sesiones activas y dispositivos conectados
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadSessions}
                disabled={loadingSessions}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loadingSessions ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
              <button
                onClick={handleLogoutAll}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Shield className="w-4 h-4 mr-2" />
                Cerrar Todas
              </button>
            </div>
          </div>
        </div>

        {/* Mensajes de estado */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-red-400 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex">
              <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-green-800">Éxito</h3>
                <p className="text-sm text-green-700 mt-1">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Información del usuario */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Información de la Cuenta
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <p className="mt-1 text-sm text-gray-900">{user?.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Sesiones Activas</label>
              <p className="mt-1 text-sm text-gray-900">{sessions.length}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Último Acceso</label>
              <p className="mt-1 text-sm text-gray-900">
                {user?.lastLogin ? formatDate(user.lastLogin) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Lista de sesiones */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Sesiones Activas ({sessions.length})
            </h2>
          </div>
          
          {sessions.length === 0 ? (
            <div className="p-6 text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay sesiones activas
              </h3>
              <p className="text-gray-600">
                No se encontraron sesiones activas en tu cuenta.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sessions.map((session) => (
                <div key={session.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getDeviceIcon(session.userAgent)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            {getBrowserName(session.userAgent)} en {getOSName(session.userAgent)}
                          </h3>
                          {isCurrentSession(session.id) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Sesión Actual
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Globe className="w-4 h-4" />
                            <span>IP: {session.ipAddress}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>Ubicación: {session.location || 'Desconocida'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Creada: {formatDate(session.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Última actividad: {formatDate(session.lastUsed)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      {!isCurrentSession(session.id) && (
                        <button
                          onClick={() => handleRevokeSession(session.id)}
                          disabled={revokingSession === session.id}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {revokingSession === session.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 mr-1" />
                              Revocar
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Información de seguridad */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-6">
          <div className="flex">
            <Shield className="w-5 h-5 text-blue-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Consejos de Seguridad</h3>
              <div className="text-sm text-blue-700 mt-1">
                <ul className="list-disc list-inside space-y-1">
                  <li>Revisa regularmente tus sesiones activas</li>
                  <li>Revoca sesiones de dispositivos que ya no uses</li>
                  <li>Si ves actividad sospechosa, cambia tu contraseña inmediatamente</li>
                  <li>Usa "Cerrar Todas" si sospechas que tu cuenta fue comprometida</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sessions;