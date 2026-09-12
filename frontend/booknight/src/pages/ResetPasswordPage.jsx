import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const data = await resetPassword(token, password);
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-graphite px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-canvas mb-1">Booknight</h1>
        <p className="text-line mb-8 text-sm">Set a new password.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm text-line mb-1">New password</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-card bg-graphite-soft border border-line-dark px-3 py-2 text-canvas placeholder:text-line-dark focus-visible:border-accent"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm text-line mb-1">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-card bg-graphite-soft border border-line-dark px-3 py-2 text-canvas placeholder:text-line-dark focus-visible:border-accent"
              placeholder="Repeat your new password"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm" style={{ color: '#ffffff' }}>{message}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-card bg-accent text-canvas py-2 font-medium disabled:opacity-60"
          >
            {submitting ? 'Updating password…' : 'Update password'}
          </button>
        </form>

        <p className="text-sm text-line mt-6">
          <Link to="/login" className="text-accent-soft underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
