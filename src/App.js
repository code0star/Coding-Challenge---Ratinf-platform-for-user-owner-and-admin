import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  UserIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ArrowRightIcon,
  MapPinIcon,
  PhoneIcon,
  LinkIcon
} from '@heroicons/react/24/solid';
import UserDashboard from './pages/userDashboard';
import OwnerDashboard from './pages/ownerDashboard';
import AdminDashboard from './pages/adminDashboard';
import { signUp, signIn } from './utils/auth';
import { supabase } from './utils/supabaseClient';
import {  checkAllRoleTables } from './utils/auth';
import ProtectedRoute from './components/ProtectedRoute';
import { registerUserWithRole } from './utils/auth';
import { loginUserWithRole } from './utils/auth';
import { validateForm } from './utils/validation';




// Main App component
function App() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const [mode, setMode] = useState(null);
  const [selectedRole, setSelectedRole] = useState("User");
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
   const [user, setUser] = useState(null);



  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate form data
      const formData = {
        name,
        email,
        password,
        address
      };

      const validationErrors = validateForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setError(Object.values(validationErrors)[0]); // Show first error
        setLoading(false);
        return;
      }

      if (mode === 'register' && (!email || !password || !selectedRole || !name || !address)) {
        throw new Error('Please fill in all fields and select a role');
      } else if (mode === 'login' && (!email || !password || !selectedRole)) {
        throw new Error('Please fill in all fields and select a role');
      }

      if (mode === 'login') {
        // Login mode
        const loginResponse = await loginUserWithRole(email, password, selectedRole);

        if (loginResponse.status === 'success') {
          const userData = {
            email,
            role: selectedRole.toLowerCase(),
            ...loginResponse
          };

          setUser(userData);
          setIsLoggedIn(true);
          setShowModal(false);
          navigate(`/pages/${selectedRole.toLowerCase()}dashboard`, {
            state: {
              user: userData,
              role: selectedRole.toLowerCase()
            }
          });
        } else {
          setError(loginResponse.message || 'Login failed');
        }

      } else if (mode === 'register') {
        // Register mode
        const registerResponse = await registerUserWithRole(email, password, selectedRole, name, address);

        if (registerResponse.status === 'success') {
          // After successful registration, navigate to '/'
          navigate('/');
        } else {
          setError(registerResponse.message || 'Registration failed');
        }
      } else {
        throw new Error('Invalid mode. Please select login or register.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Routes>
        <Route path="/pages/ownerdashboard" element={<OwnerDashboard />} />
        <Route path="/pages/admindashboard" element={<AdminDashboard />} />
        <Route path="/pages/userdashboard" element={<UserDashboard />} />
        <Route path="/" element={
          <div className="relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
            </div>

            {/* Navbar */}
            <div className="p-6 relative z-10">
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 px-6 py-3 rounded-full shadow-lg font-semibold text-white transform hover:scale-105 transition-all duration-200 hover:shadow-pink-500/25"
              >
                Login / Register
              </button>
            </div>

            {/* Landing Page */}
            <div className="flex flex-col justify-center items-center h-screen text-center px-6 relative z-10">
              <h1 className="text-7xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-gradient">
                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Rate & Review</span>
              </h1>
              <p className="text-gray-300 text-xl max-w-2xl leading-relaxed font-light">
                A next-gen platform that allows users, owners, and admins to manage, rate, and review shops seamlessly. Join now and experience the change!
              </p>
              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => {
                    setMode("login");
                    setShowModal(true);
                  }}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 px-8 py-4 rounded-full text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-pink-500/25"
                >
                  Get Started
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-black/50 hover:bg-gray-900/50 px-8 py-4 rounded-full text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-800"
                >
                  About Me
                </button>
              </div>
            </div>

            {/* Modal */}
            {showModal && (
              <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-black p-8 rounded-3xl shadow-2xl w-full max-w-xl border border-gray-800 transform transition-all duration-300 scale-100 hover:scale-[1.02]">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
                      About Me 👋
                    </h2>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-gray-400 hover:text-white text-2xl transform hover:scale-110 transition-all duration-200"
                      aria-label="Close modal"
                    >
                      <XMarkIcon className="w-8 h-8" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-white mb-2">Gaurav Kaushalye</h3>
                      <p className="text-gray-400">Full Stack Developer</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 p-4 bg-black/30 rounded-xl border border-gray-800">
                        <EnvelopeIcon className="w-6 h-6 text-pink-400" />
                        <div>
                          <p className="text-gray-400 text-sm">Email</p>
                          <p className="text-white">gauravkaushalye@gmail.com</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 p-4 bg-black/30 rounded-xl border border-gray-800">
                        <PhoneIcon className="w-6 h-6 text-purple-400" />
                        <div>
                          <p className="text-gray-400 text-sm">Phone</p>
                          <p className="text-white">+91 9359797970</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 p-4 bg-black/30 rounded-xl border border-gray-800">
                        <LinkIcon className="w-6 h-6 text-blue-400" />
                        <div>
                          <p className="text-gray-400 text-sm">LinkedIn</p>
                          <a 
                            href="https://www.linkedin.com/in/gaurav-kaushalye/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-white hover:text-blue-400 transition-colors duration-200"
                          >
                            linkedin.com/in/gaurav-kaushalye
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="text-center mt-8">
                      <button
                        onClick={() => {
                          setShowModal(false);
                          setMode("login");
                          setShowModal(true);
                        }}
                        className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 px-6 py-3 rounded-full text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-pink-500/25"
                      >
                        Get Started
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        } />
      </Routes>
    </div>
  );
}

export default App;