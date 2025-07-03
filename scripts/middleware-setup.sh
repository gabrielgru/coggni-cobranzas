#!/bin/bash
# Script de configuración y verificación del nuevo middleware

echo "🚀 Verificando la implementación del middleware..."

# 1. Verificar que los archivos existen
echo "📁 Verificando archivos creados..."

files_to_check=(
    "middleware.js"
    "app/lib/metrics.js"
    "app/utils/cookieManager.js"
)

all_files_exist=true
for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file existe"
    else
        echo "❌ $file NO existe"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = false ]; then
    echo "❌ Faltan archivos. Por favor, créalos primero."
    exit 1
fi

# 2. Verificar dependencias
echo -e "\n📦 Verificando dependencias..."
if grep -q "@supabase/auth-helpers-nextjs" package.json; then
    echo "✅ @supabase/auth-helpers-nextjs instalado"
else
    echo "❌ @supabase/auth-helpers-nextjs NO instalado"
    echo "Ejecuta: npm install @supabase/auth-helpers-nextjs"
    exit 1
fi

# 3. Verificar variables de entorno
echo -e "\n🔐 Verificando variables de entorno..."
if [ -f ".env.local" ]; then
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        echo "✅ NEXT_PUBLIC_SUPABASE_URL configurada"
    else
        echo "❌ NEXT_PUBLIC_SUPABASE_URL NO configurada"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY configurada"
    else
        echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY NO configurada"
    fi
else
    echo "⚠️  No se encontró .env.local"
fi

# 4. Crear archivo de test manual
echo -e "\n📝 Creando guía de testing manual..."

cat > TEST_MIDDLEWARE.md << 'EOF'
# 🧪 Guía de Testing del Middleware

## Tests Básicos (5 min)

### 1. Test de Login
1. Abre la consola del navegador (F12)
2. Ve a `/login`
3. Inicia sesión con credenciales válidas
4. Verifica en consola:
   - `[Middleware]` logs mostrando performance
   - No hay errores
5. Verifica cookies (en Application > Cookies):
   - `coggni-user`
   - `coggni-user-type`
   - `coggni-last-activity`
   - `coggni-session-cache`

### 2. Test de Rutas Protegidas
1. Cierra sesión
2. Intenta acceder a `/collections`
3. Debe redirigir a `/login?redirect=/collections`

### 3. Test de Cache
1. Con sesión activa, navega entre páginas
2. En los logs de consola deberías ver:
   - `[Middleware] /collections - XXms (cached)` después de la primera visita
   - El tiempo debe ser <10ms cuando está cacheado

### 4. Test de Timeout (rápido)
1. Inicia sesión
2. En DevTools > Application > Cookies
3. Edita `coggni-last-activity`
4. Cambia el valor a: `1` (timestamp muy viejo)
5. Navega a cualquier página
6. Debe cerrar sesión y mostrar mensaje de timeout

### 5. Test de Limpieza
1. En consola, ejecuta:
```javascript
// Ver todas las cookies
document.cookie.split(';').forEach(c => console.log(c.trim()))

// Borrar solo algunas cookies (simular estado inconsistente)
document.cookie = "coggni-user=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
```
2. Recarga la página
3. Debe limpiar todas las cookies y redirigir a login

## Tests Avanzados (10 min)

### 6. Test de Performance
```javascript
// En consola, ejecutar para ver métricas acumuladas
console.log('Esperando métricas...')
setTimeout(() => {
  // Las métricas se loguean cada 30 segundos o cada 100 requests
  console.log('Revisa los logs anteriores para ver el resumen de métricas')
}, 5000)
```

### 7. Test de Race Condition
1. Abre 2 pestañas con la app
2. Navega rápidamente entre páginas en ambas
3. No debe haber comportamiento extraño

### 8. Test Mobile
1. Abre en el móvil (o modo responsive)
2. Repite tests 1-3
3. Verifica que funcione igual

## Verificación de Logs

En desarrollo, deberías ver logs como:
```
[Middleware] /collections - 45ms (miss)
[Middleware] /collections - 3ms (hit)
[Supabase Init] Client created: true
[AuthContext] Login successful
```

## ✅ Checklist Final
- [ ] Login/logout funciona
- [ ] Rutas protegidas redirigen
- [ ] Cache mejora performance
- [ ] Timeout cierra sesión
- [ ] No hay loops de redirect
- [ ] Mobile funciona igual
- [ ] Logs sin errores
EOF

echo "✅ Guía de testing creada en TEST_MIDDLEWARE.md"

# 5. Mostrar resumen
echo -e "\n📊 RESUMEN:"
echo "==========="
echo "✅ Archivos verificados"
echo "✅ Dependencias verificadas"
echo "📋 Guía de testing creada"
echo ""
echo "🎯 Próximos pasos:"
echo "1. Revisa TEST_MIDDLEWARE.md"
echo "2. Ejecuta los tests manualmente"
echo "3. Si todo funciona, hacer commit"
echo "4. Deploy a staging/preview"
echo ""
echo "💡 Tip: Abre TEST_MIDDLEWARE.md y sigue la guía paso a paso"