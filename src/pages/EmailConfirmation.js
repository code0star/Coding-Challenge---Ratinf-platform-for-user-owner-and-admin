import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../utils/auth';// Adjust the import path to your supabase client instance
import { checkAllRoleTables } from '../utils/auth';// Your helper function to check roles

function EmailConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        setStatus('Getting authentication tokens...');

        // Extract tokens from URL query params
        const params = new URLSearchParams(location.search);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (!accessToken || !refreshToken) {
          throw new Error('Missing authentication tokens');
        }

        setStatus('Setting up your session...');
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) throw sessionError;

        setStatus('Getting user information...');
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw userError;

        if (user) {
          setStatus('Checking your roles...');
          const existingRoles = await checkAllRoleTables(user.email);
          const roles = Object.keys(existingRoles);

          if (roles.length > 0) {
            setStatus('Redirecting to dashboard...');
            navigate('/dashboard', {
              state: {
                user: {
                  email: user.email,
                  role: roles[0],
                  existingRoles: roles,
                },
              },
            });
          } else {
            setStatus('No roles found, redirecting to home...');
            navigate('/', {
              state: {
                message: 'Email confirmed! Please log in with your credentials.',
              },
            });
          }
        }
      } catch (err) {
        setError(err.message);
        setStatus('Error occurred, redirecting...');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleEmailConfirmation();
  }, [navigate, location]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="bg-gray-800/50 p-8 rounded-xl border border-gray-700">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-gray-300">{error}</p>
          <p className="text-gray-400 mt-4">Redirecting to home page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
      <div className="bg-gray-800/50 p-8 rounded-xl border border-gray-700">
        <h2 className="text-2xl font-bold text-green-400 mb-4">Confirming Email</h2>
        <p className="text-gray-300">{status}</p>
        <div className="mt-4 flex justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
}

export default EmailConfirmation;
