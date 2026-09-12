import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      const data = await forgotPassword(email);
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
        <p className="text-line mb-8 text-sm">Reset your password.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-line mb-1">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-card bg-graphite-soft border border-line-dark px-3 py-2 text-canvas placeholder:text-line-dark focus-visible:border-accent"
              placeholder="you@example.com"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm" style={{ color: '#ffffff' }}>{message}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-card bg-accent text-canvas py-2 font-medium disabled:opacity-60"
          >
            {submitting ? 'Sending reset link…' : 'Send reset link'}
          </button>
        </form>

        <p className="text-sm text-line mt-6">
          Remembered it?{' '}
          <Link to="/login" className="text-accent-soft underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
