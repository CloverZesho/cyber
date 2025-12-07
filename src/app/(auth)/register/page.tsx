'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, companyName }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Show success message - user needs admin approval
      if (data.requiresApproval) {
        setSuccess(data.message);
      } else {
        // First user (admin) - redirect to login
        router.push('/login');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">
            🔐 Cyber Wheelhouse
          </h1>
          <h2 className="mt-6 text-center text-xl font-semibold text-gray-700">
            Create your account
          </h2>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">Registration Successful!</h3>
            <p className="text-green-700 mb-4">{success}</p>
            <Link href="/login" className="text-primary-600 hover:text-primary-500 font-medium">
              Go to Login Page →
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="label">Full name</label>
                <input
                  id="name" name="name" type="text" required className="input"
                  placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="companyName" className="label">Company name</label>
                <input
                  id="companyName" name="companyName" type="text" required className="input"
                  placeholder="Your Company Ltd" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="email" className="label">Email address</label>
                <input
                  id="email" name="email" type="email" autoComplete="email" required className="input"
                  placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="label">Password</label>
                <input
                  id="password" name="password" type="password" required className="input"
                  placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="label">Confirm password</label>
                <input
                  id="confirmPassword" name="confirmPassword" type="password" required className="input"
                  placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Creating account...' : 'Create account'}
            </button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-primary-600 hover:text-primary-500 font-medium">
                Sign in here
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

