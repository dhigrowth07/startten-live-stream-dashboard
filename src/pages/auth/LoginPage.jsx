import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminLogin, selectAuthState } from '../../redux/auth/authSlice';
import { showErrorToast } from '../../utils/toast';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, status } = useSelector(selectAuthState);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const isLoading = status === 'loading';

  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.email || !formData.password) {
      showErrorToast('Email and password are required');
      return;
    }

    dispatch(adminLogin(formData));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl bg-gray-800/70 p-8 shadow-lg backdrop-blur">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white">STARTTEN Admin Login</h1>
          <p className="text-sm text-gray-400">Secure access to the live stream control panel</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-300">
              Admin Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 outline-none focus:border-indigo-500 focus:ring focus:ring-indigo-500/30"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 outline-none focus:border-indigo-500 focus:ring focus:ring-indigo-500/30"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-indigo-600 py-2 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-800"
          >
            {isLoading ? 'Authenticating…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
