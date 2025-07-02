'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

export default function ProcessingLogsPage() {
  const [logs, setLogs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    company_id: '',
    status: '',
    user_email: '',
    date_from: '',
    date_to: ''
  });

  useEffect(() => {
    loadCompanies();
    loadProcessingLogs();
  }, []);

  const loadCompanies = async () => {
    const { data } = await supabase
      .from('companies')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    
    if (data) setCompanies(data);
  };

  const loadProcessingLogs = async () => {
    setLoading(true);
    
    let query = supabase
      .from('processing_logs')
      .select(`
        *,
        companies!inner(name)
      `)
      .order('started_at', { ascending: false })
      .limit(50);

    // Aplicar filtros
    if (filters.company_id) {
      query = query.eq('company_id', filters.company_id);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.user_email) {
      query = query.ilike('user_email', `%${filters.user_email}%`);
    }
    
    if (filters.date_from) {
      query = query.gte('started_at', filters.date_from);
    }
    
    if (filters.date_to) {
      const dateTo = new Date(filters.date_to);
      dateTo.setDate(dateTo.getDate() + 1);
      query = query.lt('started_at', dateTo.toISOString());
    }

    const { data, error } = await query;
    
    if (!error && data) {
      setLogs(data);
    }
    
    setLoading(false);
  };

  // Calcular duración del procesamiento
  const calculateDuration = (startedAt, completedAt) => {
    if (!completedAt) return 'En proceso...';
    
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const diffMs = end - start;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    
    if (diffMins > 0) {
      return `${diffMins}m ${diffSecs % 60}s`;
    }
    return `${diffSecs}s`;
  };

  // Formatear estrategia
  const formatStrategy = (strategy) => {
    const strategies = {
      'whatsapp_primero': '📱 WhatsApp Prioritario',
      'ambos_canales': '📱📧 Ambos Canales',
      'solo_whatsapp': '📱 Solo WhatsApp',
      'solo_email': '📧 Solo Email'
    };
    return strategies[strategy] || strategy;
  };

  const handleSearch = () => {
    loadProcessingLogs();
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>⚙️ Logs de Procesamiento</h1>
        <p className="admin-subtitle">Historial de archivos procesados</p>
      </div>

      {/* Filtros */}
      <div className="admin-section">
        <h2>Filtros</h2>
        <div className="filters-grid">
          <div className="form-group">
            <label>Empresa</label>
            <select
              value={filters.company_id}
              onChange={(e) => setFilters({...filters, company_id: e.target.value})}
              className="form-control"
            >
              <option value="">Todas las empresas</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="form-control"
            >
              <option value="">Todos</option>
              <option value="processing">Procesando</option>
              <option value="completed">Completado</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div className="form-group">
            <label>Usuario</label>
            <input
              type="text"
              placeholder="Buscar por email..."
              value={filters.user_email}
              onChange={(e) => setFilters({...filters, user_email: e.target.value})}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Fecha desde</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({...filters, date_from: e.target.value})}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Fecha hasta</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({...filters, date_to: e.target.value})}
              className="form-control"
            />
          </div>

          <div className="form-group align-end">
            <button 
              onClick={handleSearch}
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="admin-section">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Procesados</h3>
            <p className="stat-number">{logs.length}</p>
          </div>
          <div className="stat-card">
            <h3>Completados</h3>
            <p className="stat-number success">
              {logs.filter(l => l.status === 'completed').length}
            </p>
          </div>
          <div className="stat-card">
            <h3>Con Errores</h3>
            <p className="stat-number error">
              {logs.filter(l => l.status === 'error').length}
            </p>
          </div>
          <div className="stat-card">
            <h3>En Proceso</h3>
            <p className="stat-number warning">
              {logs.filter(l => l.status === 'processing').length}
            </p>
          </div>
        </div>
      </div>

      {/* Tabla de logs */}
      <div className="admin-section">
        <h2>Últimos {logs.length} procesamientos</h2>
        
        {loading ? (
          <div className="loading-spinner">Cargando...</div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <p>No se encontraron procesamientos con los filtros aplicados</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Usuario</th>
                  <th>Empresa</th>
                  <th>Archivos</th>
                  <th>Registros</th>
                  <th>Estrategia</th>
                  <th>Duración</th>
                  <th>Fecha/Hora</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <span className={`status-badge ${log.status}`}>
                        {log.status === 'completed' ? '✅ Completado' : 
                         log.status === 'error' ? '❌ Error' : 
                         '⏳ Procesando'}
                      </span>
                    </td>
                    <td>
                      <small>{log.user_email}</small>
                    </td>
                    <td>{log.companies?.name || log.company_name}</td>
                    <td>
                      <div className="files-info">
                        <div>📄 {log.invoice_file_name || 'Sin archivo'}</div>
                        {log.contacts_file_name && (
                          <div>👥 {log.contacts_file_name}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="records-info">
                        <div>
                          <strong>Facturas:</strong> {log.invoice_records_valid || 0}/{log.invoice_records_total || 0}
                          {log.invoice_records_invalid > 0 && (
                            <span className="error-count"> ({log.invoice_records_invalid} inválidas)</span>
                          )}
                        </div>
                        {log.contacts_records_total > 0 && (
                          <div>
                            <strong>Contactos:</strong> {log.contacts_records_valid || 0}/{log.contacts_records_total || 0}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{formatStrategy(log.strategy)}</td>
                    <td>{calculateDuration(log.started_at, log.completed_at)}</td>
                    <td>
                      <div>
                        {new Date(log.started_at).toLocaleString('es-UY', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => window.alert(`Webhook ID: ${log.webhook_call_id}`)}
                          className="btn btn-sm btn-secondary"
                          title="Ver detalles"
                        >
                          👁️
                        </button>
                        <Link
                          href={`/admin/logs?webhook_call_id=${log.webhook_call_id}`}
                          className="btn btn-sm btn-primary"
                          title="Ver mensajes enviados"
                        >
                          📨
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        }

        .stat-card h3 {
          margin: 0 0 10px 0;
          color: #666;
          font-size: 14px;
          text-transform: uppercase;
        }

        .stat-number {
          font-size: 32px;
          font-weight: bold;
          margin: 0;
        }

        .stat-number.success { color: #28a745; }
        .stat-number.error { color: #dc3545; }
        .stat-number.warning { color: #ffc107; }

        .files-info, .records-info {
          font-size: 12px;
        }

        .files-info div {
          padding: 2px 0;
        }

        .error-count {
          color: #dc3545;
          font-weight: bold;
        }

        .action-buttons {
          display: flex;
          gap: 5px;
        }

        .btn-sm {
          padding: 4px 8px;
          font-size: 12px;
        }

        /* Resto de estilos similares a logs/page.js */
      `}</style>
    </div>
  );
}