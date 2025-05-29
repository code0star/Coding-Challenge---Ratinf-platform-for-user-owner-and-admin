
import React, { useState } from 'react';
import {
  UserIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/solid';
import { signUp, signIn } from './utils/auth';
import { supabase } from './utils/supabaseClient'; // if you have this setup
import { useRouter } from "next/router";


export default function App() {
  const [hovered, setHovered] = useState(null);
  const [mode, setMode] = useState(null); // 'login' or 'register'
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [userId, setUserId] = useState(null);
  const [authComplete, setAuthComplete] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("User");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
 const handleLogout = () => {
    setIsLoggedIn(false);
  };



  const roles = ["User", "Owner", "Admin"];

  const buttons = [
    { role: "Shop", loginColor: "blue", icon: BuildingOfficeIcon },
    { role: "User", loginColor: "green", icon: UserIcon },
    { role: "Admin", loginColor: "red", icon: ShieldCheckIcon },
  ];


  async function checkRoleTable(role, userId, email) {
    const table = role.toLowerCase() + 's'; // users, owners, admins
    const { data, error } = await supabase.from(table).select('*').eq('id', userId).single();

    if (data) return { exists: true };
    if (error?.code === 'PGRST116') {
      return { exists: false }; // Not found
    }
    throw error;
  }

  async function registerInRoleTable(role, userId, email) {
    const table = role.toLowerCase() + 's';
    const { error } = await supabase.from(table).insert({ id: userId, email });
    if (error) throw error;
  }
  async function handleAuth(action) {
    setMessage(null);
    try {
      if (action === 'login') {
        const user = await signIn(email, password);
        setMessage("Login successful. Select a role:");
        setUserId(user.id);
        setAuthComplete(true); // move to role selection step
      } else {
        await signUp(email, password);
        setMessage(`Registered, please confirm your email`);
      }
      setEmail('');
      setPassword('');
      setMode(null);
    } catch (error) {
      setMessage(error.message);
    }
  }






  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-900 via-gray-800 to-black text-white font-sans relative">
      {/* Navbar */ }
      <div className="p-6">
      {/* Show Login / Register if NOT logged in and modal is closed */}
      {!isLoggedIn && showModal && (
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded shadow-lg font-semibold text-white"
        >
          Login / Register
        </button>
      )}

      {/* If logged in, show logout button */}
      {isLoggedIn &&showModal&& (
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded shadow-lg font-semibold text-white"
        >
          Logout
        </button>
      )}

      {/* Modal */}
      {!showModal && !mode && (
        <div className="mt-4 flex gap-4">
          <button
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-400 to-teal-500 text-white font-semibold shadow-lg hover:from-green-500 hover:to-teal-600 transition duration-300"
            onClick={() => setMode('register')}
          >
            Create Account
          </button>

          <button
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-lg hover:from-blue-600 hover:to-indigo-700 transition duration-300"
            onClick={() => setMode('login')}
          >
            Login Account
          </button>
        </div>
      )}

      {/* Auth Form simulation */}
      {showModal && mode && (
        <div className="mt-4 p-6 bg-gray-800 rounded-lg text-white max-w-md">
          <h2 className="text-xl mb-4">{mode === 'login' ? 'Login' : 'Register'}</h2>

          {/* Replace these with your real form inputs */}
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 mb-4 rounded bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 mb-6 rounded bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 rounded font-semibold transition duration-300"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Register'}
          </button>

          <button
            onClick={() => setMode(null)}
            className="mt-3 w-full bg-gray-700 hover:bg-gray-600 py-2 rounded text-sm"
          >
            Back
          </button>
        </div>
      )}
    </div>


      {/* Landing Page */ }
      <div className="flex flex-col justify-center items-center h-screen text-center px-6">
        <h1 className="text-5xl font-extrabold mb-4">
          Welcome to <span className="text-indigo-400">Rate & Review</span>
        </h1>
        <p className="text-gray-300 text-lg max-w-2xl">
          A next-gen platform that allows users, owners, and admins to manage, rate, and review shops seamlessly. Join now and experience the change!
        </p>
      </div>

      {/* Modal */ }
      { showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black p-8 rounded-2xl shadow-2xl w-full max-w-xl border border-gray-700">
            {/* Header */ }
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-white tracking-wide drop-shadow">
                { mode === "login" ? "Login" : "Register" }
              </h2>
              <button
                onClick={ () => setShowModal(false) }
                className="text-gray-400 hover:text-white text-2xl"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Role Cards */ }
            <div className="grid grid-cols-3 gap-4 mb-6">
              { roles.map((role) => (
                <button
                  key={ role }
                  onClick={ () => setSelectedRole(role) }
                  className={ `rounded-xl p-4 text-sm font-semibold transition duration-300 shadow-md hover:shadow-xl transform hover:scale-105 ${selectedRole === role
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white ring-2 ring-indigo-300"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }` }
                >
                  { role }
                </button>
              )) }
            </div>

            {/* Mode Switch */ }
            <div className="flex justify-center gap-6 mb-6">
              <button
                onClick={ () => setMode("login") }
                className={ `px-5 py-2 rounded-full text-sm font-semibold shadow-md transition ${mode === "login"
                    ? "bg-indigo-600 text-white shadow-indigo-500/30"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }` }
              >
                Login
              </button>
              <button
                onClick={ () => setMode("register") }
                className={ `px-5 py-2 rounded-full text-sm font-semibold shadow-md transition ${mode === "register"
                    ? "bg-purple-600 text-white shadow-purple-500/30"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }` }
              >
                Register
              </button>
            </div>

            {/* Auth Form */ }
            <input
              type="email"
              placeholder="Email"
              value={ email }
              onChange={ (e) => setEmail(e.target.value) }
              className="w-full p-3 mb-4 rounded-xl bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={ password }
              onChange={ (e) => setPassword(e.target.value) }
              className="w-full p-3 mb-6 rounded-xl bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button
              onClick={ handleAuth }
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 py-3 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition duration-300"
            >
              { mode === "login" ? "Login" : "Register" } as { selectedRole }
            </button>
          </div>
        </div>
      ) }

    </div>
  );
}
