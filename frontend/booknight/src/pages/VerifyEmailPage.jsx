import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmailPage() {
  const { verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await verifyEmail(email.trim(), code.trim());
      navigate('/board');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setError('Enter your email first.');
      return;
    }
    setError('');
    setResendMessage('');
    setResending(true);
    try {
      const data = await resendVerification(email.trim());
      setResendMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-graphite px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-canvas mb-1">Booknight</h1>
        <p className="text-line mb-8 text-sm">
          Enter the 6-digit code we emailed you to finish creating your account.
        </p>

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
            <label htmlFor="code" className="block text-sm text-line mb-1">Verification code</label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-card bg-graphite-soft border border-line-dark px-3 py-2 text-canvas placeholder:text-line-dark focus-visible:border-accent tracking-[0.4em] text-lg text-center"
              placeholder="000000"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {resendMessage && <p className="text-sm text-accent-soft">{resendMessage}</p>}

          <button
            type="submit"
            disabled={submitting || code.length !== 6}
            className="w-full rounded-card bg-accent text-canvas py-2 font-medium disabled:opacity-60"
          >
            {submitting ? 'Verifying…' : 'Verify and sign in'}
          </button>
        </form>

        <div className="flex items-center justify-between mt-6 text-sm">
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-accent-soft underline disabled:opacity-60"
          >
            {resending ? 'Sending…' : 'Resend code'}
          </button>
          <Link to="/login" className="text-line hover:text-canvas">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}