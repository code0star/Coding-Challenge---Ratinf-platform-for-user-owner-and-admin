// ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Replace this with your actual auth logic
  const isAuthenticated = Boolean(localStorage.getItem('user')); 

  if (!isAuthenticated) {
    // If not logged in, redirect to home or login page
    return <Navigate to="/" replace />;
  }

  // If authenticated, render the child component(s)
  return children;
};

export default ProtectedRoute;
