'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Eye, EyeOff, ExternalLink, Shield, ArrowLeft, Check } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    if (auth.isAuthenticated()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const validatePassword = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[!@#$%^&*]/.test(pwd)) strength++;
    return strength;
  };

  const handlePasswordChange = (pwd: string) => {
    setFormData({ ...formData, password: pwd });
    setPasswordStrength(validatePassword(pwd));
  };

  const getPasswordStrengthText = () => {
    const strength = passwordStrength;
    if (strength === 0) return 'Very weak';
    if (strength === 1) return 'Weak';
    if (strength === 2) return 'Fair';
    if (strength === 3) return 'Good';
    return 'Strong';
  };

  const getPasswordStrengthColor = () => {
    const strength = passwordStrength;
    if (strength === 0) return 'bg-destructive';
    if (strength === 1) return 'bg-warning';
    if (strength === 2) return 'bg-info';
    if (strength === 3) return 'bg-accent';
    return 'bg-success';
  };

  const handleSSOSignup = async () => {
    window.location.href = await auth.getSignupUrl();
  };

  const handleLocalSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { firstName, lastName, email, password, confirmPassword } = formData;

      if (!firstName || !lastName || !email || !password || !confirmPassword) {
        setError('Please fill in all fields.');
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }

      if (passwordStrength < 2) {
        setError('Password is too weak. Please use a stronger password.');
        setLoading(false);
        return;
      }

      // Call backend to register user (this would be implemented in real scenario)
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Registration failed.');
      }

      // For now, redirect to login with success message
      router.push('/login?signup=success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Branded background gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--primary) / 0.15), transparent),
            radial-gradient(ellipse 60% 40% at 80% 100%, hsl(var(--info) / 0.1), transparent)
          `,
        }}
        aria-hidden="true"
      />

      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='currentColor' stroke-width='0.5'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      <Card
        className="relative w-full max-w-md rounded-3xl shadow-large transition-all duration-300 hover:shadow-float"
        role="main"
        aria-label="Sign up form"
      >
        <CardHeader className="text-center pb-2">
          <div className="mb-4 flex justify-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-medium transition-all duration-300"
              aria-hidden="true"
            >
              <Package className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight gradient-text">Create Account</CardTitle>
          <CardDescription className="text-sm mt-2">
            Join OrionOps today
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleLocalSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                autoComplete="given-name"
                required
                aria-required="true"
                className="input-modern"
              />
              <Input
                label="Last Name"
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                autoComplete="family-name"
                required
                aria-required="true"
                className="input-modern"
              />
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              autoComplete="email"
              required
              aria-required="true"
              className="input-modern"
            />

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  autoComplete="new-password"
                  required
                  aria-required="true"
                  className="input-modern"
                />
                <button
                  type="button"
                  className="absolute right-4 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i < passwordStrength ? getPasswordStrengthColor() : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Strength: <span className="font-semibold text-foreground">{getPasswordStrengthText()}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="relative">
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                autoComplete="new-password"
                required
                aria-required="true"
                className="input-modern"
              />
              <button
                type="button"
                className="absolute right-4 top-8 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>

            {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
              <div className="flex items-center gap-2 text-xs text-success font-medium">
                <Check className="h-4 w-4" aria-hidden="true" />
                Passwords match
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive font-medium" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-11 font-semibold shadow-medium hover:shadow-large transition-all"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-medium">Or sign up with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 font-semibold transition-all hover:shadow-medium"
            onClick={handleSSOSignup}
            aria-label="Sign up with Keycloak"
          >
            <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
            Keycloak
          </Button>

          <div className="mt-6 pt-6 border-t border-border/50">
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-primary hover:text-primary/90 transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" aria-hidden="true" />
            <span>Your data is encrypted and secure</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
