import React, { useEffect, useState } from 'react';
import { handleAuthCallback } from '../utils/auth';

const AuthCallback = () => {
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const processCallback = async () => {
      try {
        setStatus('processing');
        alert('Please check your email for the verification link to complete your registration.');
        await handleAuthCallback();
        setStatus('success');
      } catch (error) {
        console.error('Error processing auth callback:', error);
        setStatus('error');
      }
    };

    processCallback();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        {status === 'processing' && (
          <>
            <h1 className="text-2xl font-bold mb-4">Processing your registration...</h1>
            <p className="text-gray-400 mb-4">Please check your email for the verification link.</p>
            <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </>
        )}
        {status === 'success' && (
          <>
            <h1 className="text-2xl font-bold mb-4 text-green-500">Registration Successful!</h1>
            <p className="text-gray-400">Redirecting you to your dashboard...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="text-2xl font-bold mb-4 text-red-500">Registration Failed</h1>
            <p className="text-gray-400">Please try again or contact support.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback; 