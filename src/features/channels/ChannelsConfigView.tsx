import React, { useState, useEffect } from 'react';
import {
  Globe,
  Copy,
  Check,
  Key,
  Save,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import type {
  ChannelAccountSummary,
} from '../../entities/omnichannel/types';
import { ChannelBadge, ChannelIcon, CHANNEL_META } from '../../shared/ui/channel-badge';
import {
  API_BASE,
  fetchIntegrationStatus,
  updateIntegrationCredentials,
} from '../../shared/api/fidel-hub-client';

interface ChannelsConfigViewProps {
  accounts: ChannelAccountSummary[];
  onUpdateAccounts: (next: ChannelAccountSummary[]) => void;
  onNotify: (msg: string) => void;
}

export function ChannelsConfigView({
  accounts,
  onUpdateAccounts,
  onNotify,
}: ChannelsConfigViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [externalId, setExternalId] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [accessToken, setAccessToken] = useState('');

  // Meta Cloud API Tenant Credentials State
  const [metaPhoneId, setMetaPhoneId] = useState('');
  const [metaWabaId, setMetaWabaId] = useState('');
  const [metaToken, setMetaToken] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaStatus, setMetaStatus] = useState<{
    hasWhatsappToken: boolean;
    hasGeminiKey: boolean;
    whatsappPhoneNumberId: string | null;
    hasWhatsappBusinessAccountId: boolean;
  }>({
    hasWhatsappToken: false,
    hasGeminiKey: false,
    whatsappPhoneNumberId: null,
    hasWhatsappBusinessAccountId: false,
  });

  useEffect(() => {
    fetchIntegrationStatus().then((st) => {
      setMetaStatus(st);
      if (st.whatsappPhoneNumberId) setMetaPhoneId(st.whatsappPhoneNumberId);
    });
  }, []);

  const handleSaveMetaCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMeta(true);
    try {
      await updateIntegrationCredentials({
        whatsappPhoneNumberId: metaPhoneId.trim() || undefined,
        whatsappBusinessAccountId: metaWabaId.trim() || undefined,
        whatsappAccessToken: metaToken.trim() || undefined,
      });
      const st = await fetchIntegrationStatus();
      setMetaStatus(st);
      setMetaToken('');
      onNotify('Credenciales oficiales de Meta Cloud API guardadas y cifradas en Supabase.');
    } catch (err: any) {
      onNotify(`Error: ${err?.message || 'No se pudieron guardar las credenciales'}`);
    } finally {
      setSavingMeta(false);
    }
  };

  const handleStartEdit = (acc: ChannelAccountSummary) => {
    setEditingId(acc.id);
    setDisplayName(acc.displayName);
    setExternalId(acc.externalAccountId || '');
    setVerifyToken(acc.webhookVerifyToken || '');
    setAccessToken('');
  };

  const handleSave = (accId: string) => {
    const next = accounts.map((a) => {
      if (a.id !== accId) return a;
      return {
        ...a,
        displayName: displayName.trim() || a.displayName,
        externalAccountId: externalId.trim() || a.externalAccountId,
        webhookVerifyToken: verifyToken.trim() || a.webhookVerifyToken,
        hasAccessToken: Boolean(accessToken.trim()) || a.hasAccessToken,
        updatedAt: new Date().toISOString(),
      };
    });
    onUpdateAccounts(next);
    setEditingId(null);
    onNotify('Credenciales y Webhook de canal actualizados en FidelHub_Back');
  };

  const handleToggleActive = (accId: string) => {
    const next = accounts.map((a) =>
      a.id === accId ? { ...a, isActive: !a.isActive } : a,
    );
    onUpdateAccounts(next);
    onNotify('Estado de canal omnicanal actualizado');
  };

  const copyWebhook = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Canales Omnicanal & Webhooks (`FidelHub_Back`)
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Administra la ingesta unificada de mensajes entrantes y salientes desde{' '}
            <span className="text-emerald-400 font-semibold">WhatsApp</span>,{' '}
            <span className="text-pink-400 font-semibold">Instagram Direct</span>,{' '}
            <span className="text-blue-400 font-semibold">Facebook Messenger</span> y{' '}
            <span className="text-cyan-300 font-semibold">TikTok Business DM</span>.
          </p>
        </div>
      </div>

      {/* Meta Cloud API Enterprise Credentials */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Credenciales de Meta Cloud API para tu Empresa
                </h2>
                {metaStatus.hasWhatsappToken ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Token Cifrado en Supabase
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Requiere Token Meta
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Configura el número y token de Meta for Developers para recibir y responder mensajes reales de WhatsApp e Instagram Direct desde esta ventana.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveMetaCredentials} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              WhatsApp Phone Number ID
            </label>
            <input
              type="text"
              placeholder="Ej: 104829384918234"
              value={metaPhoneId}
              onChange={(e) => setMetaPhoneId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              WhatsApp Business Account ID (WABA)
            </label>
            <input
              type="text"
              placeholder="Ej: 293849201928374"
              value={metaWabaId}
              onChange={(e) => setMetaWabaId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Access Token (System User Permanent)
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder={metaStatus.hasWhatsappToken ? '••••••••••••••••••••••••' : 'EAAG...'}
                value={metaToken}
                onChange={(e) => setMetaToken(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={savingMeta}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white text-xs font-bold shrink-0 flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                {savingMeta ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Guardar</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {accounts.map((acc) => {
          const meta = CHANNEL_META[acc.channel];
          const fullWebhookUrl = `${API_BASE}${acc.webhookEndpoint}`;
          const isEditing = editingId === acc.id;

          return (
            <div
              key={acc.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                  >
                    <ChannelIcon channel={acc.channel} className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-white">{acc.displayName}</h3>
                      <ChannelBadge channel={acc.channel} compact />
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      Account ID: {acc.externalAccountId || 'No configurado'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleActive(acc.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                    acc.isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {acc.isActive ? 'Conectado' : 'Inactivo'}
                </button>
              </div>

              {/* Webhook Box */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Webhook Endpoint ({acc.channel})
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Token: {acc.webhookVerifyToken}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 font-mono text-[11px] text-indigo-300">
                  <span className="truncate">{fullWebhookUrl}</span>
                  <button
                    type="button"
                    onClick={() => copyWebhook(acc.id, fullWebhookUrl)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-300 shrink-0"
                  >
                    {copiedId === acc.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Nombre Visible del Canal</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-400 mb-1">
                        ID Externo (Page ID / IGSID / OpenID)
                      </label>
                      <input
                        type="text"
                        value={externalId}
                        onChange={(e) => setExternalId(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Verify Token</label>
                      <input
                        type="text"
                        value={verifyToken}
                        onChange={(e) => setVerifyToken(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Access Token (Cifrado AES-256-GCM en Backend)
                    </label>
                    <input
                      type="password"
                      placeholder="Pegar nuevo Access Token de Meta Graph o TikTok Business..."
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSave(acc.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1"
                    >
                      <Save className="w-3.5 h-3.5" /> Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-emerald-400" />
                    {acc.hasAccessToken
                      ? 'Credenciales cifradas configuradas'
                      : 'Modo Sandbox Local Activo'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(acc)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
                  >
                    Configurar Credenciales
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
