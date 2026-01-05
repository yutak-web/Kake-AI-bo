
import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { ensureUserExists } from '../services/db';

const LoginPage: React.FC = () => {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await ensureUserExists(result.user);
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert("ログインに失敗しました。");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-12 rounded-2xl shadow-xl max-w-md w-full text-center sketch-border">
        <h1 className="text-4xl font-bold mb-12 text-gray-800 tracking-tight">Kake-AI-bo</h1>
        <p className="text-gray-500 mb-8 text-sm italic">
          お金の流れを見える化して、<br/>もっとスマートな家計管理を。
        </p>
        <button
          onClick={handleLogin}
          className="flex items-center justify-center w-full py-4 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all space-x-4 text-xl font-medium shadow-sm hover:shadow-md"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
          <span>Google ログイン</span>
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
