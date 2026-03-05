import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from './types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { email?: string; phone?: string; password: string }) => Promise<void>;
  register: (data: { email?: string; phone?: string; password: string; name: string; otp: string }) => Promise<void>;
  loginWithOtp: (otp: string) => Promise<void>;
  /** Use a pre-verified MSG91 access token directly (phone only — avoids double widget call) */
  loginWithMsg91Token: (token: string, name?: string, identifier?: string, password?: string) => Promise<void>;
  /** Register using server-side email OTP (nodemailer) */
  registerWithEmailOtp: (email: string, otp: string, name: string, password: string) => Promise<void>;
  /** Login using server-side email OTP (nodemailer) */
  loginWithEmailOtp: (email: string, otp: string) => Promise<void>;
  /** Register using server-side phone OTP */
  registerWithPhoneOtp: (phone: string, otp: string, name: string, password: string) => Promise<void>;
  /** Login using server-side phone OTP */
  loginWithPhoneOtp: (phone: string, otp: string) => Promise<void>;
  sendOtp: (credentials: { email?: string; phone?: string }) => Promise<void>;
  retryOtp: (channel?: '11' | '4' | '3' | '12') => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) setUser(await res.json());
    } catch (err) {
      console.error('Auth check failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { checkUser(); }, []);

  // ─── Password login ────────────────────────────────────────────────────────
  const login = async (credentials: { email?: string; phone?: string; password: string }) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
    setUser(await res.json());
  };

  // ─── Send OTP via MSG91 widget (email and phone both supported) ──────────
  const sendOtp = async (credentials: { email?: string; phone?: string }) => {
    if (!(window as any).sendOtp)
      throw new Error('OTP service not loaded. Please refresh the page.');

    const { email, phone } = credentials;
    if (!email && !phone) throw new Error('Email or phone is required');

    // For phone: strip non-digits (country code already included by caller)
    // For email: pass the address as-is — MSG91 detects @ and sends email OTP
    const identifier = phone ? phone.replace(/\D/g, '') : email!;

    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        window.removeEventListener('msg91-failure', onGlobalFailure);
        reject(new Error('OTP request timed out. Please complete the captcha and try again.'));
      }, 90000);

      // MSG91 sometimes fires the global failure callback instead of the per-call one
      const onGlobalFailure = (e: Event) => {
        clearTimeout(timer);
        window.removeEventListener('msg91-failure', onGlobalFailure);
        const detail = (e as CustomEvent).detail;
        reject(new Error(detail?.message || detail?.error || 'Failed to send OTP. Please try again.'));
      };
      window.addEventListener('msg91-failure', onGlobalFailure, { once: true });

      (window as any).sendOtp(
        identifier,
        () => {
          clearTimeout(timer);
          window.removeEventListener('msg91-failure', onGlobalFailure);
          resolve();
        },
        (err: any) => {
          clearTimeout(timer);
          window.removeEventListener('msg91-failure', onGlobalFailure);
          reject(new Error(err?.message || 'Failed to send OTP'));
        }
      );
    });
  };

  // ─── Low-level: verify OTP via MSG91 widget, return access token ──────────
  const verifyOtpWidget = (otp: string): Promise<string> =>
    new Promise((resolve, reject) => {
      if (!(window as any).verifyOtp) {
        reject(new Error('OTP service not loaded. Please refresh the page.'));
        return;
      }

      const timer = setTimeout(() => {
        window.removeEventListener('msg91-failure', onGlobalFailure);
        reject(new Error('Verification timed out. Please try again.'));
      }, 60000);

      const onGlobalFailure = (e: Event) => {
        clearTimeout(timer);
        window.removeEventListener('msg91-failure', onGlobalFailure);
        const detail = (e as CustomEvent).detail;
        reject(new Error(detail?.message || detail?.error || 'OTP verification failed. Please try again.'));
      };
      window.addEventListener('msg91-failure', onGlobalFailure, { once: true });

      (window as any).verifyOtp(
        otp,
        (data: any) => {
          clearTimeout(timer);
          window.removeEventListener('msg91-failure', onGlobalFailure);
          const token =
            typeof data === 'string'
              ? data
              : data?.message || data?.token || data?.data;
          if (!token) {
            console.error('[MSG91] No token in response:', data);
            reject(new Error('Verification succeeded but no access token was returned'));
          } else {
            resolve(token as string);
          }
        },
        (err: any) => {
          clearTimeout(timer);
          window.removeEventListener('msg91-failure', onGlobalFailure);
          reject(new Error(err?.message || 'Invalid OTP'));
        }
      );
    });

  // ─── Send MSG91 token to our backend ─────────────────────────────────────
  const verifyWithServer = async (
    token: string,
    name?: string,
    identifier?: string,
    password?: string,
  ): Promise<User> => {
    const res = await fetch('/api/verify-msg91-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, name, identifier, password }),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Verification failed');
    const data = await res.json();
    return data.user as User;
  };

  // ─── Login with OTP (MSG91 widget — phone only) ──────────────────────────
  const loginWithOtp = async (otp: string) => {
    const token = await verifyOtpWidget(otp);
    const loggedInUser = await verifyWithServer(token);
    setUser(loggedInUser);
  };

  // ─── Login/Register with a pre-verified MSG91 token (phone) ───────────────
  const loginWithMsg91Token = async (token: string, name?: string, identifier?: string, password?: string) => {
    const loggedInUser = await verifyWithServer(token, name, identifier, password);
    setUser(loggedInUser);
  };

  // ─── Register via server-side email OTP (nodemailer) ─────────────────────
  const registerWithEmailOtp = async (email: string, otp: string, name: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, name, password }),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Registration failed');
    setUser(await res.json());
  };

  // ─── Login via server-side email OTP (nodemailer) ────────────────────────
  const loginWithEmailOtp = async (email: string, otp: string) => {
    const res = await fetch('/api/auth/login-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
    setUser(await res.json());
  };

  // ─── Register via server-side phone OTP ──────────────────────────────────
  const registerWithPhoneOtp = async (phone: string, otp: string, name: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp, name, password }),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Registration failed');
    setUser(await res.json());
  };

  // ─── Login via server-side phone OTP ─────────────────────────────────────
  const loginWithPhoneOtp = async (phone: string, otp: string) => {
    const res = await fetch('/api/auth/login-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
    setUser(await res.json());
  };

  // ─── Register (falls back to widget call if no cached token) ─────────────
  const register = async (data: {
    email?: string;
    phone?: string;
    password: string;
    name: string;
    otp: string;
  }) => {
    const token = await verifyOtpWidget(data.otp);
    const newUser = await verifyWithServer(token, data.name);
    setUser(newUser);
  };

  // ─── Retry OTP (MSG91 widget — phone only) ────────────────────────────────
  const retryOtp = (channel?: '11' | '4' | '3' | '12') =>
    new Promise<void>((resolve, reject) => {
      if (!(window as any).retryOtp) {
        reject(new Error('OTP service not loaded'));
        return;
      }
      (window as any).retryOtp(
        channel ?? null,
        () => resolve(),
        (err: any) => reject(new Error(err?.message || 'Failed to resend OTP'))
      );
    });

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithOtp, loginWithMsg91Token, registerWithEmailOtp, loginWithEmailOtp, registerWithPhoneOtp, loginWithPhoneOtp, register, sendOtp, retryOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
