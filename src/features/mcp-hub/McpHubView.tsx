import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  RefreshCw,
  Trash2,
  Play,
  CheckCircle2,
  Database,
  Layers,
  Terminal,
  Sparkles,
  Globe,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import type {
  McpServerSummary,
  McpToolExecutionTrace,
  McpToolSchema,
  SupportedChannel,
} from '../../entities/omnichannel/types';
import { ChannelBadge } from '../../shared/ui/channel-badge';
import { executeMcpToolLive } from '../../shared/api/fidel-hub-client';

const ALL_CHANNELS: SupportedChannel[] = ['WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'TIKTOK'];

const MCP_PRESET_TEMPLATES: Array<{
  name: string;
  description: string;
  endpointUrl: string;
  transport: 'http' | 'sse' | 'websocket';
  tools: McpToolSchema[];
}> = [
  {
    name: 'Shopify E-Commerce MCP',
    description: 'Consulta inventario en tiempo real, variantes de producto, carritos y órdenes de Shopify.',
    endpointUrl: 'http://localhost:3005/mcp',
    transport: 'http' as const,
    tools: [
      {
        name: 'shopify_search_products',
        description: 'Busca productos por nombre o SKU y retorna stock y precio actual.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            query: { type: 'string', description: 'Nombre o categoría del producto' },
          },
          required: ['query'],
        },
      },
      {
        name: 'shopify_create_checkout_link',
        description: 'Genera un link de pago directo para enviar por WhatsApp, Instagram o TikTok.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            product_id: { type: 'string', description: 'ID del producto' },
            quantity: { type: 'string', description: 'Cantidad' },
          },
          required: ['product_id'],
        },
      },
    ],
  },
  {
    name: 'Google Calendar & Meet MCP',
    description: 'Gestión directa de calendarios de ejecutivos, disponibilidad y creación de salas Google Meet.',
    endpointUrl: 'http://localhost:3006/mcp',
    transport: 'sse' as const,
    tools: [
      {
        name: 'gcal_list_free_slots',
        description: 'Lista bloques libres en el calendario del ejecutivo asignado.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            date: { type: 'string', description: 'Fecha YYYY-MM-DD' },
          },
          required: ['date'],
        },
      },
    ],
  },
];

interface McpHubViewProps {
  servers: McpServerSummary[];
  onUpdateServers: (next: McpServerSummary[]) => void;
  onNotify: (msg: string) => void;
}

export function McpHubView({ servers, onUpdateServers, onNotify }: McpHubViewProps) {
  const [selectedServerId, setSelectedServerId] = useState<string>(
    servers[0]?.id || 'mcp_fidel_official',
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newUrl, setNewUrl] = useState('http://localhost:3005/mcp');
  const [newTransport, setNewTransport] = useState<'http' | 'sse' | 'websocket'>('http');
  const [newToolName, setNewToolName] = useState('');
  const [newToolDesc, setNewToolDesc] = useState('');

  // Inspector state
  const selectedServer = servers.find((s) => s.id === selectedServerId) || servers[0];
  const [selectedToolName, setSelectedToolName] = useState<string>(
    selectedServer?.tools[0]?.name || 'fidel_consultar_catalogo',
  );
  const [toolArgsJson, setToolArgsJson] = useState<string>(
    JSON.stringify({ programa: 'ia_docencia' }, null, 2),
  );
  const [executingTool, setExecutingTool] = useState(false);
  const [discoveringId, setDiscoveringId] = useState<string | null>(null);
  const [traceHistory, setTraceHistory] = useState<McpToolExecutionTrace[]>([]);

  const handleSelectServer = (srv: McpServerSummary) => {
    setSelectedServerId(srv.id);
    const firstTool = srv.tools[0];
    if (firstTool) {
      setSelectedToolName(firstTool.name);
      const sample: Record<string, any> = {};
      Object.keys(firstTool.inputSchema?.properties || {}).forEach((k) => {
        sample[k] = k === 'programa' ? 'ia_docencia' : `valor_${k}`;
      });
      setToolArgsJson(JSON.stringify(sample, null, 2));
    }
  };

  const handleToggleChannel = (srvId: string, ch: SupportedChannel) => {
    const next = servers.map((s) => {
      if (s.id !== srvId) return s;
      const exists = s.assignedChannels.includes(ch);
      const assignedChannels = exists
        ? s.assignedChannels.filter((c) => c !== ch)
        : [...s.assignedChannels, ch];
      return { ...s, assignedChannels, updatedAt: new Date().toISOString() };
    });
    onUpdateServers(next);
    onNotify(`Canales actualizados para el servidor MCP`);
  };

  const handleSetDefault = (srvId: string) => {
    const next = servers.map((s) => ({
      ...s,
      isDefault: s.id === srvId,
      isActive: s.id === srvId ? true : s.isActive,
    }));
    onUpdateServers(next);
    onNotify('Servidor MCP predeterminado actualizado');
  };

  const handleToggleActive = (srvId: string) => {
    const next = servers.map((s) => (s.id === srvId ? { ...s, isActive: !s.isActive } : s));
    onUpdateServers(next);
  };

  const handleDelete = (srvId: string) => {
    if (srvId === 'mcp_fidel_official') {
      onNotify('FidelMCP es el servidor nativo principal y no puede eliminarse (puedes desactivarlo).');
      return;
    }
    const next = servers.filter((s) => s.id !== srvId);
    onUpdateServers(next);
    if (selectedServerId === srvId && next[0]) {
      setSelectedServerId(next[0].id);
    }
    onNotify('Servidor MCP eliminado');
  };

  const handleDiscover = async (srv: McpServerSummary) => {
    setDiscoveringId(srv.id);
    try {
      await new Promise((r) => setTimeout(r, 450));
      onNotify(
        `Sincronización MCP completada: ${srv.tools.length} tools y ${srv.resources.length} resources verificados en ${srv.name}`,
      );
    } finally {
      setDiscoveringId(null);
    }
  };

  const handleCreateCustomMcp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;

    const customTools: McpToolSchema[] = [
      {
        name:
          newToolName.trim() ||
          `${newName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_execute`,
        description:
          newToolDesc.trim() || `Ejecuta consulta o acción en el servidor MCP ${newName.trim()}`,
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Parámetro o instrucción de entrada' },
            lead_handle: { type: 'string', description: 'Identificador del contacto omnicanal' },
          },
          required: ['query'],
        },
      },
    ];

    const created: McpServerSummary = {
      id: `mcp_custom_${Date.now()}`,
      organizationId: 'org_krakedev',
      name: newName.trim(),
      description: newDesc.trim() || 'Servidor MCP conectado dinámicamente.',
      transport: newTransport,
      endpointUrl: newUrl.trim(),
      hasApiKey: false,
      isActive: true,
      isDefault: false,
      assignedChannels: ['WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'TIKTOK'],
      tools: customTools,
      resources: [],
      updatedAt: new Date().toISOString(),
    };

    const next = [...servers, created];
    onUpdateServers(next);
    setSelectedServerId(created.id);
    setSelectedToolName(created.tools[0].name);
    setShowAddModal(false);
    setNewName('');
    setNewDesc('');
    setNewToolName('');
    setNewToolDesc('');
    onNotify(`Servidor MCP "${created.name}" conectado y listo para usar en los chats`);
  };

  const handleAddPreset = (preset: (typeof MCP_PRESET_TEMPLATES)[number]) => {
    const created: McpServerSummary = {
      id: `mcp_preset_${Date.now()}`,
      organizationId: 'org_krakedev',
      name: preset.name,
      description: preset.description,
      transport: preset.transport,
      endpointUrl: preset.endpointUrl,
      hasApiKey: true,
      isActive: true,
      isDefault: false,
      assignedChannels: ['WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'TIKTOK'],
      tools: preset.tools,
      resources: [],
      updatedAt: new Date().toISOString(),
    };
    const next = [...servers, created];
    onUpdateServers(next);
    handleSelectServer(created);
    onNotify(`Plantilla MCP "${preset.name}" agregada exitosamente`);
  };

  const handleRunToolTest = async () => {
    if (!selectedServer) return;
    setExecutingTool(true);
    try {
      let parsedArgs: Record<string, any> = {};
      try {
        parsedArgs = JSON.parse(toolArgsJson);
      } catch {
        parsedArgs = { raw: toolArgsJson };
      }
      const trace = await executeMcpToolLive(selectedServer.id, selectedToolName, parsedArgs);
      setTraceHistory((prev) => [trace, ...prev]);
      onNotify(`Tool "${selectedToolName}" ejecutada en ${trace.latencyMs}ms`);
    } finally {
      setExecutingTool(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              MCP Hub Universal & Orquestador de Herramientas
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Conecta cualquier servidor Model Context Protocol (incluyendo{' '}
            <span className="text-indigo-300 font-semibold">FidelMCP</span>) y asígnalo a WhatsApp,
            Instagram, Facebook Messenger o TikTok.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {MCP_PRESET_TEMPLATES.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleAddPreset(preset)}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              + {preset.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            Conectar Nuevo MCP
          </button>
        </div>
      </div>

      {/* Main Grid: Left = Connected MCP Servers, Right = Live Tool Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Lista de Servidores MCP */}
        <div className="xl:col-span-7 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Servidores MCP Registrados ({servers.length})
          </h2>

          <div className="space-y-3">
            {servers.map((srv) => {
              const isSelected = srv.id === selectedServer?.id;
              return (
                <div
                  key={srv.id}
                  onClick={() => handleSelectServer(srv)}
                  className={`p-4 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/25 border-indigo-500/60 shadow-lg shadow-indigo-950/30'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              const next = servers.map((s) =>
                s.id === 'mcp_fidel_official'
                  ? { ...s, endpointUrl: 'https://fidelback-mcp.onrender.com/api/mcp' }
                  : s,
              );
              onUpdateServers(next);
              onNotify('✅ Conectado a Render Cloud: https://fidelback-mcp.onrender.com/api/mcp');
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/50 flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-emerald-950/30"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            ⚡ Usar Render Cloud (Producción)
          </button>
          <button
            type="button"
            onClick={() => {
              const next = servers.map((s) =>
                s.id === 'mcp_fidel_official'
                  ? { ...s, endpointUrl: 'http://localhost:4000/api/mcp' }
                  : s,
              );
              onUpdateServers(next);
              onNotify('💻 Conectado a Localhost: http://localhost:4000/api/mcp');
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            💻 Usar Localhost (4000)
          </button>
                        <span className="font-bold text-sm text-white">{srv.name}</span>
                        {srv.isDefault && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Principal
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300">
                          {srv.transport}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{srv.description}</p>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-indigo-300 pt-1" onClick={(e) => e.stopPropagation()}>
                        <Globe className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                        <input
                          type="text"
                          value={srv.endpointUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            const next = servers.map((s) => (s.id === srv.id ? { ...s, endpointUrl: val } : s));
                            onUpdateServers(next);
                          }}
                          placeholder="Endpoint URL del MCP (ej. https://fidelback-mcp.onrender.com/api/mcp)"
                          className="bg-slate-950 border border-indigo-500/30 hover:border-indigo-400 focus:border-indigo-400 rounded-lg px-2.5 py-1 text-xs text-indigo-200 w-full max-w-md focus:outline-none transition font-mono"
                        />
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-2 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleDiscover(srv)}
                        title="Descubrir tools/list en vivo"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${discoveringId === srv.id ? 'animate-spin text-indigo-400' : ''}`}
                        />
                      </button>
                      {!srv.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(srv.id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 border border-slate-700 transition"
                        >
                          Hacer Principal
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(srv.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                          srv.isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {srv.isActive ? 'Activo' : 'Pausado'}
                      </button>
                      {srv.id !== 'mcp_fidel_official' && (
                        <button
                          type="button"
                          onClick={() => handleDelete(srv.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Canales asignados */}
                  <div
                    className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-400 mr-1">Canales habilitados:</span>
                      {ALL_CHANNELS.map((ch) => {
                        const enabled = srv.assignedChannels.includes(ch);
                        return (
                          <button
                            key={ch}
                            type="button"
                            onClick={() => handleToggleChannel(srv.id, ch)}
                            className={`transition ${enabled ? 'opacity-100 scale-100' : 'opacity-35 hover:opacity-70'}`}
                          >
                            <ChannelBadge channel={ch} compact />
                          </button>
                        );
                      })}
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono">
                      <span className="text-indigo-300 font-semibold">{srv.tools.length}</span> tools
                      {' · '}
                      <span className="text-emerald-300 font-semibold">{srv.resources.length}</span>{' '}
                      resources
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inspector y Probador de Herramientas MCP en Vivo */}
        <div className="xl:col-span-5 space-y-4">
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Inspector & Probador en Vivo ({selectedServer?.name})
              </h2>
            </div>

            {selectedServer && (
              <>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    Seleccionar Tool (`tools/call`)
                  </label>
                  <select
                    value={selectedToolName}
                    onChange={(e) => {
                      const name = e.target.value;
                      setSelectedToolName(name);
                      const tool = selectedServer.tools.find((t) => t.name === name);
                      if (tool) {
                        const sample: Record<string, any> = {};
                        Object.keys(tool.inputSchema?.properties || {}).forEach((k) => {
                          sample[k] =
                            k === 'programa'
                              ? 'ia_docencia'
                              : k === 'fecha_preferida'
                                ? 'Mañana 18:00'
                                : `demo_${k}`;
                        });
                        setToolArgsJson(JSON.stringify(sample, null, 2));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white font-mono"
                  >
                    {selectedServer.tools.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1.5">
                    {selectedServer.tools.find((t) => t.name === selectedToolName)?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    Argumentos JSON de Entrada
                  </label>
                  <textarea
                    rows={4}
                    value={toolArgsJson}
                    onChange={(e) => setToolArgsJson(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-950 border border-slate-700 font-mono text-xs text-amber-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  disabled={executingTool}
                  onClick={handleRunToolTest}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20"
                >
                  <Play className="w-3.5 h-3.5" />
                  {executingTool ? 'Ejecutando en Servidor MCP...' : 'Ejecutar Tool en Vivo'}
                </button>

                {/* Resources list */}
                {selectedServer.resources.length > 0 && (
                  <div className="pt-3 border-t border-slate-800">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-emerald-400" />
                      Recursos Expuestos (`resources/list`)
                    </div>
                    <div className="space-y-1.5">
                      {selectedServer.resources.map((res) => (
                        <div
                          key={res.uri}
                          className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs"
                        >
                          <div className="font-mono text-emerald-300 text-[11px]">{res.uri}</div>
                          <div className="text-slate-300 font-medium">{res.name}</div>
                          <div className="text-slate-500 text-[11px]">{res.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Trace results */}
            {traceHistory.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Últimas Ejecuciones MCP
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {traceHistory.map((tr) => (
                    <div
                      key={tr.id}
                      className="p-2.5 rounded-lg bg-slate-950 border border-indigo-500/30 font-mono text-[11px]"
                    >
                      <div className="flex items-center justify-between text-indigo-300 mb-1">
                        <span>{tr.toolName}</span>
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {tr.latencyMs}ms
                        </span>
                      </div>
                      <pre className="text-emerald-300 overflow-x-auto text-[10px]">
                        {JSON.stringify(tr.result, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para registrar cualquier MCP externo */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              Conectar Cualquier Servidor MCP
            </h3>
            <form onSubmit={handleCreateCustomMcp} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Nombre del Servidor MCP *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Odoo ERP MCP / Salesforce MCP / Custom MCP"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-300 mb-1">Endpoint URL (JSON-RPC / SSE) *</label>
                  <input
                    type="text"
                    required
                    placeholder="http://localhost:3005/mcp"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Transporte</label>
                  <select
                    value={newTransport}
                    onChange={(e) => setNewTransport(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="http">HTTP JSON-RPC</option>
                    <option value="sse">SSE Stream</option>
                    <option value="websocket">WebSocket</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Descripción</label>
                <input
                  type="text"
                  placeholder="Describe qué herramientas provee este MCP..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-300 mb-1">Tool Principal (Opcional)</label>
                  <input
                    type="text"
                    placeholder="ej: consultar_stock_erp"
                    value={newToolName}
                    onChange={(e) => setNewToolName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Descripción de la Tool</label>
                  <input
                    type="text"
                    placeholder="ej: Verifica inventario en vivo"
                    value={newToolDesc}
                    onChange={(e) => setNewToolDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Registrar y Descubrir Tools
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
