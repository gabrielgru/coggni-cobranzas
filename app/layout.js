import './globals.css'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'

export const metadata = {
  title: 'Coggni - Sistema de Cobranza Multi-Empresa',
  description: 'Sistema automatizado de cobranzas para múltiples empresas con WhatsApp y Email',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}