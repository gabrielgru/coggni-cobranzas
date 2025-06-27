'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Por ahora, redirect directo a collections
    // En el futuro, aquí estará el dashboard
    router.replace('/collections');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}