import React, { useState, useEffect, useMemo } from 'react';
import { X, Mail, Lock, User as UserIcon, Loader2, ArrowRight, Phone, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../AuthContext';

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-orange-500' };
  if (score <= 3) return { score: 3, label: 'Good', color: 'bg-yellow-500' };
  if (score <= 4) return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
  return { score: 5, label: 'Excellent', color: 'bg-emerald-600' };
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [useOtpLogin, setUseOtpLogin] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedToken, setVerifiedToken] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);

  const { login, loginWithMsg91Token, sendOtp, retryOtp } = useAuth();
  const pwStrength = useMemo(() => getPasswordStrength(password), [password]);

  // Reset state and reinit MSG91 once when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsRegister(false);
      setUseOtpLogin(false);
      setEmail('');
      setPhone('');
      setPassword('');
      setName('');
      setOtp('');
      setOtpSent(false);
      setIsVerified(false);
      setVerifiedToken('');
      setError('');
      setSuccess('');
      setShowSuccessPage(false);
      if ((window as any).initSendOTP && (window as any).configuration) {
        (window as any).initSendOTP((window as any).configuration);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    const target = authMethod === 'email' ? email : phone;
    if (!target) { setError(`Please enter your ${authMethod} first`); return; }
    setError('');
    setOtpLoading(true);
    try {
      await sendOtp(authMethod === 'email' ? { email } : { phone: '91' + phone.replace(/\D/g, '') });
      setOtpSent(true);
      setSuccess(`Verification code sent to your ${authMethod}`);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRetryOtp = async () => {
    setError('');
    setResendLoading(true);
    try {
      await retryOtp();
      setSuccess('Verification code resent successfully');
      setIsVerified(false);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) { setError('Please enter a valid verification code'); return; }
    setError('');
    setVerifyLoading(true);
    try {
      if (!(window as any).verifyOtp) {
        setError('OTP service not loaded. Please refresh the page.');
        return;
      }
      const token = await new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Verification timed out. Please try again.')), 60000);
        (window as any).verifyOtp(
          otp,
          (data: any) => {
            clearTimeout(timer);
            const t = typeof data === 'string' ? data : (data?.message || data?.token || data?.data);
            if (!t) reject(new Error('No access token returned. Please retry.'));
            else resolve(t as string);
          },
          (err: any) => { clearTimeout(timer); reject(new Error(err?.message || 'Invalid OTP')); }
        );
      });
      setVerifiedToken(token);
      setIsVerified(true);
      setSuccess('OTP verified! Proceed to register.');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (isRegister) {
        if (!isVerified || !verifiedToken) { setError(`Please verify your ${authMethod} with OTP first`); setLoading(false); return; }
        if (!password) { setError('Password is required'); setLoading(false); return; }
        const identifier = authMethod === 'email' ? email : ('91' + phone.replace(/\D/g, ''));
        await loginWithMsg91Token(verifiedToken, name, identifier, password);
      } else if (useOtpLogin) {
        if (!isVerified || !verifiedToken) { setError('Please verify OTP first'); setLoading(false); return; }
        const identifier = authMethod === 'email' ? email : ('91' + phone.replace(/\D/g, ''));
        await loginWithMsg91Token(verifiedToken, undefined, identifier);
      } else {
        await login({
          email: authMethod === 'email' ? email : undefined,
          phone: authMethod === 'phone' ? ('91' + phone.replace(/\D/g, '')) : undefined,
          password,
        });
      }
      setShowSuccessPage(true);
      setTimeout(() => { onClose(); setShowSuccessPage(false); setOtpSent(false); setIsVerified(false); setVerifiedToken(''); setOtp(''); }, 3000);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-obsidian/90 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-charcoal rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-black/5 dark:border-white/10 animate-in zoom-in-95 duration-500">
        {showSuccessPage ? (
          <div className="p-12 text-center flex flex-col items-center justify-center min-h-[400px] animate-in fade-in zoom-in-95 duration-700">
            <div className="w-24 h-24 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-8 shadow-[0_20px_40px_rgba(16,185,129,0.3)] animate-bounce">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-4xl font-outfit font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
              {isRegister ? 'Account Created' : 'Welcome Back'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg italic mb-8">
              {isRegister ? 'Your agricultural journey begins now.' : 'Synchronizing your field data...'}
            </p>
            <div className="flex items-center gap-2 text-emerald-500 font-jakarta font-bold text-[10px] tracking-[0.3em] uppercase">
              <Loader2 size={14} className="animate-spin" /> Redirecting to Dashboard
            </div>
          </div>
        ) : (
          <div className="p-10">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-outfit font-bold text-gray-900 dark:text-white">
                {isRegister ? 'Create Account' : (useOtpLogin ? 'OTP Login' : 'Welcome Back')}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400">
                <X size={20} />
              </button>
            </div>

            {/* Auth Method Toggle */}
            <div className="flex bg-gray-100 dark:bg-black/40 p-1 rounded-2xl border border-black/5 dark:border-white/10 mb-8">
              <button
                onClick={() => { setAuthMethod('email'); setOtpSent(false); setIsVerified(false); setVerifiedToken(''); setOtp(''); setError(''); setSuccess(''); }}
                className={`flex-1 py-3 rounded-xl text-[10px] font-jakarta font-bold tracking-widest transition-all ${authMethod === 'email' ? 'bg-white dark:bg-charcoal text-gold shadow-lg' : 'text-gray-400'}`}
              >EMAIL</button>
              <button
                onClick={() => { setAuthMethod('phone'); setOtpSent(false); setIsVerified(false); setVerifiedToken(''); setOtp(''); setError(''); setSuccess(''); }}
                className={`flex-1 py-3 rounded-xl text-[10px] font-jakarta font-bold tracking-widest transition-all ${authMethod === 'phone' ? 'bg-white dark:bg-charcoal text-gold shadow-lg' : 'text-gray-400'}`}
              >PHONE</button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold animate-in slide-in-from-top-2">{error}</div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500 text-sm font-bold animate-in slide-in-from-top-2">{success}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {isRegister && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase ml-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name"
                      className="w-full h-14 pl-12 pr-6 rounded-2xl bg-gray-50 dark:bg-black/20 border border-black/5 dark:border-white/10 outline-none focus:ring-2 focus:ring-gold/30 text-base font-bold text-gray-900 dark:text-white" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase ml-1">
                  {authMethod === 'email' ? 'Email Address' : 'Phone Number'}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    {authMethod === 'email' ? (
                      <>
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="farmer@example.com"
                          className="w-full h-14 pl-12 pr-6 rounded-2xl bg-gray-50 dark:bg-black/20 border border-black/5 dark:border-white/10 outline-none focus:ring-2 focus:ring-gold/30 text-base font-bold text-gray-900 dark:text-white" />
                      </>
                    ) : (
                      <div className="flex h-14 rounded-2xl overflow-hidden border border-black/5 dark:border-white/10 focus-within:ring-2 focus-within:ring-gold/30">
                        <span className="flex items-center gap-1 px-4 bg-gray-100 dark:bg-white/10 text-sm font-bold text-gray-600 dark:text-gray-300 shrink-0 border-r border-black/5 dark:border-white/10">
                          🇮🇳 +91
                        </span>
                        <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="9876543210" maxLength={10}
                          className="flex-grow h-full px-4 bg-gray-50 dark:bg-black/20 outline-none text-base font-bold text-gray-900 dark:text-white" />
                      </div>
                    )}
                  </div>
                  {(isRegister || useOtpLogin) && (
                    <button type="button" onClick={handleSendOtp} disabled={otpLoading || otpSent}
                      className="px-4 rounded-2xl bg-gold/10 text-gold font-bold text-[10px] tracking-widest uppercase border border-gold/20 hover:bg-gold/20 transition-all disabled:opacity-50">
                      {otpLoading ? <Loader2 className="animate-spin" size={16} /> : (otpSent ? 'SENT' : 'SEND OTP')}
                    </button>
                  )}
                </div>
                {authMethod === 'email' && /^\d+$/.test(email) && (
                  <p className="text-[10px] text-red-400 ml-1 font-medium italic">* You entered a number. Please switch to "Phone" tab.</p>
                )}
              </div>

              {/* OTP + Verify */}
              {(isRegister || useOtpLogin) && otpSent && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Verification Code</label>
                      <button type="button" onClick={handleRetryOtp} disabled={resendLoading}
                        className="text-[10px] font-bold text-gold hover:text-gold-dim transition-colors disabled:opacity-50">
                        {resendLoading ? 'RESENDING...' : 'RESEND CODE'}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input required type="text" value={otp} onChange={(e) => { setOtp(e.target.value); setIsVerified(false); }}
                        placeholder="6-digit code" maxLength={6}
                        className="flex-grow h-14 px-6 rounded-2xl bg-gray-50 dark:bg-black/20 border border-black/5 dark:border-white/10 outline-none focus:ring-2 focus:ring-gold/30 text-base font-bold text-gray-900 dark:text-white tracking-[0.5em] text-center" />
                      {!isVerified ? (
                        <button type="button" onClick={handleVerifyOtp} disabled={verifyLoading || !otp}
                          className="px-6 rounded-2xl bg-emerald-500 text-white font-bold text-[10px] tracking-widest uppercase shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all disabled:opacity-50">
                          {verifyLoading ? <Loader2 className="animate-spin" size={16} /> : 'VERIFY'}
                        </button>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                          <CheckCircle2 size={24} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Password */}
              {!useOtpLogin && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase ml-1">
                    Password {isRegister && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                      className="w-full h-14 pl-12 pr-6 rounded-2xl bg-gray-50 dark:bg-black/20 border border-black/5 dark:border-white/10 outline-none focus:ring-2 focus:ring-gold/30 text-base font-bold text-gray-900 dark:text-white" />
                  </div>
                  {isRegister && password && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= pwStrength.score ? pwStrength.color : 'bg-gray-200 dark:bg-white/10'}`} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold tracking-wider ${pwStrength.score <= 1 ? 'text-red-500' : pwStrength.score <= 2 ? 'text-orange-500' : pwStrength.score <= 3 ? 'text-yellow-500' : 'text-emerald-500'}`}>
                          {pwStrength.label}
                        </span>
                        <span className="text-[9px] text-gray-400">Use uppercase, numbers & symbols</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button type="submit" disabled={loading || (isRegister && !password)}
                className="w-full py-5 rounded-2xl bg-charcoal dark:bg-gold text-white dark:text-black font-bold tracking-[0.2em] hover:scale-[1.02] transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100">
                {loading ? <Loader2 className="animate-spin" size={20} /> : (isRegister ? 'REGISTER' : 'LOGIN')}
                {!loading && <ArrowRight size={20} />}
              </button>
            </form>

            <div className="mt-8 flex flex-col gap-4 text-center">
              {!isRegister && (
                <button onClick={() => { setUseOtpLogin(!useOtpLogin); setOtpSent(false); setError(''); setSuccess(''); }}
                  className="text-sm font-bold text-gold hover:text-gold-dim transition-colors">
                  {useOtpLogin ? 'Login with Password instead' : 'Login with OTP instead'}
                </button>
              )}
              <button onClick={() => { setIsRegister(!isRegister); setUseOtpLogin(false); setError(''); setSuccess(''); setOtpSent(false); }}
                className="text-sm font-bold text-gray-500 hover:text-gold transition-colors">
                {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
