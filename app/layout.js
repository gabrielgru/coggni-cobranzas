import './globals.css'

export const metadata = {
  title: 'Coggni - Sistema de Cobranza Multi-Empresa',
  description: 'Sistema automatizado de cobranzas para múltiples empresas con WhatsApp y Email',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}