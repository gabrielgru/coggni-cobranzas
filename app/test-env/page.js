export default function TestEnv() {
  return (
    <div>
      <h1>Test Environment Variables</h1>
      <p>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT FOUND'}</p>
      <p>Has ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'YES' : 'NO'}</p>
    </div>
  );
}