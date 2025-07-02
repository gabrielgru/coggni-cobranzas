'use client';

import LoginForm from '../../components/shared/LoginForm';

export default function Login() {
  return (
    <div className="login-container">
      <LoginForm showSessionNote={false} />
    </div>
  );
}