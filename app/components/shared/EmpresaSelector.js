// app/components/shared/EmpresaSelector.js
'use client';

import { useAuth } from '../../contexts/AuthContext';
import styles from './EmpresaSelector.module.css';

export default function EmpresaSelector() {
  const { empresaActual, empresasDisponibles, isSuperAdmin, cambiarEmpresa, isLoadingEmpresa } = useAuth();
  
  // Solo mostrar si es super admin y hay múltiples empresas
  if (!isSuperAdmin || empresasDisponibles.length <= 1) {
    return null;
  }
  
  return (
    <div className={styles.selectorContainer}>
      <label className={styles.label}>Empresa:</label>
      <select 
        className={styles.select}
        value={empresaActual?.id || ''}
        onChange={(e) => cambiarEmpresa(e.target.value)}
        disabled={isLoadingEmpresa}
      >
        {empresasDisponibles.map(empresa => (
          <option key={empresa.id} value={empresa.id}>
            {empresa.name}
          </option>
        ))}
      </select>
      {isLoadingEmpresa && <span className={styles.loading}>Cargando...</span>}
    </div>
  );
}