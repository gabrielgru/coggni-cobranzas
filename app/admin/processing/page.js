'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../utils/supabase/client';
import Link from 'next/link';

const supabase = createClient();

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
    if (!completedAt) return 'En proceso';
    
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
      'whatsapp_primero': 'WhatsApp Prioritario',
      'ambos_canales': 'Ambos Canales',
      'solo_whatsapp': 'Solo WhatsApp',
      'solo_email': 'Solo Email'
    };
    return strategies[strategy] || strategy;
  };

  const handleSearch = () => {
    loadProcessingLogs();
  };

  const handleReset = () => {
    setFilters({
      company_id: '',
      status: '',
      user_email: '',
      date_from: '',
      date_to: ''
    });
    setTimeout(() => loadProcessingLogs(), 100);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleString('es-UY', options);
  };

  // Calcular estadísticas
  const stats = {
    total: logs.length,
    completed: logs.filter(l => l.status === 'completed').length,
    errors: logs.filter(l => l.status === 'error').length,
    processing: logs.filter(l => l.status === 'processing').length
  };

  return (
    <div className="processing-container">
      {/* Header mejorado */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <h1>⚙️ Logs de Procesamiento</h1>
            <p className="header-subtitle">Historial de archivos procesados y estado de envíos</p>
          </div>
          <button 
            onClick={loadProcessingLogs} 
            className="btn-refresh"
            disabled={loading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Actualizar
          </button>
        </div>
      </div>

      {/* Tarjetas de estadísticas mejoradas */}
      <div className="stats-container">
        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-label">TOTAL PROCESADOS</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>
        
        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-label">COMPLETADOS</div>
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-percentage">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
            </div>
          </div>
        </div>
        
        <div className="stat-card error">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-label">CON ERRORES</div>
            <div className="stat-value">{stats.errors}</div>
            <div className="stat-percentage">
              {stats.total > 0 ? Math.round((stats.errors / stats.total) * 100) : 0}%
            </div>
          </div>
        </div>
        
        <div className="stat-card processing">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-label">EN PROCESO</div>
            <div className="stat-value">{stats.processing}</div>
          </div>
        </div>
      </div>

      {/* Panel de filtros mejorado */}
      <div className="filters-section">
        <div className="filters-header">
          <h3>🔍 Filtros</h3>
          <button onClick={handleReset} className="btn-text">
            Limpiar filtros
          </button>
        </div>
        
        <div className="filters-grid">
          <div className="filter-group">
            <label>Empresa</label>
            <select
              value={filters.company_id}
              onChange={(e) => setFilters({...filters, company_id: e.target.value})}
              className="filter-select"
            >
              <option value="">Todas las empresas</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="filter-select"
            >
              <option value="">Todos los estados</option>
              <option value="processing">⏳ Procesando</option>
              <option value="completed">✅ Completado</option>
              <option value="error">❌ Error</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Usuario</label>
            <input
              type="text"
              placeholder="Email del usuario..."
              value={filters.user_email}
              onChange={(e) => setFilters({...filters, user_email: e.target.value})}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Fecha desde</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({...filters, date_from: e.target.value})}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Fecha hasta</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({...filters, date_to: e.target.value})}
              className="filter-input"
            />
          </div>

          <div className="filter-group filter-actions">
            <button 
              onClick={handleSearch}
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabla mejorada */}
      <div className="table-section">
        <div className="table-header">
          <h3>Últimos {logs.length} procesamientos</h3>
        </div>
        
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando procesamientos...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No se encontraron procesamientos</h3>
            <p>Ajusta los filtros o realiza un nuevo procesamiento</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
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
                {logs.map((log, index) => (
                  <tr key={log.id} className={index % 2 === 0 ? 'even' : 'odd'}>
                    <td>
                      <div className={`status-indicator ${log.status}`}>
                        <span className="status-dot"></span>
                        <span className="status-text">
                          {log.status === 'completed' ? 'Completado' : 
                           log.status === 'error' ? 'Error' : 
                           'Procesando'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {log.user_email.charAt(0).toUpperCase()}
                        </div>
                        <span className="user-email">{log.user_email}</span>
                      </div>
                    </td>
                    <td>
                      <div className="company-name">
                        {log.companies?.name || log.company_name}
                      </div>
                    </td>
                    <td>
                      <div className="files-list">
                        <div className="file-item">
                          <span className="file-icon">📄</span>
                          <span className="file-name" title={log.invoice_file_name}>
                            {log.invoice_file_name || 'Sin archivo'}
                          </span>
                        </div>
                        {log.contacts_file_name && (
                          <div className="file-item">
                            <span className="file-icon">👥</span>
                            <span className="file-name" title={log.contacts_file_name}>
                              {log.contacts_file_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="records-summary">
                        <div className="record-type">
                          <span className="record-label">Facturas:</span>
                          <span className="record-count valid">{log.invoice_records_valid || 0}</span>
                          <span className="record-separator">/</span>
                          <span className="record-count total">{log.invoice_records_total || 0}</span>
                          {log.invoice_records_invalid > 0 && (
                            <span className="record-invalid">⚠️ {log.invoice_records_invalid}</span>
                          )}
                        </div>
                        {log.contacts_records_total > 0 && (
                          <div className="record-type">
                            <span className="record-label">Contactos:</span>
                            <span className="record-count valid">{log.contacts_records_valid || 0}</span>
                            <span className="record-separator">/</span>
                            <span className="record-count total">{log.contacts_records_total || 0}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="strategy-badge">
                        {formatStrategy(log.strategy)}
                      </div>
                    </td>
                    <td>
                      <div className="duration">
                        {calculateDuration(log.started_at, log.completed_at)}
                      </div>
                    </td>
                    <td>
                      <div className="date-time">
                        {formatDate(log.started_at)}
                      </div>
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          onClick={() => window.alert(`Webhook ID:\\n${log.webhook_call_id}`)}
                          className="action-btn"
                          title="Ver detalles"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        <Link
                          href={`/admin/logs?webhook_call_id=${log.webhook_call_id}`}
                          className="action-btn primary"
                          title="Ver mensajes enviados"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"/>
                          </svg>
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
        .processing-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
          background: var(--bg-secondary, #f8f9fa);
          min-height: 100vh;
        }

        /* Header */
        .page-header {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .header-title h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: var(--text-primary, #1a1a1a);
        }

        .header-subtitle {
          margin: 4px 0 0 0;
          color: var(--text-secondary, #6b7280);
          font-size: 14px;
        }

        .btn-refresh {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: white;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-refresh:hover:not(:disabled) {
          background: var(--bg-hover, #f3f4f6);
        }

        .btn-refresh:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Estadísticas */
        .stats-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .stat-icon {
          font-size: 32px;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary, #f3f4f6);
          border-radius: 12px;
        }

        .stat-card.total .stat-icon { background: #e0e7ff; }
        .stat-card.success .stat-icon { background: #d1fae5; }
        .stat-card.error .stat-icon { background: #fee2e2; }
        .stat-card.processing .stat-icon { background: #fef3c7; }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary, #6b7280);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: var(--text-primary, #1a1a1a);
          line-height: 1;
        }

        .stat-percentage {
          font-size: 14px;
          color: var(--text-secondary, #6b7280);
          margin-top: 4px;
        }

        /* Filtros */
        .filters-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .filters-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .btn-text {
          background: none;
          border: none;
          color: var(--primary-color, #3b82f6);
          cursor: pointer;
          font-size: 14px;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .btn-text:hover {
          background: var(--bg-hover, #f3f4f6);
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-group label {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary, #1a1a1a);
        }

        .filter-select,
        .filter-input {
          padding: 10px 12px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          font-size: 14px;
          background: white;
          transition: border-color 0.2s;
        }

        .filter-select:focus,
        .filter-input:focus {
          outline: none;
          border-color: var(--primary-color, #3b82f6);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .filter-actions {
          display: flex;
          align-items: flex-end;
        }

        .btn-primary {
          background: var(--primary-color, #3b82f6);
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--primary-hover, #2563eb);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Tabla */
        .table-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .table-header {
          margin-bottom: 20px;
        }

        .table-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .table-responsive {
          overflow-x: auto;
          margin: -24px;
          padding: 24px;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .data-table th {
          background: var(--bg-secondary, #f9fafb);
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          color: var(--text-secondary, #6b7280);
          border-bottom: 1px solid var(--border-color, #e5e7eb);
          white-space: nowrap;
        }

        .data-table td {
          padding: 16px;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .data-table tr.even {
          background: var(--bg-secondary, #f9fafb);
        }

        .data-table tr:hover {
          background: var(--bg-hover, #f3f4f6);
        }

        /* Estados */
        .status-indicator {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .status-indicator.completed {
          background: #d1fae5;
          color: #065f46;
        }

        .status-indicator.completed .status-dot {
          background: #10b981;
          animation: none;
        }

        .status-indicator.error {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-indicator.error .status-dot {
          background: #ef4444;
          animation: none;
        }

        .status-indicator.processing {
          background: #fef3c7;
          color: #92400e;
        }

        .status-indicator.processing .status-dot {
          background: #f59e0b;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        /* Usuario */
        .user-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          background: var(--primary-color, #3b82f6);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }

        .user-email {
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        /* Archivos */
        .files-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .file-item {
          display: flex;
          align-items: center;
          gap: 6px;
          max-width: 200px;
        }

        .file-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .file-name {
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Registros */
        .records-summary {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .record-type {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
        }

        .record-label {
          color: var(--text-secondary, #6b7280);
          font-weight: 500;
        }

        .record-count.valid {
          color: #10b981;
          font-weight: 600;
        }

        .record-separator {
          color: var(--text-secondary, #6b7280);
        }

        .record-count.total {
          color: var(--text-primary, #1a1a1a);
        }

        .record-invalid {
          color: #ef4444;
          font-weight: 600;
          margin-left: 8px;
        }

        /* Estrategia */
        .strategy-badge {
          display: inline-block;
          padding: 4px 12px;
          background: var(--bg-secondary, #f3f4f6);
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #1a1a1a);
        }

        /* Duración */
        .duration {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary, #6b7280);
        }

        /* Fecha */
        .date-time {
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
          white-space: nowrap;
        }

        /* Acciones */
        .actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 1px solid var(--border-color, #e5e7eb);
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-secondary, #6b7280);
        }

        .action-btn:hover {
          background: var(--bg-hover, #f3f4f6);
          color: var(--text-primary, #1a1a1a);
        }

        .action-btn.primary {
          background: var(--primary-color, #3b82f6);
          border-color: var(--primary-color, #3b82f6);
          color: white;
        }

        .action-btn.primary:hover {
          background: var(--primary-hover, #2563eb);
        }

        /* Estados vacíos */
        .loading-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
          text-align: center;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 3px solid var(--border-color, #e5e7eb);
          border-top: 3px solid var(--primary-color, #3b82f6);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-state h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
        }

        .empty-state p {
          margin: 0;
          color: var(--text-secondary, #6b7280);
          font-size: 14px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .processing-container {
            padding: 16px;
          }

          .stats-container {
            grid-template-columns: 1fr 1fr;
          }

          .filters-grid {
            grid-template-columns: 1fr;
          }

          .header-content {
            flex-direction: column;
            align-items: flex-start;
          }

          .btn-refresh {
            width: 100%;
            justify-content: center;
          }

          .data-table {
            font-size: 12px;
          }

          .data-table th,
          .data-table td {
            padding: 8px;
          }

          .user-info {
            flex-direction: column;
            align-items: flex-start;
          }

          .user-avatar {
            width: 24px;
            height: 24px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}