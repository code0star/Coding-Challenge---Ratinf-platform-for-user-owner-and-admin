import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { 
  BuildingOfficeIcon, 
  ChartBarIcon, 
  UsersIcon, 
  StarIcon, 
  XMarkIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  MapPinIcon,
  PhoneIcon,
  GlobeAltIcon,
  ClockIcon
} from '@heroicons/react/24/solid';
import { validateForm } from '../utils/validation';

export default function OwnerDashboard() {
  const location = useLocation();
  const { user, role } = location.state || {};
  const navigate = useNavigate();
  
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewStoreModal, setShowNewStoreModal] = useState(false);
  const [newStore, setNewStore] = useState({
    name: '',
    address: '',
    total_rating_count: 0,
    total_rating_sum: 0
  });

  useEffect(() => {
    if (user) {
      fetchStores();
    }
  }, [user]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const { data: storesData, error: storesError } = await supabase
        .from('store')
        .select('*')
        .eq('email', user.email);

      if (storesError) throw storesError;
      
      if (storesData && storesData.length > 0) {
        setStores(storesData);
        if (!selectedStore) {
          setSelectedStore(storesData[0]);
          fetchRatings(storesData[0].id);
        }
      } else {
        setStores([]);
        setSelectedStore(null);
      }
    } catch (err) {
      setError('Error fetching stores');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async (storeId) => {
    try {
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('user_rating')
        .select('*')
        .eq('store_id', storeId);

      if (ratingsError) throw ratingsError;
      console.log('Ratings data:', ratingsData); // Debug log
      setRatings(ratingsData || []);
    } catch (err) {
      setError('Error fetching ratings');
      console.error('Error:', err);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      const { error: roleUpdateError } = await supabase
        .from('owners')
        .update({ password: newPassword })
        .eq('email', user.email);

      if (roleUpdateError) throw roleUpdateError;

      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      alert('Password updated successfully!');
    } catch (err) {
      setError(err.message);
      console.error('Password update error:', err);
    }
  };

  const onLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleNewStoreSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate form data
      const formData = {
        name: newStore.name,
        email: newStore.email,
        address: newStore.address
      };

      const validationErrors = validateForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setError(Object.values(validationErrors)[0]); // Show first error
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('stores')
        .insert([
          {
            name: newStore.name,
            email: newStore.email,
            address: newStore.address,
            total_rating_count: 0,
            total_rating_sum: 0
          }
        ]);

      if (error) throw error;

      setShowNewStoreModal(false);
      setNewStore({ name: '', email: '', address: '' });
      fetchStores();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-pink-400 mb-4">Access Denied 🔒</h2>
          <p className="text-gray-300 mb-4">Please log in to access the dashboard</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 px-6 py-3 rounded-full text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-pink-500/25"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const filteredRatings = ratings.filter(rating => 
    rating.users?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rating.users?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-auto">
      {/* Navbar */}
      <nav className="bg-black/50 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BuildingOfficeIcon className="h-8 w-8 text-pink-400" />
              <h1 className="ml-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
                Owner Dashboard ✨
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-pink-500/25"
              >
                Change Password
              </button>
              <span className="text-gray-300">{user.email}</span>
              <button
                onClick={onLogout}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Store Selection and Add Store Button */}
        <div className="mb-8 flex gap-4 items-center">
          <select
            value={selectedStore?.id || ''}
            onChange={(e) => {
              const storeId = e.target.value;
              if (storeId) {
                const store = stores.find(s => s.id === parseInt(storeId));
                if (store) {
                  setSelectedStore(store);
                  fetchRatings(store.id);
                }
              } else {
                setSelectedStore(null);
              }
            }}
            className="flex-1 p-4 rounded-xl bg-black/50 text-white border border-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="">Select a store</option>
            {stores.map(store => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowNewStoreModal(true)}
            className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 px-6 py-4 rounded-xl text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-pink-500/25 flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Add New Store
          </button>
        </div>

        {selectedStore && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-black/50 rounded-xl p-6 border border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Average Rating</p>
                    <p className="text-2xl font-bold">
                      {selectedStore.total_rating_count > 0 
                        ? (selectedStore.total_rating_sum / selectedStore.total_rating_count).toFixed(1)
                        : 'No ratings'}
                    </p>
                  </div>
                  <StarIcon className="h-8 w-8 text-yellow-400" />
                </div>
              </div>
              <div className="bg-black/50 rounded-xl p-6 border border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Ratings</p>
                    <p className="text-2xl font-bold">{selectedStore.total_rating_count}</p>
                  </div>
                  <ChartBarIcon className="h-8 w-8 text-purple-400" />
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search ratings by username or email... 🔍"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-4 pl-12 rounded-xl bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 border border-gray-800 transition-all duration-200"
                />
                <MagnifyingGlassIcon className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            {/* Ratings List */}
            <div className="bg-black/50 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
                Recent Ratings
              </h2>
              {ratings.length > 0 ? (
                <div className="space-y-4">
                  {ratings.map((rating) => (
                    <div key={rating.id} className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-gray-800">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                          <UsersIcon className="h-6 w-6 text-pink-400" />
                        </div>
                        <div>
                          <p className="font-medium">User Email: {rating.email}</p>
                          <p className="text-sm text-gray-400">Rating: {rating.rating}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-yellow-400">{'★'.repeat(rating.rating)}</span>
                        <span className="text-gray-400 text-sm">
                          {new Date(rating.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No ratings yet for this store</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* New Store Modal */}
        {showNewStoreModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-black p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-800">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
                  Add New Store 🏪
                </h2>
                <button
                  onClick={() => setShowNewStoreModal(false)}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleNewStoreSubmit} className="space-y-4">
                {/* Store Name */}
                <div className="relative">
                  <BuildingOfficeIcon className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Store Name"
                    value={newStore.name}
                    onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                    required
                    className="w-full p-3 pl-12 rounded-xl bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 border border-gray-800"
                  />
                </div>

                {/* Address */}
                <div className="relative">
                  <MapPinIcon className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Address"
                    value={newStore.address}
                    onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                    required
                    className="w-full p-3 pl-12 rounded-xl bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 border border-gray-800"
                  />
                </div>

                {error && <p className="text-red-400">{error}</p>}

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowNewStoreModal(false)}
                    className="px-4 py-2 rounded-full bg-black/50 text-white hover:bg-gray-900/50 transition-all duration-200 border border-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white transition-all duration-200 hover:shadow-lg hover:shadow-pink-500/25"
                  >
                    Add Store
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Password Update Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-black p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-800">
              <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
                Update Password 🔐
              </h2>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="relative">
                  <LockClosedIcon className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3 pl-12 rounded-xl bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 border border-gray-800"
                  />
                </div>
                <div className="relative">
                  <LockClosedIcon className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-3 pl-12 rounded-xl bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 border border-gray-800"
                  />
                </div>
                {error && <p className="text-red-400">{error}</p>}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 rounded-full bg-black/50 text-white hover:bg-gray-900/50 transition-all duration-200 border border-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white transition-all duration-200 hover:shadow-lg hover:shadow-pink-500/25"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 