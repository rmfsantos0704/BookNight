import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/common/BrandLogo';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/board');
    } catch (err) {
      if (err.requiresVerification) {
        navigate('/verify-email', { state: { email: err.email || email } });
        return;
      }
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-graphite px-4">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex justify-center">
          <BrandLogo className="justify-center" textClassName="text-canvas" />
        </div>
        <p className="text-line mb-8 text-sm text-center">Sign in to your workspace.</p>

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
          <div>
            <label htmlFor="password" className="block text-sm text-line mb-1">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-card bg-graphite-soft border border-line-dark px-3 py-2 text-canvas placeholder:text-line-dark focus-visible:border-accent"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-card bg-accent text-canvas py-2 font-medium disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-sm text-line mt-4">
          <Link to="/forgot-password" className="text-accent-soft underline">
            Forgot your password?
          </Link>
        </p>

        <p className="text-sm text-line mt-6">
          New here?{' '}
          <Link to="/register" className="text-accent-soft underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}