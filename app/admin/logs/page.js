'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    company_id: '',
    status: '',
    date_from: '',
    date_to: ''
  });

  // Cargar empresas activas
  useEffect(() => {
    loadCompanies();
    loadLogs();
  }, []);

  const loadCompanies = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    
    if (!error && data) {
      setCompanies(data);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    
    let query = supabase
      .from('message_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(100);

    // Aplicar filtros
    if (filters.company_id) {
      query = query.eq('company_id', filters.company_id);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.date_from) {
      query = query.gte('sent_at', filters.date_from);
    }
    
    if (filters.date_to) {
      const dateTo = new Date(filters.date_to);
      dateTo.setDate(dateTo.getDate() + 1);
      query = query.lt('sent_at', dateTo.toISOString());
    }

    const { data, error } = await query;
    
    if (!error && data) {
      setLogs(data);
    }
    
    setLoading(false);
  };

  // Aplicar filtros
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    loadLogs();
  };

  // Ocultar parcialmente el destino
  const maskDestination = (destination, channel) => {
    if (channel === 'whatsapp') {
      // +598 99 XXX XX56
      const cleaned = destination.replace(/\D/g, '');
      if (cleaned.length >= 8) {
        return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} XXX XX${cleaned.slice(-2)}`;
      }
      return destination;
    } else if (channel === 'email') {
      // mar***@gmail.com
      const [local, domain] = destination.split('@');
      if (local && domain) {
        const visible = Math.min(3, Math.floor(local.length / 2));
        return `${local.slice(0, visible)}***@${domain}`;
      }
      return destination;
    }
    return destination;
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

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>📨 Logs de Envío</h1>
        <p className="admin-subtitle">Historial de mensajes enviados</p>
      </div>

      {/* Filtros */}
      <div className="admin-section">
        <h2>Filtros</h2>
        <div className="filters-grid">
          <div className="form-group">
            <label>Empresa</label>
            <select
              value={filters.company_id}
              onChange={(e) => handleFilterChange('company_id', e.target.value)}
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
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="form-control"
            >
              <option value="">Todos</option>
              <option value="sent">Enviado</option>
              <option value="failed">Fallido</option>
              <option value="pending">Pendiente</option>
            </select>
          </div>

          <div className="form-group">
            <label>Fecha desde</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Fecha hasta</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
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

      {/* Tabla de logs */}
      <div className="admin-section">
        <h2>Últimos {logs.length} registros</h2>
        
        {loading ? (
          <div className="loading-spinner">Cargando...</div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <p>No se encontraron logs con los filtros aplicados</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Canal</th>
                  <th>Destino</th>
                  <th>Estado</th>
                  <th>Fecha/Hora</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <div>
                        <strong>{log.client_code}</strong>
                        <br />
                        <small>{log.client_name}</small>
                      </div>
                    </td>
                    <td>
                      <span className={`channel-badge ${log.channel}`}>
                        {log.channel === 'whatsapp' ? '📱 WhatsApp' : '📧 Email'}
                      </span>
                    </td>
                    <td>
                      <code>{maskDestination(log.destination, log.channel)}</code>
                    </td>
                    <td>
                      <span className={`status-badge ${log.status}`}>
                        {log.status === 'sent' ? '✅ Enviado' : 
                         log.status === 'failed' ? '❌ Fallido' : 
                         '⏳ Pendiente'}
                      </span>
                    </td>
                    <td>{formatDate(log.sent_at)}</td>
                    <td>
                      {log.error_message && (
                        <small className="error-message">{log.error_message}</small>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .align-end {
          display: flex;
          align-items: flex-end;
        }

        .table-container {
          overflow-x: auto;
        }

        .channel-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .channel-badge.whatsapp {
          background: #25d366;
          color: white;
        }

        .channel-badge.email {
          background: #4285f4;
          color: white;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge.sent {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.failed {
          background: #f8d7da;
          color: #721c24;
        }

        .status-badge.pending {
          background: #fff3cd;
          color: #856404;
        }

        .error-message {
          color: #dc3545;
          word-break: break-word;
        }

        code {
          background: #f1f3f4;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: monospace;
          font-size: 13px;
        }

        .loading-spinner {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #666;
        }
      `}</style>
    </div>
  );
}