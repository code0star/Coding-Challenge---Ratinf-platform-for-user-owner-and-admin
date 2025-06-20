import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { StarIcon, MagnifyingGlassIcon, PencilIcon } from '@heroicons/react/24/solid';
import { useLocation } from 'react-router-dom';

export default function UserDashboard() {
   const location = useLocation();
  const { user, role } = location.state || {};

  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ratingModal, setRatingModal] = useState({ show: false, store: null });
  const [userRating, setUserRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRatings, setUserRatings] = useState({});

const onLogout = async () => {
  await supabase.auth.signOut();
  navigate('/'); // redirect to login
};

  // Fetch stores on component mount
  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const { data: storesData, error: storesError } = await supabase
        .from('store')
        .select('*');
      
      if (storesError) throw storesError;

      // Fetch user's ratings for all stores
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('user_rating')
        .select('*')
        .eq('email', user.email);

      if (ratingsError) throw ratingsError;

      // Create a map of store_id to user's rating
      const ratingsMap = {};
      ratingsData.forEach(rating => {
        ratingsMap[rating.store_id] = rating.rating;
      });

      setUserRatings(ratingsMap);
      setStores(storesData);
    } catch (err) {
      setError('Error fetching stores');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      // First update the password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      // Then update the password in the role table
      const roleTable = `${user.role.toLowerCase()}s`;
      const { error: roleUpdateError } = await supabase
        .from(roleTable)
        .update({ password: newPassword })
        .eq('email', user.email);

      if (roleUpdateError) throw roleUpdateError;

      // Clear the form and close modal
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setError(null);

      // Show success message
      alert('Password updated successfully!');
    } catch (err) {
      setError(err.message);
      console.error('Password update error:', err);
    }
  };

  const handleRatingSubmit = async (storeId) => {
    try {
      const existingRating = userRatings[storeId];
      const ratingData = {
        store_id: storeId,
        email: user.email,
        username: user.email.split('@')[0],
        rating: userRating
      };

      // First, update the user_rating table
      const { error: ratingError } = await supabase
        .from('user_rating')
        .upsert(ratingData, {
          onConflict: 'store_id,email'
        });

      if (ratingError) throw ratingError;

      // Get current store data
      const { data: storeData, error: fetchError } = await supabase
        .from('store')
        .select('total_rating_count, total_rating_sum')
        .eq('id', storeId)
        .single();

      if (fetchError) throw fetchError;

      // Get total number of unique ratings for this store
      const { count: uniqueRatingsCount, error: countError } = await supabase
        .from('user_rating')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId);

      if (countError) throw countError;

      // Calculate new totals
      let newTotalCount = uniqueRatingsCount;
      let newTotalSum;

      if (existingRating) {
        // If updating an existing rating, update sum by replacing old with new
        newTotalSum = (storeData.total_rating_sum || 0) - existingRating + userRating;
      } else {
        // If it's a new rating
        newTotalSum = (storeData.total_rating_sum || 0) + userRating;
      }

      // Update store with new totals
      const { error: updateError } = await supabase
        .from('store')
        .update({
          total_rating_count: newTotalCount,
          total_rating_sum: newTotalSum
        })
        .eq('id', storeId);

      if (updateError) throw updateError;

      // Update local state
      setUserRatings(prev => ({
        ...prev,
        [storeId]: userRating
      }));

      // Force refresh the stores data
      await fetchStores();
      setRatingModal({ show: false, store: null });
    } catch (err) {
      setError(err.message);
      console.error('Rating submission error:', err);
    }
  };

  const filteredStores = stores.filter(store => 
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-auto">
      {/* Navbar */}
      <nav className="bg-black/50 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
              Reader Dashboard ✨
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
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search books by name... 🔍"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-4 pl-12 rounded-xl bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 border border-gray-800 transition-all duration-200"
            />
            <MagnifyingGlassIcon className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>

        {/* Stores List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => (
            <div key={store.id} className="bg-black/50 rounded-xl p-6 border border-gray-800 hover:border-pink-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-pink-500/10">
              <h3 className="text-xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
                {store.name}
              </h3>
              <p className="text-gray-300 mb-4">{store.address}</p>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-yellow-400 mr-2">★</span>
                  <span>
                    {store.total_rating_count > 0 
                      ? (store.total_rating_sum / store.total_rating_count).toFixed(1)
                      : 'No ratings'}
                  </span>
                  <span className="text-gray-400 text-sm ml-2">
                    ({store.total_rating_count} ratings)
                  </span>
                </div>
                <button
                  onClick={() => {
                    setUserRating(userRatings[store.id] || 0);
                    setRatingModal({ show: true, store });
                  }}
                  className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-pink-500/25"
                >
                  {userRatings[store.id] ? 'Update Rating' : 'Rate Store'}
                </button>
              </div>
              {userRatings[store.id] && (
                <p className="text-sm text-gray-400">
                  Your rating: {userRatings[store.id]} ★
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Password Update Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-black p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-800">
              <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
                Update Password 🔐
              </h2>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 border border-gray-800"
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 border border-gray-800"
                />
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

        {/* Rating Modal */}
        {ratingModal.show && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-black p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-800">
              <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
                {userRatings[ratingModal.store.id] ? 'Update Rating' : 'Rate'} {ratingModal.store?.name} ⭐
              </h2>
              <div className="flex justify-center space-x-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setUserRating(star)}
                    className={`text-3xl transform hover:scale-110 transition-all duration-200 ${
                      star <= userRating ? 'text-yellow-400' : 'text-gray-400'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setRatingModal({ show: false, store: null })}
                  className="px-4 py-2 rounded-full bg-black/50 text-white hover:bg-gray-900/50 transition-all duration-200 border border-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRatingSubmit(ratingModal.store.id)}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white transition-all duration-200 hover:shadow-lg hover:shadow-pink-500/25"
                >
                  {userRatings[ratingModal.store.id] ? 'Update Rating' : 'Submit Rating'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

