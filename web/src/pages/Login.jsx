import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, ShieldCheck, AlertCircle, Server, Check } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore.js';
import { api, getApiBase, setApiBase } from '../api/client.js';

export function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverUrl, setServerUrl] = useState(getApiBase());
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [savedUrlSuccess, setSavedUrlSuccess] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { username, password });
      if (res.success) {
        setAuth(res.user, res.token);
        navigate('/');
      }
    } catch (err) {
      const msg = err.message || 'Login failed. Please check credentials.';
      setError(msg);
      if (msg.includes('fetch') || msg.includes('Network') || msg.includes('Failed')) {
        setShowServerConfig(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveServerUrl = (e) => {
    e.preventDefault();
    setApiBase(serverUrl);
    setSavedUrlSuccess(true);
    setTimeout(() => setSavedUrlSuccess(false), 2000);
  };

  const setDemoCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FFF8EC]">
      {/* BRAND PANEL (Left side on desktop) */}
      <div className="md:w-1/2 bg-[#03353A] text-white p-8 md:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Background decorative spice warm accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D9580B]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#E8A317]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img src="./logo.jpeg" alt="Nagfani Foods" className="w-12 h-12 object-contain bg-white rounded-xl p-1 shadow-md" />
            <div>
              <h1 className="text-xl font-bold font-['Epilogue'] tracking-tight">Nagfani Foods</h1>
              <p className="text-xs text-[#E8A317] font-semibold tracking-wider uppercase">Authentic Taste of Mewar</p>
            </div>
          </div>

          <div className="mt-12 md:mt-20">
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-[#E8A317] text-xs font-semibold mb-4 border border-white/10">
              Enterprise Operations Suite
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-['Epilogue'] leading-tight">
              Food Manufacturing, Dispatch & Tally Synchronization
            </h2>
            <p className="mt-4 text-stone-300 text-sm md:text-base leading-relaxed max-w-lg">
              End-to-end ERP powering Papad, Khakhra, Namkeen and Spices production. Connects physical godown stock, daily routes and accounting vouchers.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-stone-400">
          <span>Udaipur, Rajasthan</span>
          <span>TallyPrime Integration 2.0</span>
        </div>
      </div>

      {/* LOGIN FORM (Right side) */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-[#EADBC8] shadow-sm">
          <div className="mb-6">
            <h3 className="text-2xl font-bold font-['Epilogue'] text-[#2B1B12]">Operator Sign In</h3>
            <p className="text-xs text-[#837561] mt-1">Access orders, stock levels, batch journals and dispatches</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#514534] mb-1.5 uppercase tracking-wider">
                Username or Mobile
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#837561] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or 9829012345"
                  className="w-full bg-[#FFF8EC]/40 border border-[#EADBC8] focus:border-[#D9580B] focus:bg-white rounded-xl pl-9 pr-3 py-2.5 text-sm text-[#2B1B12] outline-hidden transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#514534] mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#837561] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#FFF8EC]/40 border border-[#EADBC8] focus:border-[#D9580B] focus:bg-white rounded-xl pl-9 pr-3 py-2.5 text-sm text-[#2B1B12] outline-hidden transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#D9580B] hover:bg-[#b54504] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In to Station</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Role Switcher */}
          <div className="mt-8 pt-6 border-t border-[#EADBC8]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#837561] mb-2.5 text-center">
              Quick Role Test Credentials
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDemoCredentials('admin', 'admin123')}
                className="p-2 rounded-lg border border-[#EADBC8] bg-[#FFF8EC]/40 hover:bg-[#FFF1EB] text-left transition-colors"
              >
                <div className="font-semibold text-[#2B1B12]">Admin</div>
                <div className="text-[10px] text-[#837561]">admin / admin123</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('order', 'order123')}
                className="p-2 rounded-lg border border-[#EADBC8] bg-[#FFF8EC]/40 hover:bg-[#FFF1EB] text-left transition-colors"
              >
                <div className="font-semibold text-[#2B1B12]">Order Desk</div>
                <div className="text-[10px] text-[#837561]">order / order123</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('packing', 'pack123')}
                className="p-2 rounded-lg border border-[#EADBC8] bg-[#FFF8EC]/40 hover:bg-[#FFF1EB] text-left transition-colors"
              >
                <div className="font-semibold text-[#2B1B12]">Packing Lead</div>
                <div className="text-[10px] text-[#837561]">packing / pack123</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('delivery', 'delivery123')}
                className="p-2 rounded-lg border border-[#EADBC8] bg-[#FFF8EC]/40 hover:bg-[#FFF1EB] text-left transition-colors"
              >
                <div className="font-semibold text-[#2B1B12]">Delivery Driver</div>
                <div className="text-[10px] text-[#837561]">delivery / delivery123</div>
              </button>
            </div>
          </div>

          {/* Backend Connection / Tunnel Indicator */}
          <div className="mt-4 pt-3 border-t border-[#EADBC8]/60 text-center">
            {!showServerConfig ? (
              <button
                type="button"
                onClick={() => setShowServerConfig(true)}
                className="text-[11px] text-[#837561] hover:text-[#D9580B] inline-flex items-center gap-1.5 transition-colors"
              >
                <Server className="w-3 h-3 text-[#D9580B]" />
                <span>API Endpoint: <strong className="font-mono">{serverUrl || 'Current Host (Auto)'}</strong></span>
                <span className="text-[10px] underline ml-1">Change</span>
              </button>
            ) : (
              <form onSubmit={handleSaveServerUrl} className="mt-2 p-3 bg-[#FFF8EC] border border-[#EADBC8] rounded-xl text-left">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-[#2B1B12] flex items-center gap-1">
                    <Server className="w-3 h-3 text-[#D9580B]" /> Backend Tunnel / API URL
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowServerConfig(false)}
                    className="text-[10px] text-[#837561] hover:text-[#2B1B12]"
                  >
                    Close
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="url"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder="e.g. https://xxxx.trycloudflare.com"
                    className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-[#EADBC8] bg-white focus:outline-none focus:border-[#D9580B]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#D9580B] text-white text-xs font-semibold rounded-lg hover:bg-[#C04B06] flex items-center gap-1"
                  >
                    {savedUrlSuccess ? <Check className="w-3.5 h-3.5" /> : 'Save'}
                  </button>
                </div>
                <p className="text-[10px] text-[#837561] mt-1.5">
                  Pointing to local backend tunnel. Leave blank to use default origin.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
