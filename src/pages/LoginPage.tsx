import React, { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
const [loginType, setLoginType] = useState<'admin' | 'ddpo'>('admin');


  const handleLoginSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-full bg-muted p-1 shadow-inner border border-border">
            <button
              type="button"
              className={`px-6 py-2 rounded-full text-sm font-semibold focus:outline-none transition-all duration-200 ${loginType === 'admin' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
              aria-pressed={loginType === 'admin'}
              onClick={() => setLoginType('admin')}
            >
              College
            </button>
            <button
              type="button"
              className={`px-6 py-2 rounded-full text-sm font-semibold focus:outline-none transition-all duration-200 ${loginType === 'ddpo' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
              aria-pressed={loginType === 'ddpo'}
              onClick={() => setLoginType('ddpo')}
            >
              DDPU
            </button>
          </div>
        </div>
        <LoginForm onSuccess={handleLoginSuccess} type={loginType} />
      </div>
    </div>
  );
};