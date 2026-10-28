import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Cpu,
  Search,
  User,
  UserCheck,
  MessageSquare,
  Globe,
  Users,
  Sliders,
  Plus,
  Trash2,
  CheckCheck,
  Reply,
  X,
  PanelRightOpen,
  PanelRightClose,
  Volume2,
  FlaskConical,
  ShieldCheck,
  Tag as TagIcon,
  Mail,
  Zap,
  Building2,
  LogOut,
} from 'lucide-react';
import type {
  SupportedChannel,
  OmniConversation,
  OmniMessage,
  McpServerSummary,
  ChannelAccountSummary,
  FidelTrainingRule,
  AuthUserSession,
} from './entities/omnichannel/types';
import {
  ChannelBadge,
  ChannelIcon,
  CHANNEL_META,
  AudioPlayer,
  McpTraceCard,
} from './shared/ui/channel-badge';
import {
  getStoredConversations,
  saveStoredConversations,
  getStoredMessagesMap,
  saveStoredMessagesMap,
  getStoredMcpServers,
  saveStoredMcpServers,
  getStoredChannelAccounts,
  saveStoredChannelAccounts,
  getStoredRules,
  saveStoredRules,
  orchestrateFidelMcpReply,
  ORG_AGENTS,
  getStoredAuthSession,
  clearAuthSession,
} from './shared/api/fidel-hub-client';
import { McpHubView } from './features/mcp-hub/McpHubView';
import { ChannelsConfigView } from './features/channels/ChannelsConfigView';
import { LoginView } from './features/auth/LoginView';
import FidelLabOriginal from './legacy-lab/FidelLabOriginal';

type MainNavTab = 'inbox' | 'mcp_hub' | 'channels' | 'contacts' | 'legacy_lab';

const OMNICHANNEL_SIMULATOR_PRESETS: Array<{
  label: string;
  channel: SupportedChannel;
  contactName: string;
  handle: string;
  text: string;
}> = [
  {
    label: '💰 Consultar Precio & Beca (WhatsApp)',
    channel: 'WHATSAPP',
    contactName: 'Dra. Elena Rivadeneira',
    handle: '+593 99 842 1102',
    text: 'Hola! ¿Qué precio tiene la Certificación de IA para Docentes y tienen beca vigente?',
  },
  {
    label: '📸 Consultar Cuotas Bootcamp (Instagram DM)',
    channel: 'INSTAGRAM',
    contactName: 'Camila Paredes',
    handle: '@camila.edtech',
    text: 'Hola! Vi su historia del Bootcamp FullStack, ¿me envían una cotización en 3 cuotas?',
  },
  {
    label: '🎵 Agendar Cita Mañana (TikTok DM)',
    channel: 'TIKTOK',
    contactName: 'Andrés Villacreses',
    handle: '@andres.code99',
    text: 'Vengo del TikTok Live, quiero agendar una cita para mañana a las 18:00 por favor.',
  },
  {
    label: '💬 Consultar Horarios Disponibles (Messenger)',
    channel: 'FACEBOOK',
    contactName: 'Ing. Roberto Salazar',
    handle: 'fb.com/roberto.salazar.ec',
    text: 'Buenas tardes, ¿qué horarios tienen disponibles para una reunión informativa?',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<MainNavTab>('inbox');
  const [conversations, setConversations] = useState<OmniConversation[]>(() =>
    getStoredConversations(),
  );
  const [messagesMap, setMessagesMap] = useState<Record<string, OmniMessage[]>>(() =>
    getStoredMessagesMap(),
  );
  const [mcpServers, setMcpServers] = useState<McpServerSummary[]>(() =>
    getStoredMcpServers(),
  );
  const [channelAccounts, setChannelAccounts] = useState<ChannelAccountSummary[]>(() =>
    getStoredChannelAccounts(),
  );
  const [fidelRules, setFidelRules] = useState<FidelTrainingRule[]>(() =>
    getStoredRules(),
  );

  // Multi-tenant Authentication Session
  const [session, setSession] = useState<AuthUserSession | null>(() =>
    getStoredAuthSession(),
  );

  // Filters & Selection
  const [channelFilter, setChannelFilter] = useState<'ALL' | SupportedChannel>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConvId, setSelectedConvId] = useState<string>('conv_wa_1');

  // Chat composer & panels
  const [replyInput, setReplyInput] = useState('');
  const [replyTarget, setReplyTarget] = useState<OmniMessage | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState<'none' | 'simulator' | 'details'>('simulator');
  const [simulatorSubTab, setSimulatorSubTab] = useState<'simulador' | 'reglas'>('simulador');

  // Simulator inputs
  const [simChannel, setSimChannel] = useState<SupportedChannel>('INSTAGRAM');
  const [simName, setSimName] = useState('Valeria Mendoza');
  const [simHandle, setSimHandle] = useState('@valeria.ai');
  const [simText, setSimText] = useState(
    'Hola! Vi su publicación en Instagram, ¿qué costo tiene el programa de IA y qué horarios hay disponibles?',
  );

  // New Rule inputs
  const [newRuleText, setNewRuleText] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState('ESTILO');

  // Toast notification
  const [toast, setToast] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Persist changes
  useEffect(() => {
    saveStoredConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    saveStoredMessagesMap(messagesMap);
  }, [messagesMap]);

  useEffect(() => {
    saveStoredMcpServers(mcpServers);
  }, [mcpServers]);

  useEffect(() => {
    saveStoredChannelAccounts(channelAccounts);
  }, [channelAccounts]);

  useEffect(() => {
    saveStoredRules(fidelRules);
  }, [fidelRules]);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConvId) || conversations[0] || null,
    [conversations, selectedConvId],
  );

  const currentMessages = useMemo(
    () => (selectedConversation ? messagesMap[selectedConversation.id] || [] : []),
    [messagesMap, selectedConversation],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length, selectedConversation?.id]);

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    return conversations
      .filter((c) => {
        if (channelFilter !== 'ALL' && c.channel !== channelFilter) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const inHeader =
          (c.name || '').toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          (c.externalHandle || '').toLowerCase().includes(q) ||
          (c.tag || '').toLowerCase().includes(q) ||
          c.lastMessagePreview.toLowerCase().includes(q);
        if (inHeader) return true;
        const convMsgs = messagesMap[c.id] || [];
        return convMsgs.some((m) => m.text.toLowerCase().includes(q));
      })
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  }, [conversations, channelFilter, searchQuery, messagesMap]);

  const handleSelectConversation = (conv: OmniConversation) => {
    setSelectedConvId(conv.id);
    setReplyTarget(null);
    if (conv.unreadCount > 0) {
      setConversations((prev) =>
        prev.map((item) => (item.id === conv.id ? { ...item, unreadCount: 0 } : item)),
      );
    }
  };

  // Send message as human agent
  const handleSendAgentMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedConversation || !replyInput.trim()) return;

    const text = replyInput.trim();
    const newMsg: OmniMessage = {
      id: `msg_agent_${Date.now()}`,
      conversationId: selectedConversation.id,
      channel: selectedConversation.channel,
      fromUser: false,
      fromAi: false,
      text,
      timestamp: Date.now(),
      type: 'TEXT',
      status: 'SENT',
      replyTo: replyTarget
        ? {
            id: replyTarget.id,
            text: replyTarget.text,
            fromUser: replyTarget.fromUser,
            type: replyTarget.type,
          }
        : null,
      isReply: Boolean(replyTarget),
    };

    setMessagesMap((prev) => ({
      ...prev,
      [selectedConversation.id]: [...(prev[selectedConversation.id] || []), newMsg],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation.id
          ? {
              ...c,
              lastMessagePreview: text,
              lastMessageAt: newMsg.timestamp,
              unreadCount: 0,
            }
          : c,
      ),
    );

    setReplyInput('');
    setReplyTarget(null);
  };

  // Generate Co-pilot suggestion or automatic AI reply with active MCP server
  const handleSuggestWithMcp = async () => {
    if (!selectedConversation || aiGenerating) return;
    setAiGenerating(true);
    try {
      const convMsgs = messagesMap[selectedConversation.id] || [];
      const lastUserMsg =
        [...convMsgs].reverse().find((m) => m.fromUser)?.text ||
        selectedConversation.lastMessagePreview;
      const { replyText, traces } = await orchestrateFidelMcpReply(
        selectedConversation,
        lastUserMsg,
      );
      setReplyInput(replyText);
      if (traces.length > 0) {
        notify(
          `MCP ejecutado (${traces.map((t) => t.toolName).join(', ')}) — Respuesta lista en caja de texto`,
        );
      } else {
        notify('Sugerencia generada por Fidel IA');
      }
    } finally {
      setAiGenerating(false);
    }
  };

  // Send direct Fidel AI + MCP message into conversation
  const handleSendFidelAutoReply = async (
    targetConv: OmniConversation,
    incomingUserText: string,
  ) => {
    setAiGenerating(true);
    try {
      await new Promise((r) => setTimeout(r, 650));
      const { replyText, traces } = await orchestrateFidelMcpReply(
        targetConv,
        incomingUserText,
      );
      const aiMsg: OmniMessage = {
        id: `msg_fidel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        conversationId: targetConv.id,
        channel: targetConv.channel,
        fromUser: false,
        fromAi: true,
        text: replyText,
        timestamp: Date.now(),
        type: 'TEXT',
        status: 'DELIVERED',
        mcpToolTraces: traces.length > 0 ? traces : undefined,
      };

      setMessagesMap((prev) => ({
        ...prev,
        [targetConv.id]: [...(prev[targetConv.id] || []), aiMsg],
      }));

      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConv.id
            ? {
                ...c,
                lastMessagePreview: replyText,
                lastMessageAt: aiMsg.timestamp,
              }
            : c,
        ),
      );
    } finally {
      setAiGenerating(false);
    }
  };

  // Simulate incoming omnichannel message (WhatsApp, Instagram, Facebook, TikTok)
  const handleSimulateIncoming = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!simText.trim()) return;

    const text = simText.trim();
    const nowTs = Date.now();

    let targetConv = conversations.find(
      (c) =>
        c.channel === simChannel &&
        ((c.externalHandle &&
          c.externalHandle.toLowerCase() === simHandle.trim().toLowerCase()) ||
          (c.name && c.name.toLowerCase() === simName.trim().toLowerCase())),
    );

    if (!targetConv) {
      const defaultMcp =
        mcpServers.find((s) => s.isActive && s.isDefault) || mcpServers[0];
      targetConv = {
        id: `conv_${simChannel.toLowerCase()}_${nowTs}`,
        phone:
          simChannel === 'WHATSAPP'
            ? simHandle.trim() || '+593 99 000 1111'
            : `${simChannel.toLowerCase()}:${simHandle.trim() || 'user'}`,
        name: simName.trim() || `Lead ${simChannel}`,
        email: null,
        tag: `Lead ${CHANNEL_META[simChannel].shortLabel}`,
        channel: simChannel,
        externalHandle: simHandle.trim() || CHANNEL_META[simChannel].placeholderHandle,
        activeMcpServerId: defaultMcp?.id || 'mcp_fidel_official',
        interestStatus: 'INTERESTED',
        lastUserMessageAt: nowTs,
        lastMessagePreview: text,
        lastMessageAt: nowTs,
        unreadCount: 0,
        assignedToUserId: ORG_AGENTS[0].id,
        assignedAgentName: ORG_AGENTS[0].displayName,
        isNewLead: true,
        isAiActive: true,
        extractedData: {
          Canal: CHANNEL_META[simChannel].label,
          Handle: simHandle.trim(),
          Estado: 'Cualificando con MCP',
        },
      };
      setConversations((prev) => [targetConv!, ...prev]);
    } else {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConv!.id
            ? {
                ...c,
                lastUserMessageAt: nowTs,
                lastMessagePreview: text,
                lastMessageAt: nowTs,
              }
            : c,
        ),
      );
    }

    const incomingMsg: OmniMessage = {
      id: `msg_in_${nowTs}`,
      conversationId: targetConv.id,
      channel: simChannel,
      fromUser: true,
      text,
      timestamp: nowTs,
      type: 'TEXT',
      status: 'RECEIVED',
      metadata: {
        platform: simChannel,
      },
    };

    setMessagesMap((prev) => ({
      ...prev,
      [targetConv!.id]: [...(prev[targetConv!.id] || []), incomingMsg],
    }));

    setSelectedConvId(targetConv.id);
    notify(`Mensaje entrante recibido por ${CHANNEL_META[simChannel].label}`);

    if (targetConv.isAiActive) {
      await handleSendFidelAutoReply(targetConv, text);
    }
  };

  // Send simulated voice note
  const handleSendVoiceNoteDemo = () => {
    if (!selectedConversation) return;
    const nowTs = Date.now();
    const audioMsg: OmniMessage = {
      id: `msg_audio_${nowTs}`,
      conversationId: selectedConversation.id,
      channel: selectedConversation.channel,
      fromUser: false,
      fromAi: false,
      text: 'Nota de voz comercial (0:12)',
      timestamp: nowTs,
      type: 'AUDIO',
      mediaUrl: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
      mimeType: 'audio/ogg',
      status: 'SENT',
    };
    setMessagesMap((prev) => ({
      ...prev,
      [selectedConversation.id]: [...(prev[selectedConversation.id] || []), audioMsg],
    }));
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation.id
          ? { ...c, lastMessagePreview: '🎵 Nota de voz (0:12)', lastMessageAt: nowTs }
          : c,
      ),
    );
  };

  const handleToggleConvAi = (convId: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const nextAi = !c.isAiActive;
        notify(
          nextAi
            ? 'Fidel IA activado en esta conversación (conectado al MCP)'
            : 'Modo Humano activo (Fidel IA en pausa)',
        );
        return { ...c, isAiActive: nextAi };
      }),
    );
  };

  const handleChangeConvMcp = (convId: string, mcpServerId: string) => {
    const srv = mcpServers.find((s) => s.id === mcpServerId);
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, activeMcpServerId: mcpServerId } : c)),
    );
    notify(`Servidor MCP "${srv?.name || mcpServerId}" asignado a esta conversación`);
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleText.trim()) return;
    const rule: FidelTrainingRule = {
      id: `rule_${Date.now()}`,
      instruction: newRuleText.trim(),
      category: newRuleCategory,
      createdByName: 'Brayan Gualotuña',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setFidelRules((prev) => [rule, ...prev]);
    setNewRuleText('');
    notify('Nueva regla agregada a la memoria de Fidel');
  };

  const channelCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: conversations.length,
      WHATSAPP: 0,
      INSTAGRAM: 0,
      FACEBOOK: 0,
      TIKTOK: 0,
    };
    conversations.forEach((c) => {
      counts[c.channel] = (counts[c.channel] || 0) + 1;
    });
    return counts;
  }, [conversations]);

  if (!session) {
    return (
      <LoginView
        onLoginSuccess={(sess) => {
          setSession(sess);
          notify(`¡Bienvenido ${sess.displayName || ''}! Sesión iniciada.`);
        }}
      />
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col select-none">
      {/* Top Global Status Bar */}
      <header className="h-13 shrink-0 bg-slate-900/95 border-b border-slate-800 px-4 flex items-center justify-between gap-4 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-md">
            F
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                FidelUltra
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Pills */}
        <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('inbox')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'inbox'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Bandeja Omnicanal
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mcp_hub')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'mcp_hub'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            MCP Hub ({mcpServers.filter((s) => s.isActive).length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('channels')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'channels'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Canales & Webhooks
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contacts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'contacts'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Contactos CRM
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('legacy_lab')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'legacy_lab'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Lab Clásico
          </button>
        </nav>

        {/* Multi-Tenant Organization & User Profile */}
        <div className="flex items-center gap-3 text-xs">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-white truncate max-w-[140px]">
              {session.organizationName || 'Empresa'}
            </span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {session.role}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div
              title={session.email}
              className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 border border-indigo-400/40 flex items-center justify-center text-[11px] font-black text-white shadow-sm"
            >
              {session.displayName
                ? session.displayName.substring(0, 2).toUpperCase()
                : 'AD'}
            </div>

            <button
              type="button"
              onClick={() => {
                clearAuthSession();
                setSession(null);
                notify('Sesión cerrada correctamente.');
              }}
              title="Cerrar Sesión Empresarial"
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Toast Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 border border-indigo-400/40">
          <Sparkles className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'mcp_hub' && (
        <McpHubView
          servers={mcpServers}
          onUpdateServers={setMcpServers}
          onNotify={notify}
        />
      )}

      {activeTab === 'channels' && (
        <ChannelsConfigView
          accounts={channelAccounts}
          onUpdateAccounts={setChannelAccounts}
          onNotify={notify}
        />
      )}

      {activeTab === 'legacy_lab' && (
        <div className="flex-1 overflow-auto">
          <FidelLabOriginal />
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-lg font-bold text-white">
                Directorio Omnicanal de Contactos & Leads
              </h1>
              <p className="text-xs text-slate-400">
                Contactos unificados provenientes de WhatsApp, Instagram Direct, Facebook Messenger y TikTok.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Contacto</th>
                  <th className="py-3 px-4">Canal</th>
                  <th className="py-3 px-4">Identificador / Handle</th>
                  <th className="py-3 px-4">Etiqueta</th>
                  <th className="py-3 px-4">MCP Asignado</th>
                  <th className="py-3 px-4">Estado IA</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {conversations.map((c) => {
                  const srv = mcpServers.find((s) => s.id === c.activeMcpServerId);
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-white">
                        {c.name || 'Sin nombre'}
                        {c.email && (
                          <div className="text-[11px] text-slate-400 font-normal">{c.email}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <ChannelBadge channel={c.channel} />
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {c.externalHandle || c.phone}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {c.tag || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-indigo-300 font-medium">
                        {srv?.name || 'FidelMCP'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.isAiActive
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {c.isAiActive ? 'Fidel IA Activo' : 'Agente Humano'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedConvId(c.id);
                            setActiveTab('inbox');
                          }}
                          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                        >
                          Abrir Chat
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INBOX VIEW (Nextline-style Omnichannel Chat + MCP Orchestration) */}
      {activeTab === 'inbox' && (
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Column: Conversation List */}
          <aside className="w-88 shrink-0 border-r border-slate-800 bg-slate-900/60 flex flex-col min-h-0">
            {/* Search & Channel Filter Bar */}
            <div className="p-3 space-y-2.5 border-b border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, @handle o mensaje..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Channel Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                {(
                  [
                    { id: 'ALL', label: 'Todos' },
                    { id: 'WHATSAPP', label: 'WA' },
                    { id: 'INSTAGRAM', label: 'IG' },
                    { id: 'FACEBOOK', label: 'FB' },
                    { id: 'TIKTOK', label: 'TK' },
                  ] as const
                ).map((tab) => {
                  const active = channelFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setChannelFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 shrink-0 border transition ${
                        active
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {tab.id !== 'ALL' && (
                        <ChannelIcon channel={tab.id} className="w-3 h-3" />
                      )}
                      <span>{tab.label}</span>
                      <span className="opacity-70 text-[10px]">
                        ({channelCounts[tab.id] || 0})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conversation Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              {filteredConversations.map((conv) => {
                const isSelected = selectedConversation?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-3.5 cursor-pointer transition hover:bg-slate-800/50 ${
                      isSelected ? 'bg-indigo-950/35 border-l-4 border-l-indigo-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <ChannelBadge channel={conv.channel} compact />
                        <span className="font-bold text-xs text-white truncate">
                          {conv.name || conv.externalHandle || conv.phone}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(conv.lastMessageAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                      {conv.externalHandle || conv.phone}
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-1 mt-1.5">
                      {conv.lastMessagePreview}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            conv.isAiActive
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-amber-500/15 text-amber-300'
                          }`}
                        >
                          {conv.isAiActive ? (
                            <>
                              <Bot className="w-3 h-3" /> Fidel IA
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3" /> Humano
                            </>
                          )}
                        </span>
                        {conv.tag && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                            {conv.tag}
                          </span>
                        )}
                      </div>

                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Center Column: Active Conversation Chat */}
          {selectedConversation ? (
            <main className="flex-1 flex flex-col min-w-0 bg-slate-950">
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/70 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-white shrink-0">
                    {(selectedConversation.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-sm text-white truncate">
                        {selectedConversation.name || selectedConversation.phone}
                      </h2>
                      <ChannelBadge channel={selectedConversation.channel} />
                    </div>
                    <div className="text-xs text-slate-400 font-mono truncate">
                      {selectedConversation.externalHandle || selectedConversation.phone}
                      {selectedConversation.assignedAgentName && (
                        <span className="ml-2 text-slate-500">
                          · Asignado a {selectedConversation.assignedAgentName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Header Controls: Active MCP Selector + AI Toggle + Side Panel Toggles */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Selector de MCP para esta conversación */}
                  <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-indigo-500/30">
                    <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[11px] text-slate-400">MCP:</span>
                    <select
                      value={selectedConversation.activeMcpServerId || 'mcp_fidel_official'}
                      onChange={(e) =>
                        handleChangeConvMcp(selectedConversation.id, e.target.value)
                      }
                      className="bg-transparent text-xs font-semibold text-indigo-300 focus:outline-none cursor-pointer"
                    >
                      {mcpServers
                        .filter((s) => s.isActive)
                        .map((s) => (
                          <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                            {s.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Toggle Fidel IA */}
                  <button
                    type="button"
                    onClick={() => handleToggleConvAi(selectedConversation.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
                      selectedConversation.isAiActive
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {selectedConversation.isAiActive ? (
                      <>
                        <Bot className="w-3.5 h-3.5" /> Fidel IA Activo
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" /> Control Humano
                      </>
                    )}
                  </button>

                  {/* Toggle Simulador Omnicanal */}
                  <button
                    type="button"
                    onClick={() =>
                      setRightPanelMode(rightPanelMode === 'simulator' ? 'none' : 'simulator')
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
                      rightPanelMode === 'simulator'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Simulador & Entrenamiento
                  </button>

                  {/* Toggle Detalles CRM */}
                  <button
                    type="button"
                    onClick={() =>
                      setRightPanelMode(rightPanelMode === 'details' ? 'none' : 'details')
                    }
                    className={`p-2 rounded-xl border transition ${
                      rightPanelMode === 'details'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                    title="Detalles del Contacto & Extracción"
                  >
                    {rightPanelMode === 'details' ? (
                      <PanelRightClose className="w-4 h-4" />
                    ) : (
                      <PanelRightOpen className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Message History Stream */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950 to-slate-950">
                {currentMessages.map((msg) => {
                  const isUser = msg.fromUser;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`group relative max-w-xl rounded-2xl px-4 py-3 shadow-md ${
                          isUser
                            ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-sm'
                            : msg.fromAi
                              ? 'bg-gradient-to-br from-indigo-950/90 to-slate-900 border border-indigo-500/40 text-slate-100 rounded-tr-sm'
                              : 'bg-emerald-700 text-white rounded-tr-sm'
                        }`}
                      >
                        {/* Sender header */}
                        <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-80">
                          <span className="font-bold flex items-center gap-1">
                            {isUser ? (
                              <>
                                <ChannelIcon channel={msg.channel} className="w-3 h-3" />
                                {selectedConversation.name || 'Cliente'}
                              </>
                            ) : msg.fromAi ? (
                              <>
                                <Bot className="w-3 h-3 text-indigo-400" />
                                <span className="text-indigo-300">Fidel IA (Agente MCP)</span>
                              </>
                            ) : (
                              <>
                                <User className="w-3 h-3" />
                                Agente Humano
                              </>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => setReplyTarget(msg)}
                            className="opacity-0 group-hover:opacity-100 transition hover:text-indigo-300 flex items-center gap-0.5"
                            title="Responder a este mensaje"
                          >
                            <Reply className="w-3 h-3" /> Citar
                          </button>
                        </div>

                        {/* Metadata de Historia / Reel / Live */}
                        {msg.metadata?.isStoryReply && (
                          <div className="mb-2 px-2.5 py-1 rounded bg-pink-500/15 border border-pink-500/30 text-pink-300 text-[11px]">
                            📸 Respondió a tu Historia / Reel de Instagram
                          </div>
                        )}
                        {msg.metadata?.postLink && (
                          <div className="mb-2 px-2.5 py-1 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px]">
                            🎵 Origen: TikTok Live Stream
                          </div>
                        )}

                        {/* Quoted message */}
                        {msg.replyTo && (
                          <div className="mb-2 pl-2.5 py-1 border-l-2 border-indigo-400 bg-black/25 rounded text-xs opacity-85">
                            <div className="font-semibold text-[10px]">
                              {msg.replyTo.fromUser ? 'Cliente' : 'Fidel / Agente'}
                            </div>
                            <div className="truncate">{msg.replyTo.text}</div>
                          </div>
                        )}

                        {/* Message Body or Audio Player */}
                        {msg.type === 'AUDIO' && msg.mediaUrl ? (
                          <AudioPlayer src={msg.mediaUrl} isAgent={!isUser} />
                        ) : (
                          <p className="text-xs leading-relaxed whitespace-pre-wrap select-text">
                            {msg.text}
                          </p>
                        )}

                        {/* Live MCP Tool Execution Traces */}
                        {msg.mcpToolTraces && msg.mcpToolTraces.length > 0 && (
                          <div className="mt-2.5 space-y-1.5">
                            {msg.mcpToolTraces.map((tr) => (
                              <McpTraceCard key={tr.id} trace={tr} />
                            ))}
                          </div>
                        )}

                        {/* Timestamp & Delivery Status */}
                        <div className="mt-1.5 flex items-center justify-end gap-1 text-[10px] opacity-65">
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {!isUser && <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {aiGenerating && (
                  <div className="flex items-center gap-2 text-xs text-indigo-300 animate-pulse">
                    <Cpu className="w-4 h-4 animate-spin" />
                    <span>Fidel está consultando el servidor MCP y redactando respuesta...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Target Banner */}
              {replyTarget && (
                <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="truncate">
                    <span className="text-indigo-400 font-semibold mr-2">
                      Respondiendo a:
                    </span>
                    <span className="text-slate-300">{replyTarget.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyTarget(null)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Bottom Chat Composer */}
              <form
                onSubmit={handleSendAgentMessage}
                className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={handleSuggestWithMcp}
                  disabled={aiGenerating}
                  title="Generar respuesta consultando el MCP activo"
                  className="px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Co-piloto MCP</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendVoiceNoteDemo}
                  title="Enviar nota de voz"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  placeholder={`Escribir mensaje por ${CHANNEL_META[selectedConversation.channel].label}...`}
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />

                <button
                  type="submit"
                  disabled={!replyInput.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 transition shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar</span>
                </button>
              </form>
            </main>
          ) : null}

          {/* Right Column Drawer: Omnichannel Simulator / Training Rules OR CRM Contact Details */}
          {rightPanelMode === 'simulator' && (
            <aside className="w-96 shrink-0 border-l border-slate-800 bg-slate-900/80 flex flex-col min-h-0">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full">
                  <button
                    type="button"
                    onClick={() => setSimulatorSubTab('simulador')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                      simulatorSubTab === 'simulador'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Simulador Omnicanal
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulatorSubTab('reglas')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                      simulatorSubTab === 'reglas'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Reglas Fidel ({fidelRules.length})
                  </button>
                </div>
              </div>

              {simulatorSubTab === 'simulador' ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                  <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-200 leading-relaxed">
                    Dispara un mensaje entrante desde <strong>WhatsApp</strong>,{' '}
                    <strong>Instagram</strong>, <strong>Facebook</strong> o <strong>TikTok</strong>.
                    Si Fidel IA está activo, ejecutará automáticamente las herramientas del MCP asignado.
                  </div>

                  {/* Presets de 1 clic */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Escenarios Rápidos (1 Clic)
                    </div>
                    {OMNICHANNEL_SIMULATOR_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setSimChannel(preset.channel);
                          setSimName(preset.contactName);
                          setSimHandle(preset.handle);
                          setSimText(preset.text);
                        }}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 transition flex items-center justify-between gap-2"
                      >
                        <span className="font-medium text-slate-200 truncate">{preset.label}</span>
                        <ChannelBadge channel={preset.channel} compact />
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSimulateIncoming} className="space-y-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="block text-slate-400 mb-1">Red Social de Origen</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(['WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'TIKTOK'] as SupportedChannel[]).map(
                          (ch) => (
                            <button
                              key={ch}
                              type="button"
                              onClick={() => {
                                setSimChannel(ch);
                                setSimHandle(CHANNEL_META[ch].placeholderHandle);
                              }}
                              className={`p-2 rounded-lg border text-left flex items-center gap-2 transition ${
                                simChannel === ch
                                  ? 'bg-indigo-600/25 border-indigo-500 text-white font-semibold'
                                  : 'bg-slate-950 border-slate-800 text-slate-400'
                              }`}
                            >
                              <ChannelIcon channel={ch} className="w-3.5 h-3.5" />
                              <span>{CHANNEL_META[ch].label}</span>
                            </button>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 mb-1">Nombre del Lead</label>
                        <input
                          type="text"
                          value={simName}
                          onChange={(e) => setSimName(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Teléfono / @Handle</label>
                        <input
                          type="text"
                          value={simHandle}
                          onChange={(e) => setSimHandle(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Mensaje Entrante</label>
                      <textarea
                        rows={3}
                        value={simText}
                        onChange={(e) => setSimText(e.target.value)}
                        className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={aiGenerating}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition"
                    >
                      <Zap className="w-4 h-4" />
                      Simular Webhook Entrante ({CHANNEL_META[simChannel].shortLabel})
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                  <form onSubmit={handleAddRule} className="space-y-2.5">
                    <div className="font-bold text-slate-300">
                      Añadir Regla de Entrenamiento a Fidel
                    </div>
                    <select
                      value={newRuleCategory}
                      onChange={(e) => setNewRuleCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
                    >
                      <option value="ESTILO">ESTILO & TONO</option>
                      <option value="MCP_POLICY">USO DE HERRAMIENTAS MCP</option>
                      <option value="PRECIOS">PRECIOS & BECAS</option>
                      <option value="OBJECIONES">MANEJO DE OBJECIONES</option>
                    </select>
                    <textarea
                      rows={2}
                      placeholder="Ej: En TikTok e Instagram usa mensajes cortos y ofrece agendar llamada rápida..."
                      value={newRuleText}
                      onChange={(e) => setNewRuleText(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Guardar Regla en Memoria
                    </button>
                  </form>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    {fidelRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">
                            {rule.category}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setFidelRules((prev) => prev.filter((r) => r.id !== rule.id))
                            }
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-slate-200 leading-relaxed">{rule.instruction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          )}

          {rightPanelMode === 'details' && selectedConversation && (
            <aside className="w-88 shrink-0 border-l border-slate-800 bg-slate-900/80 p-4 overflow-y-auto space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  Ficha CRM & Extracción
                </h3>
                <ChannelBadge channel={selectedConversation.channel} />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 mb-1">Nombre del Contacto</label>
                  <input
                    type="text"
                    value={selectedConversation.name || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setConversations((prev) =>
                        prev.map((c) =>
                          c.id === selectedConversation.id ? { ...c, name: val } : c,
                        ),
                      );
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={selectedConversation.email || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setConversations((prev) =>
                        prev.map((c) =>
                          c.id === selectedConversation.id ? { ...c, email: val } : c,
                        ),
                      );
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 flex items-center gap-1">
                    <TagIcon className="w-3 h-3" /> Etiqueta Comercial
                  </label>
                  <input
                    type="text"
                    value={selectedConversation.tag || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setConversations((prev) =>
                        prev.map((c) =>
                          c.id === selectedConversation.id ? { ...c, tag: val } : c,
                        ),
                      );
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Agente Asignado</label>
                  <select
                    value={selectedConversation.assignedToUserId || ORG_AGENTS[0].id}
                    onChange={(e) => {
                      const ag = ORG_AGENTS.find((a) => a.id === e.target.value);
                      setConversations((prev) =>
                        prev.map((c) =>
                          c.id === selectedConversation.id
                            ? {
                                ...c,
                                assignedToUserId: ag?.id,
                                assignedAgentName: ag?.displayName,
                              }
                            : c,
                        ),
                      );
                      notify(`Conversación asignada a ${ag?.displayName}`);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  >
                    {ORG_AGENTS.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Extracted commercial signals */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Datos Extraídos por Fidel + MCP
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  {Object.entries(selectedConversation.extractedData || {}).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">{k}:</span>
                      <span className="font-semibold text-slate-200">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
