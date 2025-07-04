import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// Normalizar nombres de columnas
export function normalizeColumnName(name) {
  return name.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\./g, "")
    .replace(/\s+/g, "")
    .trim();
}

// Validar email
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

// Validar fecha
export function validateDate(dateValue) {
  // Acepta formato DD/MM/YYYY
  if (typeof dateValue === 'string') {
    const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    return dateRegex.test(dateValue);
  }
  // También acepta números de Excel (días desde 1900)
  if (typeof dateValue === 'number' && dateValue > 0) {
    return true;
  }
  return false;
}

// Validar moneda según empresa
export function validateCurrency(currency, validCurrencies) {
  return validCurrencies.includes(String(currency).trim());
}

// Leer archivo Excel
export async function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Leer archivo CSV
export async function readCSVFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      Papa.parse(e.target.result, {
        complete: (results) => {
          resolve(results.data);
        },
        error: reject
      });
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// Validar archivo de facturas con field mappings dinámicos
export async function validateFacturasFile(file, empresaConfig) {
  const errors = [];
  const warnings = [];
  let data;
  
  try {
    // Leer archivo según su tipo
    if (file.name.endsWith('.csv')) {
      data = await readCSVFile(file);
    } else {
      data = await readExcelFile(file);
    }
    
    // ========================================
    // VALIDACIÓN: Archivo completamente vacío
    // ========================================
    if (!data || data.length === 0) {
      errors.push('El archivo está completamente vacío');
      return { valid: false, errors, warnings };
    }
    
    // ========================================
    // VALIDACIÓN: Solo headers sin datos
    // ========================================
    if (data.length === 1) {
      errors.push('El archivo solo contiene nombres de columnas pero no tiene datos');
      return { valid: false, errors, warnings };
    }
    
    // Obtener headers (primera fila)
    const headers = data[0].map(h => normalizeColumnName(String(h || '')));
    
    // Validar que hay headers
    if (headers.every(h => h === '')) {
      errors.push('El archivo no contiene nombres de columnas válidos');
      return { valid: false, errors, warnings };
    }
    
    // Obtener columnas requeridas de la configuración - SOLO las que están marcadas como requeridas
    const requiredColumns = [];
    const requiredFieldNames = [];
    
    Object.entries(empresaConfig.campos_facturas).forEach(([key, config]) => {
      if (config.requerido && config.nombre) { // Solo si tiene nombre definido
        requiredColumns.push(normalizeColumnName(config.nombre));
        requiredFieldNames.push(config.nombre);
      }
    });
    
    // Validar columnas requeridas
    const missingColumns = [];
    requiredFieldNames.forEach((fieldName, index) => {
      const normalizedRequired = requiredColumns[index];
      if (!headers.includes(normalizedRequired)) {
        missingColumns.push(fieldName);
      }
    });
    
    if (missingColumns.length > 0) {
      errors.push(`Faltan columnas obligatorias: ${missingColumns.join(', ')}`);
    }
    
    // Encontrar índices de columnas (todas, no solo las requeridas)
    const columnIndices = {};
    Object.entries(empresaConfig.campos_facturas).forEach(([key, config]) => {
      if (config.nombre) { // Solo si tiene nombre definido
        const normalizedName = normalizeColumnName(config.nombre);
        const index = headers.indexOf(normalizedName);
        
        if (index !== -1) {
          columnIndices[key] = index;
        }
      }
    });
    
    // ========================================
    // IMPORTANTE: Contar filas con contenido real (sin advertir sobre vacías)
    // ========================================
    let actualDataRows = 0;
    let lastDataRowIndex = 0;
    
    // Buscar hasta dónde hay datos reales
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const hasContent = row && row.length > 0 && row.some(cell => 
        cell !== '' && cell !== null && cell !== undefined && String(cell).trim() !== ''
      );
      
      if (hasContent) {
        actualDataRows++;
        lastDataRowIndex = i;
      }
    }
    
    // ========================================
    // VALIDACIÓN: Archivo con headers pero sin datos reales
    // ========================================
    if (actualDataRows === 0) {
      errors.push('El archivo contiene columnas pero no tiene ningún registro de datos');
      return { valid: false, errors, warnings };
    }
    
    // Validar datos fila por fila (solo hasta donde hay datos reales)
    let rowsWithoutVencim = 0;
    let invalidCurrencies = 0;
    let invalidSaldos = 0;
    let saldoFormatErrors = [];
    
    for (let i = 1; i <= lastDataRowIndex; i++) {
      const row = data[i];
      if (!row || row.length === 0 || row.every(cell => !cell || String(cell).trim() === '')) {
        continue;
      }
      
      // Validar fecha de vencimiento si existe y es requerida
      if (columnIndices.vencim !== undefined) {
        const vencim = row[columnIndices.vencim];
        if (empresaConfig.campos_facturas.vencim.requerido) {
          if (!vencim || vencim === '') {
            rowsWithoutVencim++;
          } else if (!validateDate(vencim)) {
            warnings.push(`Fila ${i + 1}: formato de fecha inválido`);
          }
        }
      }
      
      // Validar moneda si es requerida
      if (columnIndices.mon !== undefined && empresaConfig.campos_facturas.mon.requerido) {
        const currency = row[columnIndices.mon];
        if (currency && !validateCurrency(currency, empresaConfig.monedas)) {
          invalidCurrencies++;
        }
      }
      
      // ========================================
      // VALIDACIÓN MEJORADA: Formato numérico en saldo
      // ========================================
      if (columnIndices.saldo !== undefined && empresaConfig.campos_facturas.saldo.requerido) {
        const saldo = row[columnIndices.saldo];
        
        // Verificar que no esté vacío
        if (saldo === '' || saldo === null || saldo === undefined) {
          invalidSaldos++;
          if (saldoFormatErrors.length < 5) {
            saldoFormatErrors.push(`Fila ${i + 1}: saldo vacío`);
          }
        } else {
          // Intentar convertir a número
          const saldoStr = String(saldo).trim();
          // Remover separadores de miles y reemplazar coma por punto
          const saldoNormalized = saldoStr.replace(/[^\d,.-]/g, '').replace(',', '.');
          const saldoNum = Number(saldoNormalized);
          
          if (isNaN(saldoNum)) {
            invalidSaldos++;
            if (saldoFormatErrors.length < 5) {
              saldoFormatErrors.push(`Fila ${i + 1}: saldo "${saldo}" no es un número válido`);
            }
          }
        }
      }
    }
    
    // Agregar errores y advertencias específicos
    if (rowsWithoutVencim > 0 && empresaConfig.campos_facturas.vencim.requerido) {
      errors.push(`${rowsWithoutVencim} facturas no tienen fecha de vencimiento`);
    }
    
    if (invalidCurrencies > 0) {
      errors.push(`${invalidCurrencies} facturas tienen moneda inválida (debe ser ${empresaConfig.monedas.join(' o ')})`);
    }
    
    // ========================================
    // ERRORES MEJORADOS: Detalles de formato de saldo
    // ========================================
    if (invalidSaldos > 0) {
      errors.push(`${invalidSaldos} facturas tienen saldo inválido o vacío`);
      // Agregar ejemplos específicos
      saldoFormatErrors.forEach(error => {
        errors.push(error);
      });
      if (invalidSaldos > 5) {
        errors.push(`... y ${invalidSaldos - 5} errores más en formato de saldo`);
      }
    }
    
    // NO advertir sobre filas vacías al final (manejo interno)
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      totalRows: actualDataRows,
      validRows: actualDataRows - invalidCurrencies - invalidSaldos,
      columns: headers
    };
    
  } catch (error) {
    errors.push(`Error al leer el archivo: ${error.message}`);
    return { valid: false, errors, warnings };
  }
}

// Validar archivo de contactos con field mappings dinámicos
export async function validateContactsFile(file, empresaConfig) {
  const errors = [];
  const warnings = [];
  let data;
  
  try {
    // Leer archivo según su tipo
    if (file.name.endsWith('.csv')) {
      data = await readCSVFile(file);
    } else {
      data = await readExcelFile(file);
    }
    
    // ========================================
    // VALIDACIÓN: Archivo completamente vacío
    // ========================================
    if (!data || data.length === 0) {
      errors.push('El archivo está completamente vacío');
      return { valid: false, errors, warnings };
    }
    
    // ========================================
    // VALIDACIÓN: Solo headers sin datos
    // ========================================
    if (data.length === 1) {
      errors.push('El archivo solo contiene nombres de columnas pero no tiene datos');
      return { valid: false, errors, warnings };
    }
    
    // Obtener headers (primera fila)
    const headers = data[0].map(h => normalizeColumnName(String(h || '')));
    
    // Validar que hay headers
    if (headers.every(h => h === '')) {
      errors.push('El archivo no contiene nombres de columnas válidos');
      return { valid: false, errors, warnings };
    }
    
    // Obtener columnas requeridas de la configuración - SOLO las que están marcadas como requeridas
    const requiredColumns = [];
    const requiredFieldNames = [];
    
    Object.entries(empresaConfig.campos_contactos).forEach(([key, config]) => {
      if (config.requerido && config.nombre) { // Solo si tiene nombre definido
        requiredColumns.push(normalizeColumnName(config.nombre));
        requiredFieldNames.push(config.nombre);
      }
    });
    
    // Validar columnas requeridas
    const missingColumns = [];
    requiredFieldNames.forEach((fieldName, index) => {
      const normalizedRequired = requiredColumns[index];
      if (!headers.includes(normalizedRequired)) {
        missingColumns.push(fieldName);
      }
    });
    
    if (missingColumns.length > 0) {
      errors.push(`Faltan columnas obligatorias: ${missingColumns.join(', ')}`);
    }
    
    // Encontrar índices de columnas (todas, no solo las requeridas)
    const columnIndices = {};
    Object.entries(empresaConfig.campos_contactos).forEach(([key, config]) => {
      if (config.nombre) { // Solo si tiene nombre definido
        const normalizedName = normalizeColumnName(config.nombre);
        const index = headers.indexOf(normalizedName);
        
        if (index !== -1) {
          columnIndices[key] = index;
        }
      }
    });
    
    // ========================================
    // IMPORTANTE: Contar filas con contenido real (sin advertir sobre vacías)
    // ========================================
    let actualDataRows = 0;
    let lastDataRowIndex = 0;
    
    // Buscar hasta dónde hay datos reales
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const hasContent = row && row.length > 0 && row.some(cell => 
        cell !== '' && cell !== null && cell !== undefined && String(cell).trim() !== ''
      );
      
      if (hasContent) {
        actualDataRows++;
        lastDataRowIndex = i;
      }
    }
    
    // ========================================
    // VALIDACIÓN: Archivo con headers pero sin datos reales
    // ========================================
    if (actualDataRows === 0) {
      errors.push('El archivo contiene columnas pero no tiene ningún registro de datos');
      return { valid: false, errors, warnings };
    }
    
    // Validar emails solo si el campo existe Y es requerido
    let invalidEmails = 0;
    const invalidEmailExamples = [];
    
    if (columnIndices.email !== undefined && empresaConfig.campos_contactos.email.requerido) {
      for (let i = 1; i <= lastDataRowIndex; i++) {
        const row = data[i];
        if (!row || row.length === 0 || row.every(cell => !cell || String(cell).trim() === '')) {
          continue;
        }
        
        const email = row[columnIndices.email];
        if (email && email !== '' && !validateEmail(email)) {
          invalidEmails++;
          if (invalidEmailExamples.length < 5) {
            invalidEmailExamples.push(`Fila ${i + 1}: ${email}`);
          }
        }
      }
      
      if (invalidEmails > 0) {
        warnings.push(`${invalidEmails} emails con formato inválido`);
        invalidEmailExamples.forEach(example => {
          warnings.push(example);
        });
        if (invalidEmails > 5) {
          warnings.push(`... y ${invalidEmails - 5} más`);
        }
      }
    }
    
    // NO advertir sobre filas vacías al final (manejo interno)
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      totalRows: actualDataRows,
      validRows: actualDataRows - invalidEmails,
      columns: headers
    };
    
  } catch (error) {
    errors.push(`Error al leer el archivo: ${error.message}`);
    return { valid: false, errors, warnings };
  }
}

// Generar reporte de errores
export function generateErrorReport(validationResult, fileName, type) {
  let content = 'REPORTE DE VALIDACIÓN\n';
  content += '=====================\n\n';
  content += `Fecha: ${new Date().toLocaleString('es-UY')}\n`;
  content += `Archivo: ${fileName}\n`;
  content += `Tipo: ${type}\n\n`;
  
  if (validationResult.errors.length > 0) {
    content += 'ERRORES:\n';
    content += '--------\n';
    validationResult.errors.forEach((error, index) => {
      content += `${index + 1}. ${error}\n`;
    });
    content += '\n';
  }
  
  if (validationResult.warnings.length > 0) {
    content += 'ADVERTENCIAS:\n';
    content += '-------------\n';
    validationResult.warnings.forEach((warning, index) => {
      content += `${index + 1}. ${warning}\n`;
    });
  }
  
  if (validationResult.totalRows) {
    content += `\nTotal de registros procesados: ${validationResult.totalRows}\n`;
  }
  
  return content;
}

// Descargar reporte
export function downloadReport(content, fileName) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}