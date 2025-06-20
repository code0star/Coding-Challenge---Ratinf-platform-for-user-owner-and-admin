import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { 
  UserGroupIcon,
  BuildingOfficeIcon,
  StarIcon,
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  UserIcon,
  MapPinIcon,
  EnvelopeIcon,
  KeyIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/solid';
import { validateForm } from '../utils/validation';

export default function AdminDashboard() {
  const location = useLocation();
  const { user } = location.state || {};
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStores: 0,
    totalRatings: 0
  });
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [showNewStoreModal, setShowNewStoreModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'stores'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    role: 'user' // Default to 'user' role
  });

  const [newStore, setNewStore] = useState({
    name: '',
    address: '',
    email: '',
    total_rating_count: 0,
    total_rating_sum: 0
  });

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchUsers();
      fetchStores();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      // Fetch total users from all tables
      const [usersCount, ownersCount, adminsCount] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('owners').select('*', { count: 'exact', head: true }),
        supabase.from('admins').select('*', { count: 'exact', head: true })
      ]);

      // Calculate total users by summing all counts
      const totalUsers = (usersCount.count || 0) + (ownersCount.count || 0) + (adminsCount.count || 0);

      // Fetch total stores
      const { count: storeCount } = await supabase
        .from('store')
        .select('*', { count: 'exact', head: true });

      // Fetch total ratings
      const { count: ratingCount } = await supabase
        .from('user_rating')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: totalUsers,
        totalStores: storeCount || 0,
        totalRatings: ratingCount || 0
      });
    } catch (err) {
      setError('Error fetching stats');
      console.error('Error:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      // Fetch from all role tables
      const [usersData, ownersData, adminsData] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('owners').select('*'),
        supabase.from('admins').select('*')
      ]);

      // Combine all users with their roles
      const allUsers = [
        ...(usersData.data || []).map(user => ({ ...user, role: 'user' })),
        ...(ownersData.data || []).map(owner => ({ ...owner, role: 'owner' })),
        ...(adminsData.data || []).map(admin => ({ ...admin, role: 'admin' }))
      ];

      console.log('Fetched users:', allUsers); // Debug log
      setUsers(allUsers);
    } catch (err) {
      setError('Error fetching users');
      console.error('Error:', err);
    }
  };

  const fetchStores = async () => {
    try {
      const { data: storesData, error: storesError } = await supabase
        .from('store')
        .select('*');

      if (storesError) throw storesError;
      setStores(storesData || []);
    } catch (err) {
      setError('Error fetching stores');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewUserSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate form data
      const formData = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        address: newUser.address
      };

      const validationErrors = validateForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setError(Object.values(validationErrors)[0]); // Show first error
        setLoading(false);
        return;
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
      });

      if (authError) throw authError;

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            name: newUser.name,
            email: newUser.email,
            address: newUser.address,
            role: newUser.role
          }
        ]);

      if (profileError) throw profileError;

      setShowNewUserModal(false);
      setNewUser({ name: '', email: '', password: '', address: '', role: 'user' });
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  const onLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
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

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStores = stores.filter(store => 
    store.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-auto">
      {/* Navbar */}
      <nav className="bg-black/50 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-pink-400" />
              <h1 className="ml-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
                Admin Dashboard 👑
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">{user.email}</span>
              <button
                onClick={onLogout}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25 flex items-center gap-2"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-black/50 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Readers</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-pink-400" />
            </div>
          </div>
          <div className="bg-black/50 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Books</p>
                <p className="text-2xl font-bold">{stats.totalStores}</p>
              </div>
              <BuildingOfficeIcon className="h-8 w-8 text-purple-400" />
            </div>
          </div>
          <div className="bg-black/50 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Ratings</p>
                <p className="text-2xl font-bold">{stats.totalRatings}</p>
              </div>
              <StarIcon className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-full transition-all duration-200 ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white'
                : 'bg-black/50 text-gray-400 hover:text-white'
            }`}
          >
            Reader
          </button>
          <button
            onClick={() => setActiveTab('stores')}
            className={`px-4 py-2 rounded-full transition-all duration-200 ${
              activeTab === 'stores'
                ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white'
                : 'bg-black/50 text-gray-400 hover:text-white'
            }`}
          >
            Books
          </button>
        </div>

        {/* Search and Add Button */}
        <div className="flex gap-4 mb-8">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={`Search ${activeTab}... 🔍`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-4 pl-12 rounded-xl bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 border border-gray-800 transition-all duration-200"
            />
            <MagnifyingGlassIcon className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
          </div>
          {activeTab === 'users' && (
            <button
              onClick={() => setShowNewUserModal(true)}
              className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 px-6 py-4 rounded-xl text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-pink-500/25 flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Add Reader
            </button>
          )}
          {activeTab === 'stores' && (
            <button
              onClick={() => setShowNewStoreModal(true)}
              className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 px-6 py-4 rounded-xl text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-pink-500/25 flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Add Book
            </button>
          )}
        </div>

        {/* Users List */}
        {activeTab === 'users' && (
          <div className="bg-black/50 rounded-xl p-6 border border-gray-800">
            <div className="space-y-4">
              {filteredUsers.map((user) => {
                const role = user.role || 'user'; // Default to 'user' if role is undefined
                return (
                  <div key={`${role}-${user.email}`} className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-gray-800">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-pink-400" />
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-400">Email: {user.email}</p>
                        <p className="text-sm text-gray-400">Address: {user.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        role === 'admin' 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : role === 'owner'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-pink-500/20 text-pink-400'
                      }`}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stores List */}
        {activeTab === 'stores' && (
          <div className="bg-black/50 rounded-xl p-6 border border-gray-800">
            <div className="space-y-4">
              {filteredStores.map((store) => (
                <div key={store.id} className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-gray-800">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <BuildingOfficeIcon className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium">{store.name}</p>
                      <p className="text-sm text-gray-400">Store Email: {store.email}</p>
                      <p className="text-sm text-gray-400">Address: {store.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-400">
                      {store.total_rating_count > 0 
                        ? (store.total_rating_sum / store.total_rating_count).toFixed(1)
                        : 'No ratings'}
                    </span>
                    <StarIcon className="h-5 w-5 text-yellow-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New User Modal */}
        {showNewUserModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-black p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-800">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
                  Add New Reader 👤
                </h2>
                <button
                  onClick={() => setShowNewUserModal(false)}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleNewUserSubmit} className="space-y-4">
                <div className="relative">
                  <UserIcon className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    required
                    className="w-full p-3 pl-12 rounded-xl bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 border border-gray-800"
                  />
                </div>

                <div className="relative">
                  <EnvelopeIcon className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                    className="w-full p-3 pl-12 rounded-xl bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 border border-gray-800"
                  />
                </div>

                <div className="relative">
                  <KeyIcon className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                    className="w-full p-3 pl-12 rounded-xl bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 border border-gray-800"
                  />
                </div>

                <div className="relative">
                  <MapPinIcon className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Address"
                    value={newUser.address}
                    onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                    required
                    className="w-full p-3 pl-12 rounded-xl bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 border border-gray-800"
                  />
                </div>

                <div className="relative">
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    required
                    className="w-full p-3 pl-12 rounded-xl bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 border border-gray-800"
                  >
                    <option value="user">Normal Reader</option>
                    <option value="owner">Book Owner</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {error && <p className="text-red-400">{error}</p>}

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowNewUserModal(false)}
                    className="px-4 py-2 rounded-full bg-black/50 text-white hover:bg-gray-900/50 transition-all duration-200 border border-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white transition-all duration-200 hover:shadow-lg hover:shadow-pink-500/25"
                  >
                    Add User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* New Store Modal */}
        {showNewStoreModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-black p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-800">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
                  Add New Book 📚
                </h2>
                <button
                  onClick={() => setShowNewStoreModal(false)}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleNewStoreSubmit} className="space-y-4">
                <div className="relative">
                  <BuildingOfficeIcon className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Book Name"
                    value={newStore.name}
                    onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                    required
                    className="w-full p-3 pl-12 rounded-xl bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 border border-gray-800"
                  />
                </div>

                <div className="relative">
                  <EnvelopeIcon className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Author Email"
                    value={newStore.email}
                    onChange={(e) => setNewStore({ ...newStore, email: e.target.value })}
                    required
                    className="w-full p-3 pl-12 rounded-xl bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 border border-gray-800"
                  />
                </div>

                <div className="relative">
                  
                  <input
                    type="text"
                    placeholder="Joundra"
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
                    Add Book
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