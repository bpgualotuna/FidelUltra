import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Server,
  Zap,
} from 'lucide-react';
import type { AuthUserSession } from '../../entities/omnichannel/types';
import { API_BASE, loginToHub } from '../../shared/api/fidel-hub-client';

interface LoginViewProps {
  onLoginSuccess: (session: AuthUserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@fidel.ai');
  const [password, setPassword] = useState('FidelAdmin2026!');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const session = await loginToHub(email, password, remember);
      onLoginSuccess(session);
    } catch (err: any) {
      setError(
        err?.message ||
          'No fue posible iniciar sesión. Verifica que el backend FidelHub_Back esté corriendo en el puerto 3001.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (type: 'admin' | 'agent') => {
    if (type === 'admin') {
      setEmail('admin@fidel.ai');
      setPassword('FidelAdmin2026!');
    } else {
      setEmail('5491112345678@legacy.chatcontrol');
      setPassword('FidelAdmin2026!');
    }
    setError(null);
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden select-none">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4 ring-4 ring-slate-800/80">
            <span className="text-2xl font-black text-white tracking-tighter">F</span>
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            FidelUltra
          </h1>

          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Plataforma Omnicanal Multi-empresa con Orquestación Universal de MCPs
          </p>

          <div className="mt-3 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/70 border border-slate-700/60 text-[11px] text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Acceso Empresarial Multi-Tenant</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 leading-relaxed animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu.correo@empresa.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-400 cursor-pointer hover:text-slate-300 transition">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 text-indigo-500 focus:ring-0 focus:ring-offset-0"
              />
              Recordar en este equipo
            </label>
            <span className="text-[11px] text-slate-500">Sesión cifrada JWT</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Autenticando empresa...</span>
              </>
            ) : (
              <>
                <span>Ingresar a FidelUltra</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access Pills */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Acceso Rápido / Credenciales Sembradas:
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo('admin')}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition group cursor-pointer"
            >
              <div className="text-[11px] font-bold text-emerald-400 group-hover:text-emerald-300 flex items-center justify-between">
                <span>Org Admin</span>
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">admin@fidel.ai</div>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('agent')}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition group cursor-pointer"
            >
              <div className="text-[11px] font-bold text-indigo-400 group-hover:text-indigo-300 flex items-center justify-between">
                <span>Agente de Ventas</span>
                <Sparkles className="w-3 h-3 text-indigo-400" />
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">5491112345678@...</div>
            </button>
          </div>
        </div>

        {/* Backend Connectivity Status */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono text-[10px]">{API_BASE}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-medium">Supabase Conectado</span>
          </div>
        </div>
      </div>
    </div>
  );
};
