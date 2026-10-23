/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * FIDEL — Laboratorio y Prototipo de Pruebas de Agente Comercial IA Multi-tenant
 * Clear Minds / KrakeDev
 * 
 * Arquitectura: Atomic Design
 * Navegación Dual: Vista de Chat & Observabilidad | Vista de Configuración & Tenant
 * Conexión: Llamadas HTTP Reales (fetch) a Google Gemini API y OpenAI API
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bot,
  User,
  UserCheck,
  Send,
  Sparkles,
  Database,
  Cpu,
  Layers,
  CheckCheck,
  Check,
  RotateCcw,
  Code2,
  Copy,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Calendar,
  DollarSign,
  Smartphone,
  Globe,
  Maximize2,
  AlertCircle,
  TrendingUp,
  FileText,
  Activity,
  Zap,
  Terminal,
  ShieldCheck,
  Settings2,
  Info,
  Eye,
  EyeOff,
  MessageSquare,
  Key,
  ArrowRight,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

/* ==========================================================================
   1. TYPES & DATA CONTRACTS
   ========================================================================== */

export type ActiveAppView = 'chat_lab' | 'config_center';
export type ConversationState = 'AI_ACTIVE' | 'HUMAN_ACTIVE' | 'PENDING_HANDOFF';
export type PurchaseIntent = 'alta' | 'media' | 'baja' | 'sin_datos';
export type ObjectionType = 'horarios' | 'precio' | 'tiempo' | 'ninguna' | string;
export type CommercialAction = 
  | 'consultar_horarios' 
  | 'agendar_cita' 
  | 'enviar_cotizacion' 
  | 'enviar_brochure' 
  | 'transferir_a_humano'
  | 'continuar_cualificacion'
  | string;

export type EngineProvider = 'gemini' | 'openai';
export type PreviewMode = 'whatsapp' | 'web_widget' | 'expanded';

export interface ExtractedCommercialData {
  [key: string]: string | number | boolean | null | undefined;
}

export interface InterestSignals {
  intencion_compra: PurchaseIntent;
  objecion: ObjectionType;
}

export interface CanonicalExtractionPayload {
  respuesta_whatsapp: string;
  datos_extraidos: ExtractedCommercialData;
  senales_interes: InterestSignals;
  accion_sugerida: CommercialAction;
}

export interface ToolCallTrace {
  id: string;
  timestamp: string;
  toolName: string;
  parameters: Record<string, unknown>;
  response: Record<string, unknown>;
  latencyMs: number;
}

export interface ChatMessage {
  id: string;
  author: 'client' | 'fidel' | 'human_agent' | 'system';
  content: string;
  timestamp: string;
  timeLabel: string;
  summarized?: boolean;
  toolCall?: {
    toolName: string;
    summary: string;
  };
  extractionSnapshot?: CanonicalExtractionPayload;
}

export interface ProductLineProfile {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  ragStoreId: string;
  systemInstructions: string;
  keyFields: { key: string; label: string; placeholder: string }[];
  suggestedPrompts: string[];
}

export interface HttpPayloadInspectorData {
  provider: EngineProvider;
  model: string;
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  requestBody: Record<string, unknown>;
  responseBody?: Record<string, unknown>;
  status?: number;
  statusText?: string;
  timestamp: string;
}

/* ==========================================================================
   2. CONSTANTS & PRELOADED KRAKEDEV PROFILES
   ========================================================================== */

export const IMMUTABLE_GENERAL_POLICY = `POLÍTICA GENERAL DE FIDEL (CLEAR MINDS / KRAKEDEV):
1. Eres Fidel, asesor comercial consultivo de KrakeDev.
2. Tono: Profesional, cordial, empático, conciso (máximo 2 a 3 oraciones por respuesta).
3. Regla de oro comercial: Realiza UNA sola pregunta de cualificación a la vez para mantener el flujo ágil.
4. Nunca inventes precios finales sin consultar catálogo o herramientas autorizadas.
5. Si el cliente solicita agendamiento, orienta a coordinar fecha y hora para agendar_cita.
6. Nunca ofrezcas descuentos espontáneos sin autorización previa.`;

export const DEFAULT_PRODUCT_PROFILES: Record<string, ProductLineProfile> = {
  cursos: {
    id: 'cursos',
    name: 'KrakeDev — Cursos de Programación',
    tagline: 'Bootcamps prácticos en Python, Web Fullstack y Java con mentoría en vivo',
    badge: 'Cursos & Bootcamps',
    ragStoreId: 'fileSearchStores/krakedev_cursos_catalog',
    systemInstructions: `PERFIL DE LÍNEA: CURSOS DE PROGRAMACIÓN KRAKEDEV
- Enfoque: Tono cordial, breve, una pregunta a la vez.
- Resolver prioritariamente dudas de horarios (clases en vivo los sábados de 09:00 a 13:00 GMT-5 y modalidad entre semana).
- No dar descuentos espontáneos; destacar que los cupos son limitados a 15 alumnos por mentor.
- Orientar a la matrícula directa o a una llamada de nivelación técnica.`,
    keyFields: [
      { key: 'programa_interes', label: 'Programa de Interés', placeholder: 'Ej. Python para Principiantes' },
      { key: 'disponibilidad', label: 'Disponibilidad de Horario', placeholder: 'Ej. Sábados en la mañana' },
      { key: 'presupuesto', label: 'Rango de Presupuesto', placeholder: 'Ej. Plan de 3 cuotas ($240)' },
      { key: 'nivel_previo', label: 'Nivel Técnico Previo', placeholder: 'Ej. Desde cero / Sin experiencia' }
    ],
    suggestedPrompts: [
      'Hola, quiero información sobre el curso de Python para principiantes los sábados.',
      '¿Cuánto cuesta el bootcamp de desarrollo web y qué horario tienen?',
      'Quiero agendar una asesoría técnica para el próximo jueves a las 17:00.',
      'Tengo poca experiencia previa, ¿es muy difícil empezar desde cero?'
    ]
  },
  aws: {
    id: 'aws',
    name: 'KrakeDev — AWS Cloud & DevOps',
    tagline: 'Consultoría en Migración Cloud, Serverless y Optimización de Factura AWS',
    badge: 'Cloud & Infraestructura',
    ragStoreId: 'fileSearchStores/krakedev_aws_brochures',
    systemInstructions: `PERFIL DE LÍNEA: AWS CLOUD & DEVOPS
- Enfoque: Tono corporativo, consultivo y de alta solvencia técnica.
- Calificar el tamaño de la infraestructura actual y el dolor principal (costos elevados, downtime o migración).
- Orientar siempre al agendamiento de un diagnóstico técnico sin costo de 30 minutos con un AWS Solutions Architect.`,
    keyFields: [
      { key: 'servicio_cloud', label: 'Servicio Requerido', placeholder: 'Ej. Optimización de costos / Migración' },
      { key: 'tamano_empresa', label: 'Tamaño de Empresa / Infra', placeholder: 'Ej. 15 servidores / 50 usuarios' },
      { key: 'presupuesto_estimado', label: 'Gasto AWS Mensual', placeholder: 'Ej. $1,500 - $3,000 USD/mes' },
      { key: 'contacto', label: 'Contacto Técnico Clave', placeholder: 'Ej. CTO / Líder de Infraestructura' }
    ],
    suggestedPrompts: [
      'Buenas tardes, queremos migrar nuestra infraestructura on-premise a AWS.',
      'Nuestra factura de AWS se triplicó el último trimestre, buscamos optimizar costos urgentes.',
      'Quiero agendar un diagnóstico técnico con un arquitecto cloud para el viernes a las 11:00.',
      '¿Trabajan con arquitecturas basadas en Kubernetes EKS o Serverless?'
    ]
  },
  custom_dev: {
    id: 'custom_dev',
    name: 'KrakeDev — Software a la Medida',
    tagline: 'Desarrollo ágil de plataformas SaaS, Apps móviles nativas y Sistemas Web',
    badge: 'Fábrica de Software',
    ragStoreId: 'fileSearchStores/krakedev_custom_dev',
    systemInstructions: `PERFIL DE LÍNEA: SOFTWARE A LA MEDIDA
- Enfoque: Tono ágil, formal y enfocado en retorno de inversión.
- Calificar requerimientos de negocio, tipo de aplicación (móvil, ERP, web app) y fecha límite o plazo estimado.
- Identificar la etapa del proyecto (idea, MVP existente o refactorización total).`,
    keyFields: [
      { key: 'tipo_software', label: 'Tipo de Solución', placeholder: 'Ej. App móvil multiplataforma Flutter' },
      { key: 'plazo_estimado', label: 'Plazo Deseado', placeholder: 'Ej. 3 a 4 meses' },
      { key: 'etapa_proyecto', label: 'Etapa del Proyecto', placeholder: 'Ej. MVP con requerimientos claros' },
      { key: 'alcance_inicial', label: 'Alcance Principal', placeholder: 'Ej. Pasarela de pagos + Panel admin' }
    ],
    suggestedPrompts: [
      'Necesitamos cotizar el desarrollo de una app móvil de logística y entregas en tiempo real.',
      'Tenemos un sistema heredado en PHP y queremos rehacerlo como SaaS moderno en 3 meses.',
      'Me gustaría coordinar una reunión de descubrimiento técnico para validar alcance.',
      '¿Cuál es el costo aproximado para construir un MVP de una fintech?'
    ]
  }
};

export const AVAILABLE_MODELS: Record<EngineProvider, { id: string; label: string; recommended?: boolean }[]> = {
  gemini: [
    { id: 'gemini-2.0-flash', label: 'gemini-2.0-flash (Recomendado estándar)', recommended: true },
    { id: 'gemini-2.5-flash', label: 'gemini-2.5-flash (Ultra rápido y multimodal)' },
    { id: 'gemini-1.5-flash', label: 'gemini-1.5-flash (Ligero y de baja latencia)' },
    { id: 'gemini-1.5-pro', label: 'gemini-1.5-pro (Razonamiento profundo)' }
  ],
  openai: [
    { id: 'gpt-4o-mini', label: 'gpt-4o-mini (Recomendado rápido y económico)', recommended: true },
    { id: 'gpt-4o', label: 'gpt-4o (Razonamiento omni avanzado)' },
    { id: 'gpt-3.5-turbo', label: 'gpt-3.5-turbo (Legacy)' }
  ]
};

/* ==========================================================================
   3. ATOMS (Atomic Design Tier 1)
   ========================================================================== */

export const KrakeDevLogo: React.FC<{ className?: string; showText?: boolean }> = ({
  className = "w-9 h-9",
  showText = true
}) => {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`relative shrink-0 flex items-center justify-center ${className}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]"
        >
          <circle cx="50" cy="50" r="46" stroke="#EF4444" strokeWidth="2.5" strokeOpacity="0.3" strokeDasharray="6 4" />
          <circle cx="50" cy="50" r="42" fill="#111827" stroke="#374151" strokeWidth="1.5" />
          
          <path d="M22 62C18 72 12 76 8 82C15 84 26 78 28 68" fill="#DC2626" />
          <path d="M78 62C82 72 88 76 92 82C85 84 74 78 72 68" fill="#DC2626" />
          
          <path
            d="M50 18C36 18 28 28 28 42C28 54 34 62 40 68C42 70 46 72 50 72C54 72 58 70 60 68C66 62 72 54 72 42C72 28 64 18 50 18Z"
            fill="url(#krakenGradient)"
          />
          
          <path
            d="M33 38C33 36 38 34 50 34C62 34 67 36 67 38V42C67 45 61 46 50 46C39 46 33 45 33 42V38Z"
            fill="#0F172A"
            stroke="#EF4444"
            strokeWidth="1.5"
          />
          <line x1="38" y1="40" x2="44" y2="40" stroke="#F87171" strokeWidth="2" strokeLinecap="round" />
          <line x1="56" y1="40" x2="62" y2="40" stroke="#F87171" strokeWidth="2" strokeLinecap="round" />

          {/* Left Tentacle holding Mini Laptop */}
          <path
            d="M32 58C25 58 18 64 20 72C21 77 28 78 34 72C36 70 38 64 36 60"
            stroke="#EF4444"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <rect x="14" y="62" width="16" height="11" rx="1.5" fill="#1E293B" stroke="#94A3B8" strokeWidth="1" />
          <rect x="16" y="64" width="12" height="7" rx="0.5" fill="#0F172A" />
          <path d="M19 67L21 68L19 69" stroke="#EF4444" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M12 73H32" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />

          {/* Right Tentacle holding Mini Smartphone */}
          <path
            d="M68 58C75 58 82 64 80 72C79 77 72 78 66 72C64 70 62 64 64 60"
            stroke="#EF4444"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <rect x="70" y="61" width="10" height="16" rx="2" fill="#1E293B" stroke="#94A3B8" strokeWidth="1" />
          <rect x="72" y="63" width="6" height="11" rx="0.5" fill="#0F172A" />
          <circle cx="75" cy="66" r="1" fill="#22C55E" />
          <line x1="74" y1="69" x2="77" y2="69" stroke="#38BDF8" strokeWidth="0.8" />
          <line x1="73" y1="71" x2="76" y2="71" stroke="#EF4444" strokeWidth="0.8" />

          <path d="M44 68C42 76 38 82 43 86C46 86 48 80 47 72" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
          <path d="M56 68C58 76 62 82 57 86C54 86 52 80 53 72" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />

          <defs>
            <linearGradient id="krakenGradient" x1="50" y1="18" x2="50" y2="72" gradientUnits="userSpaceOnUse">
              <stop stopColor="#EF4444" />
              <stop offset="0.6" stopColor="#DC2626" />
              <stop offset="1" stopColor="#991B1B" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-wider text-white font-mono">
              KRAKE<span className="text-red-500">DEV</span>
            </span>
            <span className="text-[10px] bg-red-950/80 text-red-400 border border-red-800/60 font-semibold px-1.5 py-0.2 rounded font-mono">
              FIDEL LAB
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium tracking-tight">
            Clear Minds · Commercial AI
          </span>
        </div>
      )}
    </div>
  );
};

export const ConversationStateBadge: React.FC<{ state: ConversationState }> = ({ state }) => {
  switch (state) {
    case 'AI_ACTIVE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          FIDEL ACTIVO (AI)
        </span>
      );
    case 'HUMAN_ACTIVE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-950/80 text-blue-300 border border-blue-600/60 shadow-sm">
          <UserCheck className="w-3.5 h-3.5 text-blue-400" />
          ASESOR HUMANO EN CONTROL
        </span>
      );
    case 'PENDING_HANDOFF':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-950/80 text-amber-300 border border-amber-600/60">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          HANDOFF SOLICITADO
        </span>
      );
  }
};

export const PurchaseIntentBadge: React.FC<{ intent: PurchaseIntent }> = ({ intent }) => {
  switch (intent) {
    case 'alta':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded bg-emerald-950/70 text-emerald-400 border border-emerald-700/50">
          <TrendingUp className="w-3 h-3" />
          ALTA
        </span>
      );
    case 'media':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded bg-amber-950/70 text-amber-400 border border-amber-700/50">
          MEDIA
        </span>
      );
    case 'baja':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded bg-slate-800 text-slate-300 border border-slate-700">
          BAJA
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-slate-800/80 text-slate-400 border border-slate-700/60">
          SIN DATOS
        </span>
      );
  }
};

export const ObjectionBadge: React.FC<{ objection: ObjectionType }> = ({ objection }) => {
  const norm = String(objection || '').toLowerCase();
  let label = 'Sin Objeción Activa';
  let cls = 'bg-slate-800/80 text-slate-400 border-slate-700/50';

  if (norm.includes('horario') || norm.includes('disponibilidad')) {
    label = 'Horarios / Disponibilidad';
    cls = 'bg-indigo-950/60 text-indigo-300 border-indigo-700/50';
  } else if (norm.includes('precio') || norm.includes('costo') || norm.includes('arancel') || norm.includes('presupuesto')) {
    label = 'Sensibilidad de Precio';
    cls = 'bg-rose-950/60 text-rose-300 border-rose-700/50';
  } else if (norm.includes('tiempo') || norm.includes('plazo') || norm.includes('duracion')) {
    label = 'Plazo / Tiempo';
    cls = 'bg-amber-950/60 text-amber-300 border-amber-700/50';
  } else if (norm && norm !== 'ninguna' && norm !== 'null') {
    label = objection;
    cls = 'bg-purple-950/60 text-purple-300 border-purple-700/50';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${cls}`}>
      {label}
    </span>
  );
};

export const Button: React.FC<{
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  title?: string;
}> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  className = '',
  icon,
  title
}) => {
  const base = "inline-flex items-center justify-center font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizeCls = {
    sm: "text-xs px-2.5 py-1.5 gap-1.5",
    md: "text-xs px-3.5 py-2 gap-2",
    lg: "text-sm px-4 py-2.5 gap-2"
  }[size];

  const variantCls = {
    primary: "bg-red-600 hover:bg-red-500 active:bg-red-700 text-white shadow-md shadow-red-950/50 border border-red-500/30",
    secondary: "bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-100 border border-slate-700",
    outline: "bg-transparent hover:bg-slate-800/60 text-slate-300 border border-slate-700 hover:border-slate-600",
    danger: "bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60",
    ghost: "bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-100",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/40"
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${base} ${sizeCls} ${variantCls} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
};

export const Avatar: React.FC<{
  role: 'client' | 'fidel' | 'human_agent' | 'system';
  size?: 'sm' | 'md' | 'lg';
}> = ({ role, size = 'md' }) => {
  const sizeMap = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base"
  }[size];

  if (role === 'fidel') {
    return (
      <div className={`${sizeMap} rounded-full bg-gradient-to-br from-red-600 to-red-950 border border-red-500/50 flex items-center justify-center text-white shrink-0 shadow-sm shadow-red-900/40 relative`}>
        <Bot className="w-4 h-4 text-red-100" />
        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-slate-950" />
      </div>
    );
  }

  if (role === 'human_agent') {
    return (
      <div className={`${sizeMap} rounded-full bg-gradient-to-br from-blue-600 to-blue-950 border border-blue-500/50 flex items-center justify-center text-white shrink-0 shadow-sm`}>
        <UserCheck className="w-4 h-4 text-blue-200" />
      </div>
    );
  }

  if (role === 'system') {
    return (
      <div className={`${sizeMap} rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0`}>
        <Terminal className="w-3.5 h-3.5 text-slate-400" />
      </div>
    );
  }

  return (
    <div className={`${sizeMap} rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-200 shrink-0 shadow-sm`}>
      <User className="w-4 h-4 text-slate-300" />
    </div>
  );
};

/* ==========================================================================
   4. MOLECULES (Atomic Design Tier 2)
   ========================================================================== */

export const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isClient = message.author === 'client';
  const isFidel = message.author === 'fidel';
  const isHuman = message.author === 'human_agent';
  const isSystem = message.author === 'system';

  if (isSystem) {
    return (
      <div className="my-3 flex justify-center">
        <div className="px-3.5 py-1.5 rounded-full bg-slate-900/95 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2 shadow-sm font-mono">
          <Terminal className="w-3 h-3 text-red-400 shrink-0" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col my-2 ${isClient ? 'items-end' : 'items-start'}`}>
      <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400 font-medium">
        <Avatar role={message.author} size="sm" />
        <span>
          {isClient && 'Cliente (Visitante)'}
          {isFidel && 'Fidel — Agente Comercial IA'}
          {isHuman && 'Asesor Humano (KrakeDev)'}
        </span>
        <span className="text-slate-600">·</span>
        <span className="font-mono text-[10px] text-slate-500">{message.timeLabel}</span>
        {message.summarized && (
          <span className="inline-flex items-center gap-1 text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded border border-slate-700 font-mono">
            <Database className="w-2.5 h-2.5 text-amber-400" />
            Compactado en Memoria BDD
          </span>
        )}
      </div>

      <div
        className={`max-w-[85%] sm:max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm transition-all ${
          isClient
            ? 'bg-slate-800 text-slate-100 rounded-tr-none border border-slate-700'
            : isFidel
            ? 'bg-slate-900 text-slate-100 rounded-tl-none border border-red-500/30 shadow-red-950/20'
            : 'bg-blue-950 text-blue-100 rounded-tr-none border border-blue-500/40 shadow-blue-950/30'
        }`}
      >
        <div className="whitespace-pre-wrap select-text">{message.content}</div>

        {message.toolCall && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-2 text-xs text-amber-300 font-mono bg-amber-950/40 px-2 py-1 rounded">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              Tool ejecutada: <strong className="text-amber-200">{message.toolCall.toolName}</strong> ({message.toolCall.summary})
            </span>
          </div>
        )}

        <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[10px] text-slate-400 font-mono">
          <span>{message.timeLabel}</span>
          {isClient ? (
            <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
          ) : (
            <Check className="w-3 h-3 text-slate-500" />
          )}
        </div>
      </div>
    </div>
  );
};

export const CommercialDataCard: React.FC<{
  label: string;
  fieldKey: string;
  value?: string | number | boolean | null;
  placeholder: string;
}> = ({ label, fieldKey, value, placeholder }) => {
  const isPresent = Boolean(value && String(value).trim() !== '');

  return (
    <div className={`p-2.5 rounded-lg border transition-all ${
      isPresent
        ? 'bg-slate-900/90 border-red-500/40 shadow-sm shadow-red-950/20'
        : 'bg-slate-950/60 border-slate-800/80 opacity-75'
    }`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
          {label}
        </span>
        {isPresent ? (
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50 flex items-center gap-1">
            <Check className="w-2.5 h-2.5" />
            Extraído
          </span>
        ) : (
          <span className="text-[10px] font-mono text-slate-500">Pendiente</span>
        )}
      </div>

      <div className="text-xs font-medium">
        {isPresent ? (
          <span className="text-slate-100 font-semibold">{String(value)}</span>
        ) : (
          <span className="text-slate-600 italic">{placeholder}</span>
        )}
      </div>
    </div>
  );
};

export const LeadScoringGauge: React.FC<{
  intent: PurchaseIntent;
  objection: ObjectionType;
  action: CommercialAction;
}> = ({ intent, objection, action }) => {
  const scoreMap: Record<PurchaseIntent, number> = {
    alta: 88,
    media: 58,
    baja: 25,
    sin_datos: 10
  };
  const percentage = scoreMap[intent] ?? 10;

  const colorMap: Record<PurchaseIntent, string> = {
    alta: 'bg-emerald-500 text-emerald-400',
    media: 'bg-amber-500 text-amber-400',
    baja: 'bg-rose-500 text-rose-400',
    sin_datos: 'bg-slate-600 text-slate-400'
  };

  const actionLabels: Record<string, string> = {
    agendar_cita: '📅 Agendar Cita Comercial / Diagnóstico',
    consultar_horarios: '⏰ Validar Horarios de Clases',
    enviar_cotizacion: '📑 Enviar Cotización Formal',
    enviar_brochure: '📦 Enviar Catálogo de Contenidos',
    transferir_a_humano: '🙋‍♂️ Transferir de Inmediato a Asesor',
    continuar_cualificacion: '💬 Continuar Cualificación Activa'
  };

  return (
    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-red-400" />
          <span className="text-xs font-semibold text-slate-200">Cualificación Comercial</span>
        </div>
        <PurchaseIntentBadge intent={intent} />
      </div>

      <div>
        <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
          <span>Probabilidad de Cierre Estimada</span>
          <span className="font-bold text-slate-200">{percentage}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${colorMap[intent]?.split(' ')[0] || 'bg-slate-600'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-xs">
        <div>
          <span className="text-[10px] text-slate-500 block uppercase font-mono mb-0.5">Objeción Clave</span>
          <ObjectionBadge objection={objection} />
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block uppercase font-mono mb-0.5">Acción Recomendada</span>
          <span className="text-slate-300 font-medium text-[11px] block truncate">
            {actionLabels[action] || action}
          </span>
        </div>
      </div>
    </div>
  );
};

export const MemoryThresholdBar: React.FC<{
  currentCount: number;
  threshold: number;
  totalMessages: number;
  onForceSummary: () => void;
  isSummarizing?: boolean;
}> = ({ currentCount, threshold, totalMessages, onForceSummary, isSummarizing = false }) => {
  const percentage = Math.min(100, Math.round((currentCount / threshold) * 100));

  return (
    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-slate-200">Memoria Incremental Fidel</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onForceSummary}
          disabled={isSummarizing || currentCount === 0}
          icon={<RotateCcw className={`w-3 h-3 ${isSummarizing ? 'animate-spin' : ''}`} />}
        >
          {isSummarizing ? 'Resumiendo...' : 'Forzar Resumen Real'}
        </Button>
      </div>

      <div>
        <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
          <span>Mensajes activos hasta síntesis:</span>
          <span className="font-bold text-amber-300">
            {currentCount} / {threshold} turnos
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-300 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
        <span>Total sesión: {totalMessages} msgs</span>
        <span>Ventana LLM reducida: {Math.max(1, currentCount)} msgs</span>
      </div>
    </div>
  );
};

export const ChatInputBar: React.FC<{
  onSendMessage: (text: string) => void;
  state: ConversationState;
  disabled?: boolean;
  channel: 'whatsapp' | 'web';
  onToggleChannel: () => void;
}> = ({ onSendMessage, state, disabled = false, channel, onToggleChannel }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isHuman = state === 'HUMAN_ACTIVE';

  return (
    <div className="p-3 border-t border-slate-800 bg-slate-950/95 space-y-2">
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-mono">Modo de envío:</span>
          {isHuman ? (
            <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700/60 font-semibold font-mono text-[10px]">
              👤 ASESOR HUMANO
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold font-mono text-[10px]">
              🧑 CLIENTE (VISITANTE)
            </span>
          )}
        </div>

        <button
          onClick={onToggleChannel}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors font-mono"
          title="Alternar canal de simulación"
        >
          {channel === 'whatsapp' ? (
            <>
              <Smartphone className="w-3 h-3 text-emerald-400" />
              <span>WhatsApp Simulado</span>
            </>
          ) : (
            <>
              <Globe className="w-3 h-3 text-sky-400" />
              <span>Web Widget</span>
            </>
          )}
        </button>
      </div>

      <div className="flex items-end gap-2 bg-slate-900 border border-slate-800 focus-within:border-red-500 rounded-xl p-2 transition-all shadow-inner">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            isHuman
              ? "Escribe como Asesor Humano (Fidel no responderá automáticamente)..."
              : "Escribe como cliente (ej. 'Quiero agendar para el sábado', '¿Cuánto cuesta?')..."
          }
          rows={1}
          disabled={disabled}
          className="w-full bg-transparent text-slate-100 text-sm placeholder-slate-500 focus:outline-none resize-none max-h-32 py-1 px-1.5"
        />

        <Button
          variant={isHuman ? 'secondary' : 'primary'}
          size="md"
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className={isHuman ? "bg-blue-600 hover:bg-blue-500 text-white border-blue-500/50" : ""}
          icon={<Send className="w-3.5 h-3.5" />}
        >
          Enviar
        </Button>
      </div>

      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono px-1">
        <span>Presiona <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">Enter</kbd> para enviar, <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">Shift+Enter</kbd> salto</span>
        <span>Llamadas HTTP Reales Activas</span>
      </div>
    </div>
  );
};

/* ==========================================================================
   5. REAL API CALL CLIENTS (GOOGLE GEMINI & OPENAI)
   ========================================================================== */

/**
 * Robust JSON parser that handles both direct JSON strings and Markdown code block wrapping
 */
export function extractAndParseJson<T>(rawText: string): T {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return JSON.parse(cleaned) as T;
}

/**
 * Execute real Gemini generateContent call via fetch
 */
export async function executeRealGeminiCall({
  apiKey,
  model,
  generalPolicy,
  productPrompt,
  conversationSummary,
  unsummarizedMessages
}: {
  apiKey: string;
  model: string;
  generalPolicy: string;
  productPrompt: string;
  conversationSummary: string;
  unsummarizedMessages: ChatMessage[];
}): Promise<{
  extraction: CanonicalExtractionPayload;
  httpInspection: HttpPayloadInspectorData;
}> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('No se ha configurado la Google Gemini API Key. Ingresa tu clave en la pestaña de Configuración.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  // Assemble system instruction
  let fullInstruction = `${generalPolicy}\n\n${productPrompt}`;
  if (conversationSummary) {
    fullInstruction += `\n\n[RESUMEN DE CONVERSACIÓN PREVIA CONSOLIDADO EN BDD]:\n${conversationSummary}`;
  }

  // Format history for Gemini
  const contents = unsummarizedMessages.map(m => ({
    role: m.author === 'client' ? 'user' : 'model',
    parts: [{ text: m.content }]
  }));

  const requestBody = {
    system_instruction: {
      parts: [{ text: fullInstruction }]
    },
    contents: contents.length > 0 ? contents : [{ role: 'user', parts: [{ text: 'Hola' }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          respuesta_whatsapp: {
            type: 'STRING',
            description: 'Respuesta cordial, breve y consultiva para el cliente vía WhatsApp.'
          },
          datos_extraidos: {
            type: 'OBJECT',
            description: 'Objeto clave-valor con los atributos comerciales detectados en la conversación.'
          },
          senales_interes: {
            type: 'OBJECT',
            properties: {
              intencion_compra: {
                type: 'STRING',
                enum: ['alta', 'media', 'baja', 'sin_datos']
              },
              objecion: {
                type: 'STRING',
                description: 'Objeción detectada: horarios, precio, tiempo, o ninguna.'
              }
            },
            required: ['intencion_compra']
          },
          accion_sugerida: {
            type: 'STRING',
            description: 'Siguiente acción comercial recomendada.'
          }
        },
        required: ['respuesta_whatsapp', 'datos_extraidos', 'senales_interes', 'accion_sugerida']
      }
    }
  };

  const headers = {
    'Content-Type': 'application/json'
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody)
  });

  const rawJson = await response.json();

  const httpInspection: HttpPayloadInspectorData = {
    provider: 'gemini',
    model,
    endpoint: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=***HIDDEN***`,
    method: 'POST',
    headers,
    requestBody,
    responseBody: rawJson,
    status: response.status,
    statusText: response.statusText,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };

  if (!response.ok) {
    const errorMsg = rawJson?.error?.message || `Error HTTP ${response.status}: ${response.statusText}`;
    throw new Error(`Google Gemini API: ${errorMsg}`);
  }

  const rawText = rawJson?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('La respuesta de Gemini no contuvo texto estructurado.');
  }

  const extraction = extractAndParseJson<CanonicalExtractionPayload>(rawText);
  return { extraction, httpInspection };
}

/**
 * Execute real OpenAI chat completions call via fetch
 */
export async function executeRealOpenAiCall({
  apiKey,
  model,
  generalPolicy,
  productPrompt,
  conversationSummary,
  unsummarizedMessages
}: {
  apiKey: string;
  model: string;
  generalPolicy: string;
  productPrompt: string;
  conversationSummary: string;
  unsummarizedMessages: ChatMessage[];
}): Promise<{
  extraction: CanonicalExtractionPayload;
  httpInspection: HttpPayloadInspectorData;
}> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('No se ha configurado la OpenAI API Key. Ingresa tu clave en la pestaña de Configuración.');
  }

  const endpoint = 'https://api.openai.com/v1/chat/completions';

  let developerPrompt = `${generalPolicy}\n\n${productPrompt}\n\nINSTRUCCIÓN CRÍTICA DE FORMATO:\nDebes responder OBLIGATORIAMENTE en formato JSON con la siguiente estructura canónica:\n{\n  "respuesta_whatsapp": "Texto legible para el cliente...",\n  "datos_extraidos": { "campo": "valor", ... },\n  "senales_interes": {\n    "intencion_compra": "alta" | "media" | "baja" | "sin_datos",\n    "objecion": "horarios" | "precio" | "tiempo" | "ninguna"\n  },\n  "accion_sugerida": "consultar_horarios" | "agendar_cita" | "enviar_cotizacion" | "transferir_a_humano"\n}`;

  const messagesPayload: { role: string; content: string }[] = [
    { role: 'developer', content: developerPrompt }
  ];

  if (conversationSummary) {
    messagesPayload.push({
      role: 'system',
      content: `[RESUMEN PREVIO DE CONVERSACIÓN CONSOLIDADO EN BDD]:\n${conversationSummary}`
    });
  }

  unsummarizedMessages.forEach(m => {
    messagesPayload.push({
      role: m.author === 'client' ? 'user' : 'assistant',
      content: m.content
    });
  });

  const requestBody = {
    model,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: messagesPayload
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey.trim()}`
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody)
  });

  const rawJson = await response.json();

  const httpInspection: HttpPayloadInspectorData = {
    provider: 'openai',
    model,
    endpoint,
    method: 'POST',
    headers: { ...headers, Authorization: 'Bearer ***HIDDEN***' },
    requestBody,
    responseBody: rawJson,
    status: response.status,
    statusText: response.statusText,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };

  if (!response.ok) {
    const errorMsg = rawJson?.error?.message || `Error HTTP ${response.status}: ${response.statusText}`;
    throw new Error(`OpenAI API: ${errorMsg}`);
  }

  const rawText = rawJson?.choices?.[0]?.message?.content;
  if (!rawText) {
    throw new Error('La respuesta de OpenAI no contuvo texto estructurado.');
  }

  const extraction = extractAndParseJson<CanonicalExtractionPayload>(rawText);
  return { extraction, httpInspection };
}

/**
 * Execute real incremental summary call via active LLM provider
 */
export async function executeRealSummaryCall({
  provider,
  apiKey,
  model,
  messagesToSummarize
}: {
  provider: EngineProvider;
  apiKey: string;
  model: string;
  messagesToSummarize: ChatMessage[];
}): Promise<string> {
  const transcript = messagesToSummarize
    .map(m => `${m.author === 'client' ? 'Cliente' : 'Fidel'}: ${m.content}`)
    .join('\n');

  const prompt = `Resume los puntos clave acordados, necesidades detectadas y el estado del prospecto comercial en un solo párrafo conciso y directo:\n\nTranscripción de la conversación:\n${transcript}`;

  if (provider === 'gemini') {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      })
    });
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Resumen de conversación sintetizado.';
  } else {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      })
    });
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || 'Resumen de conversación sintetizado.';
  }
}

/* ==========================================================================
   6. ORGANISMS (Atomic Design Tier 3)
   ========================================================================== */

/**
 * Organism: HeaderNavbar
 * Barra superior con Logotipo KrakeDev, Navegación Dual (Chat vs Config), Control Handoff y Sesión
 */
export const HeaderNavbar: React.FC<{
  currentView: ActiveAppView;
  onChangeView: (v: ActiveAppView) => void;
  conversationState: ConversationState;
  onToggleControl: () => void;
  sessionId: string;
  onResetSession: () => void;
  previewMode: PreviewMode;
  onChangePreviewMode: (m: PreviewMode) => void;
  provider: EngineProvider;
  model: string;
  hasApiKey: boolean;
}> = ({
  currentView,
  onChangeView,
  conversationState,
  onToggleControl,
  sessionId,
  onResetSession,
  previewMode,
  onChangePreviewMode,
  provider,
  model,
  hasApiKey
}) => {
  return (
    <header className="h-16 px-4 bg-slate-950 border-b border-slate-800/90 flex items-center justify-between gap-4 sticky top-0 z-30 select-none">
      {/* Zone 1: Brand & Dual View Switcher */}
      <div className="flex items-center gap-6">
        <KrakeDevLogo className="w-9 h-9" />

        {/* Dual View Nav Tabs */}
        <nav className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            onClick={() => onChangeView('chat_lab')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              currentView === 'chat_lab'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat & Observabilidad</span>
          </button>

          <button
            onClick={() => onChangeView('config_center')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              currentView === 'config_center'
                ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5 text-red-400" />
            <span>Configuración & Tenant</span>
            {!hasApiKey && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Falta configurar API Key" />
            )}
          </button>
        </nav>
      </div>

      {/* Zone 2: Central Handoff Controller & Active Model */}
      <div className="hidden lg:flex items-center gap-3">
        <ConversationStateBadge state={conversationState} />

        <Button
          variant={conversationState === 'AI_ACTIVE' ? 'outline' : 'primary'}
          size="sm"
          onClick={onToggleControl}
          icon={conversationState === 'AI_ACTIVE' ? <UserCheck className="w-3.5 h-3.5 text-blue-400" /> : <Bot className="w-3.5 h-3.5" />}
          className={conversationState === 'HUMAN_ACTIVE' ? "bg-red-600 hover:bg-red-500" : ""}
        >
          {conversationState === 'AI_ACTIVE' ? 'Tomar Control como Asesor' : 'Devolver a Fidel IA'}
        </Button>

        {/* Model Indicator Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
          <Cpu className="w-3 h-3 text-red-400" />
          <span className="capitalize text-slate-400">{provider}:</span>
          <span className="font-semibold text-slate-200">{model}</span>
        </div>
      </div>

      {/* Zone 3: Actions & Preview Modes */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
          <Terminal className="w-3 h-3 text-red-500" />
          <span>{sessionId}</span>
        </div>

        {currentView === 'chat_lab' && (
          <div className="hidden md:flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => onChangePreviewMode('whatsapp')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                previewMode === 'whatsapp' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vista WhatsApp Simulado"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChangePreviewMode('web_widget')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                previewMode === 'web_widget' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vista Widget Web Flotante"
            >
              <Globe className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChangePreviewMode('expanded')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                previewMode === 'expanded' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vista Expandida"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onResetSession}
          icon={<RotateCcw className="w-3.5 h-3.5" />}
          title="Reiniciar Sesión de Prueba"
        >
          <span className="hidden sm:inline">Reiniciar</span>
        </Button>
      </div>
    </header>
  );
};

/**
 * Organism: ChatStreamArea (Clean Center Panel without crammed sidebar)
 */
export const ChatStreamArea: React.FC<{
  messages: ChatMessage[];
  isTyping: boolean;
  onSendMessage: (text: string) => void;
  conversationState: ConversationState;
  suggestedPrompts: string[];
  previewMode: PreviewMode;
  channel: 'whatsapp' | 'web';
  onToggleChannel: () => void;
  hasApiKey: boolean;
  onGoToConfig: () => void;
  activeProvider: EngineProvider;
}> = ({
  messages,
  isTyping,
  onSendMessage,
  conversationState,
  suggestedPrompts,
  previewMode,
  channel,
  onToggleChannel,
  hasApiKey,
  onGoToConfig,
  activeProvider
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden">
      {/* Missing API Key Alert Banner */}
      {!hasApiKey && (
        <div className="bg-amber-950/80 border-b border-amber-800/80 px-4 py-2.5 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Modo de llamada real activo:</strong> Se requiere tu API Key de {activeProvider === 'gemini' ? 'Google Gemini' : 'OpenAI'} para procesar mensajes reales.
            </span>
          </div>
          <button
            onClick={onGoToConfig}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-md text-xs shadow-sm transition-colors whitespace-nowrap"
          >
            <Key className="w-3 h-3" />
            Configurar API Key
          </button>
        </div>
      )}

      {/* Suggested Prompt Chips */}
      <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/90 flex items-center gap-2 overflow-x-auto select-none no-scrollbar">
        <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-red-500" />
          Probar prompt real:
        </span>
        {suggestedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(prompt)}
            className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-full border border-slate-800 shrink-0 transition-colors whitespace-nowrap"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Main Viewport Container */}
      <div className="flex-1 overflow-y-auto p-4 flex justify-center">
        <div
          className={`w-full transition-all duration-300 ${
            previewMode === 'whatsapp'
              ? 'max-w-xl bg-slate-950/80 border border-slate-800 rounded-2xl shadow-2xl p-4 flex flex-col justify-between'
              : previewMode === 'web_widget'
              ? 'max-w-lg bg-slate-900/90 border border-red-500/30 rounded-2xl shadow-2xl p-4'
              : 'max-w-4xl'
          }`}
        >
          {previewMode === 'whatsapp' && (
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2.5">
                <Avatar role="fidel" size="sm" />
                <div>
                  <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                    Fidel · KrakeDev
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">En línea · Asesor Oficial</span>
                </div>
              </div>
              <div className="text-[11px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                WhatsApp Business Simulado
              </div>
            </div>
          )}

          <div className="space-y-1">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 my-2 text-xs text-slate-400 font-mono animate-pulse">
                <Avatar role="fidel" size="sm" />
                <div className="px-3.5 py-2 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[11px] ml-1 text-slate-300">Llamando a la API de {activeProvider.toUpperCase()}...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <ChatInputBar
        onSendMessage={onSendMessage}
        state={conversationState}
        disabled={isTyping}
        channel={channel}
        onToggleChannel={onToggleChannel}
      />
    </div>
  );
};

/**
 * Organism: ObservabilityPanel (Right Panel / 4 Tabs)
 * Extracción en Vivo, Memoria Incremental Real, Trazas de Tools y Trama Raw HTTP
 */
export const ObservabilityPanel: React.FC<{
  activeTab: 'extraction' | 'memory' | 'tools' | 'raw_payload';
  onSelectTab: (tab: 'extraction' | 'memory' | 'tools' | 'raw_payload') => void;
  lastExtraction: CanonicalExtractionPayload | null;
  activeProfile: ProductLineProfile;
  conversationSummary: string;
  toolTraces: ToolCallTrace[];
  httpInspection: HttpPayloadInspectorData | null;
  onForceSummary: () => void;
  isSummarizing: boolean;
  totalMessagesCount: number;
  unsummarizedCount: number;
  memoryThreshold: number;
  provider: EngineProvider;
  model: string;
}> = ({
  activeTab,
  onSelectTab,
  lastExtraction,
  activeProfile,
  conversationSummary,
  toolTraces,
  httpInspection,
  onForceSummary,
  isSummarizing,
  totalMessagesCount,
  unsummarizedCount,
  memoryThreshold,
  provider,
  model
}) => {
  const [copiedPayload, setCopiedPayload] = useState(false);

  const handleCopyPayload = () => {
    if (!httpInspection) return;
    navigator.clipboard.writeText(JSON.stringify(httpInspection, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <aside className="w-96 bg-slate-950 border-l border-slate-800/90 flex flex-col shrink-0 h-full">
      <div className="border-b border-slate-800/90 bg-slate-950">
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Observabilidad Comercial
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
            {provider} · {model}
          </span>
        </div>

        <div className="grid grid-cols-4 p-1 bg-slate-900/60 border-t border-slate-800/80 text-[11px] font-mono">
          <button
            onClick={() => onSelectTab('extraction')}
            className={`py-2 px-1 text-center font-medium rounded transition-colors ${
              activeTab === 'extraction'
                ? 'bg-slate-800 text-red-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Extracción
          </button>
          <button
            onClick={() => onSelectTab('memory')}
            className={`py-2 px-1 text-center font-medium rounded transition-colors ${
              activeTab === 'memory'
                ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Memoria
          </button>
          <button
            onClick={() => onSelectTab('tools')}
            className={`py-2 px-1 text-center font-medium rounded transition-colors ${
              activeTab === 'tools'
                ? 'bg-slate-800 text-sky-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Tools ({toolTraces.length})
          </button>
          <button
            onClick={() => onSelectTab('raw_payload')}
            className={`py-2 px-1 text-center font-medium rounded transition-colors ${
              activeTab === 'raw_payload'
                ? 'bg-slate-800 text-purple-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            4. Trama Raw
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* TAB 1: EXTRACCIÓN COMERCIAL EN VIVO */}
        {activeTab === 'extraction' && (
          <div className="space-y-4">
            <LeadScoringGauge
              intent={lastExtraction?.senales_interes?.intencion_compra || 'sin_datos'}
              objection={lastExtraction?.senales_interes?.objecion || 'ninguna'}
              action={lastExtraction?.accion_sugerida || 'continuar_cualificacion'}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Atributos Cualificados ({activeProfile.name.split('—')[1]})
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Extraído por LLM Real</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {activeProfile.keyFields.map((field) => (
                  <CommercialDataCard
                    key={field.key}
                    label={field.label}
                    fieldKey={field.key}
                    value={lastExtraction?.datos_extraidos?.[field.key]}
                    placeholder={field.placeholder}
                  />
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[10px]">
              <span className="text-slate-400 block mb-1">Estructura Canónica Emitida por el Modelo:</span>
              <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap max-h-56">
                {JSON.stringify(lastExtraction, null, 2) || '// Esperando primer turno de conversación...'}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 2: MEMORIA INCREMENTAL REAL */}
        {activeTab === 'memory' && (
          <div className="space-y-4">
            <MemoryThresholdBar
              currentCount={unsummarizedCount}
              threshold={memoryThreshold}
              totalMessages={totalMessagesCount}
              onForceSummary={onForceSummary}
              isSummarizing={isSummarizing}
            />

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Ciclo de Memoria Incremental Real</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Cada <strong className="text-amber-300">{memoryThreshold} mensajes</strong>, Fidel llama automáticamente a la API con un prompt de síntesis. El resultado se inyecta en <code className="text-red-400 font-mono">conversation_summary</code> y únicamente los mensajes posteriores se envían al modelo en los turnos siguientes, optimizando drásticamente la latencia y el consumo de tokens.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                  conversation_summary acumulado
                </span>
                <span className="text-[10px] text-amber-400 font-mono">Long-term Memory</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed min-h-[140px] whitespace-pre-wrap select-text">
                {conversationSummary ? (
                  conversationSummary
                ) : (
                  <span className="text-slate-600 italic">
                    Sin resumen todavía. Se generará automáticamente con llamada real al alcanzar {memoryThreshold} mensajes o al presionar &quot;Forzar Resumen Real&quot;.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TRAZAS DE HERRAMIENTAS (FUNCTION CALLING) */}
        {activeTab === 'tools' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                Historial de Function Calling
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {toolTraces.length} ejecuciones
              </span>
            </div>

            {toolTraces.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <Zap className="w-6 h-6 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No se han disparado herramientas aún.</p>
                <p className="text-[11px] text-slate-500">
                  Prueba escribiendo: <em>&quot;Quiero agendar una cita para el jueves a las 16:00&quot;</em> o <em>&quot;¿Cuánto cuesta el curso?&quot;</em>
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {toolTraces.map((trace) => (
                  <div key={trace.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        {trace.toolName}()
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{trace.timestamp} · {trace.latencyMs}ms</span>
                    </div>

                    <div className="p-2 rounded bg-slate-950 font-mono text-[10px] text-slate-300">
                      <span className="text-slate-500 block mb-0.5">Parámetros enviados:</span>
                      <pre className="text-sky-300 overflow-x-auto">
                        {JSON.stringify(trace.parameters, null, 2)}
                      </pre>
                    </div>

                    <div className="p-2 rounded bg-slate-950 font-mono text-[10px] text-slate-300">
                      <span className="text-slate-500 block mb-0.5">Respuesta Backend simulada:</span>
                      <pre className="text-emerald-400 overflow-x-auto">
                        {JSON.stringify(trace.response, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: INSPECTOR DE TRAMA HTTP (RAW PAYLOAD REAL) */}
        {activeTab === 'raw_payload' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono block">
                  Petición HTTP & Respuesta Real
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {httpInspection ? `${httpInspection.method} · Status ${httpInspection.status || 200}` : 'Sin llamadas aún'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPayload}
                disabled={!httpInspection}
                icon={copiedPayload ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              >
                {copiedPayload ? 'Copiado' : 'Copiar'}
              </Button>
            </div>

            {httpInspection ? (
              <div className="space-y-3 font-mono text-[11px]">
                {/* Endpoint Bar */}
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                    <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-800 font-mono">
                      {httpInspection.method}
                    </span>
                    <span className="text-slate-300 truncate">{httpInspection.endpoint}</span>
                  </div>
                  <div className="text-slate-500 text-[9px]">
                    Timestamp: {httpInspection.timestamp} · Status: {httpInspection.status} {httpInspection.statusText}
                  </div>
                </div>

                {/* HTTP Request Body */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Payload de Entrada (Enviado al LLM)
                  </span>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 overflow-x-auto max-h-52">
                    <pre className="text-sky-300 whitespace-pre-wrap">
                      {JSON.stringify(httpInspection.requestBody, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* HTTP Response Body */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Respuesta Bruta (Recibida de la API)
                  </span>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 overflow-x-auto max-h-56">
                    <pre className="text-emerald-300 whitespace-pre-wrap">
                      {JSON.stringify(httpInspection.responseBody, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 space-y-1">
                <Code2 className="w-6 h-6 text-slate-600 mx-auto" />
                <p>Aún no se ha realizado ninguna llamada HTTP real.</p>
                <p className="text-[11px] text-slate-500">Envía un mensaje en el chat para inspeccionar la trama completa.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

/**
 * Organism: ConfigDashboard (Full-Screen View)
 * Panel administrativo completo para configurar API Keys, líneas de producto, motor, prompts, RAG y memoria
 */
export const ConfigDashboard: React.FC<{
  geminiApiKey: string;
  onSaveGeminiApiKey: (key: string) => void;
  openaiApiKey: string;
  onSaveOpenaiApiKey: (key: string) => void;
  provider: EngineProvider;
  onSelectProvider: (p: EngineProvider) => void;
  selectedModel: string;
  onSelectModel: (m: string) => void;
  products: Record<string, ProductLineProfile>;
  activeProductKey: string;
  onSelectProductKey: (key: string) => void;
  onUpdateProductProfile: (key: string, updated: Partial<ProductLineProfile>) => void;
  memoryThreshold: number;
  onChangeMemoryThreshold: (val: number) => void;
  generalPolicy: string;
  onChangeGeneralPolicy: (policy: string) => void;
  onSaveAndReturnToChat: () => void;
}> = ({
  geminiApiKey,
  onSaveGeminiApiKey,
  openaiApiKey,
  onSaveOpenaiApiKey,
  provider,
  onSelectProvider,
  selectedModel,
  onSelectModel,
  products,
  activeProductKey,
  onSelectProductKey,
  onUpdateProductProfile,
  memoryThreshold,
  onChangeMemoryThreshold,
  generalPolicy,
  onChangeGeneralPolicy,
  onSaveAndReturnToChat
}) => {
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [geminiInput, setGeminiInput] = useState(geminiApiKey);
  const [openaiInput, setOpenaiInput] = useState(openaiApiKey);
  const [testStatus, setTestStatus] = useState<{ running: boolean; success?: boolean; message?: string } | null>(null);
  const [savedSuccessToast, setSavedSuccessToast] = useState(false);

  const activeProfile = products[activeProductKey] || Object.values(products)[0];

  const handleTestConnection = async () => {
    setTestStatus({ running: true });
    try {
      if (provider === 'gemini') {
        if (!geminiInput.trim()) throw new Error('Ingresa tu Gemini API Key primero.');
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${encodeURIComponent(geminiInput.trim())}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Responde estrictamente "OK_FIDEL"' }] }]
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message || 'Fallo de autenticación con Gemini.');
        setTestStatus({ running: false, success: true, message: '¡Conexión exitosa con Google Gemini API!' });
      } else {
        if (!openaiInput.trim()) throw new Error('Ingresa tu OpenAI API Key primero.');
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiInput.trim()}`
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [{ role: 'user', content: 'Ping' }],
            max_tokens: 5
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message || 'Fallo de autenticación con OpenAI.');
        setTestStatus({ running: false, success: true, message: '¡Conexión exitosa con OpenAI API!' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestStatus({ running: false, success: false, message: msg });
    }
  };

  const handleSave = () => {
    onSaveGeminiApiKey(geminiInput.trim());
    onSaveOpenaiApiKey(openaiInput.trim());
    setSavedSuccessToast(true);
    setTimeout(() => {
      setSavedSuccessToast(false);
      onSaveAndReturnToChat();
    }, 900);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-8 flex justify-center">
      <div className="w-full max-w-5xl space-y-8 pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Settings2 className="w-6 h-6 text-red-500" />
              <h1 className="text-xl font-bold text-white font-mono tracking-tight">
                Panel de Configuración del Agente & Tenant
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Configura tus credenciales reales de API, modelos de lenguaje, directivas del sistema y parámetros de memoria incremental para FIDEL.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleSave}
            icon={savedSuccessToast ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
            className="shadow-lg shadow-red-950/60"
          >
            {savedSuccessToast ? '¡Guardado! Redirigiendo...' : 'Guardar y Volver al Chat'}
          </Button>
        </div>

        {/* SECTION 1: CREDENCIALES DE API */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Key className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider">
                  1. Credenciales de API (Llamadas HTTP Reales)
                </h2>
                <p className="text-xs text-slate-400">
                  Las claves se almacenan localmente en tu navegador de forma segura (`localStorage`).
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testStatus?.running}
              icon={<Zap className="w-3.5 h-3.5 text-amber-400" />}
            >
              {testStatus?.running ? 'Verificando...' : 'Probar Conexión'}
            </Button>
          </div>

          {testStatus && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              testStatus.success
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                : 'bg-rose-950/60 text-rose-300 border-rose-700/60'
            }`}>
              {testStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{testStatus.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Google Gemini Key */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-950/80 border border-slate-800/90">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 font-mono">
                  <span>Google Gemini API Key</span>
                  {geminiInput ? (
                    <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                      Configurada
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-800">
                      Requerida
                    </span>
                  )}
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-red-400 hover:text-red-300 inline-flex items-center gap-1 font-mono hover:underline"
                >
                  Obtener en Google AI Studio
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="relative flex items-center">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiInput}
                  onChange={(e) => setGeminiInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 pr-10 text-xs font-mono text-slate-100 focus:border-red-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-200"
                  title={showGeminiKey ? 'Ocultar' : 'Mostrar'}
                >
                  {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* OpenAI Key */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-950/80 border border-slate-800/90">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 font-mono">
                  <span>OpenAI API Key</span>
                  {openaiInput ? (
                    <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                      Configurada
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                      Opcional
                    </span>
                  )}
                </label>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 font-mono hover:underline"
                >
                  Obtener en OpenAI Platform
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="relative flex items-center">
                <input
                  type={showOpenaiKey ? 'text' : 'password'}
                  value={openaiInput}
                  onChange={(e) => setOpenaiInput(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 pr-10 text-xs font-mono text-slate-100 focus:border-red-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-200"
                  title={showOpenaiKey ? 'Ocultar' : 'Mostrar'}
                >
                  {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: MOTOR Y MODELO ACTIVO */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider">
                2. Motor de IA & Modelo Específico
              </h2>
              <p className="text-xs text-slate-400">
                Selecciona qué proveedor ejecutará las llamadas HTTP de chat y extracción comercial.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Provider Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 font-mono">Proveedor Activo</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    onSelectProvider('gemini');
                    onSelectModel(AVAILABLE_MODELS.gemini[0].id);
                  }}
                  className={`py-2 text-center text-xs font-bold rounded-lg transition-all ${
                    provider === 'gemini'
                      ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Google Gemini
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectProvider('openai');
                    onSelectModel(AVAILABLE_MODELS.openai[0].id);
                  }}
                  className={`py-2 text-center text-xs font-bold rounded-lg transition-all ${
                    provider === 'openai'
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  OpenAI
                </button>
              </div>
            </div>

            {/* Model Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 font-mono">Modelo Seleccionado</label>
              <select
                value={selectedModel}
                onChange={(e) => onSelectModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:border-red-500 focus:outline-none"
              >
                {AVAILABLE_MODELS[provider].map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: SELECTOR DE LÍNEA DE PRODUCTO Y RAG */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-red-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider">
                3. Línea Comercial KrakeDev & Vector Store (RAG)
              </h2>
              <p className="text-xs text-slate-400">
                Selecciona la unidad de negocio activa para configurar sus atributos clave y almacén vectorial.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.keys(products).map((key) => {
              const prof = products[key];
              const isSelected = activeProductKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelectProductKey(key)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-red-950/40 border-red-500 text-slate-100 shadow-md shadow-red-950/20'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-100">{prof.name.split('—')[1]}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isSelected ? 'bg-red-900 text-red-300' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {prof.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{prof.tagline}</p>
                </button>
              );
            })}
          </div>

          {/* RAG Store Input */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <label className="text-xs font-semibold text-slate-300 font-mono flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              Vector Store ID (file_search_store_names / vector_store_ids)
            </label>
            <input
              type="text"
              value={activeProfile.ragStoreId}
              onChange={(e) => onUpdateProductProfile(activeProductKey, { ragStoreId: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:border-red-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-500">
              Almacén vectorial asignado para la recuperación de contenido y folletos comerciales en esta línea.
            </span>
          </div>
        </div>

        {/* SECTION 4: SYSTEM INSTRUCTIONS & POLÍTICA INMUTABLE */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-red-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider">
                4. Comportamiento & System Instructions
              </h2>
              <p className="text-xs text-slate-400">
                Directivas canónicas que condicionan el tono consultivo y el protocolo comercial de Fidel.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Specific Profile Prompt */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 font-mono">
                Instrucciones Específicas de la Línea: {activeProfile.name}
              </label>
              <textarea
                value={activeProfile.systemInstructions}
                onChange={(e) => onUpdateProductProfile(activeProductKey, { systemInstructions: e.target.value })}
                rows={5}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:border-red-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* General Policy */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 font-mono">
                Política General Inmutable de Clear Minds / KrakeDev
              </label>
              <textarea
                value={generalPolicy}
                onChange={(e) => onChangeGeneralPolicy(e.target.value)}
                rows={5}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:border-red-500 focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: PARÁMETRO DE MEMORIA INCREMENTAL (UMBRAL N) */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider">
                  5. Parámetros de Memoria Incremental (Umbral N)
                </h2>
                <p className="text-xs text-slate-400">
                  Cantidad de turnos no resumidos antes de activar la llamada real de síntesis y compactación en BDD.
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-lg bg-amber-950 text-amber-300 border border-amber-800/80 font-bold font-mono text-sm">
              Cada {memoryThreshold} mensajes
            </span>
          </div>

          <div className="space-y-2 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <input
              type="range"
              min={2}
              max={20}
              step={1}
              value={memoryThreshold}
              onChange={(e) => onChangeMemoryThreshold(Number(e.target.value))}
              className="w-full accent-red-500 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-500 font-mono">
              <span>2 (Alta frecuencia de compactación)</span>
              <span>5 (Pruebas ágiles recomendadas)</span>
              <span>10 (Estándar producción)</span>
              <span>20 (Historial extenso)</span>
            </div>
          </div>
        </div>

        {/* Bottom Save Action */}
        <div className="flex justify-end pt-4">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSave}
            icon={savedSuccessToast ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
            className="w-full sm:w-auto shadow-xl shadow-red-950/60"
          >
            {savedSuccessToast ? '¡Guardado! Volviendo al Chat...' : 'Guardar y Volver al Chat'}
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   7. ROOT FIDEL APPLICATION COMPONENT (Atomic Design Tier 4 & 5)
   ========================================================================== */

export default function App() {
  // Navigation State: Dual Views
  const [currentView, setCurrentView] = useState<ActiveAppView>('chat_lab');

  // API Credentials with localStorage persistence & env fallback
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return (
      localStorage.getItem('fidel_gemini_api_key') ||
      (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GEMINI_API_KEY ||
      (import.meta as unknown as { env?: Record<string, string> }).env?.GEMINI_API_KEY ||
      ''
    );
  });

  const [openaiApiKey, setOpenaiApiKey] = useState<string>(() => {
    return (
      localStorage.getItem('fidel_openai_api_key') ||
      (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_OPENAI_API_KEY ||
      ''
    );
  });

  // Engine Provider & Model
  const [provider, setProvider] = useState<EngineProvider>(() => {
    return (localStorage.getItem('fidel_selected_provider') as EngineProvider) || 'gemini';
  });

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('fidel_selected_model') || 'gemini-2.0-flash';
  });

  // Product Profiles & Active Tenant
  const [products, setProducts] = useState<Record<string, ProductLineProfile>>(() => {
    const saved = localStorage.getItem('fidel_product_profiles');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return DEFAULT_PRODUCT_PROFILES;
  });

  const [activeProductKey, setActiveProductKey] = useState<string>(() => {
    return localStorage.getItem('fidel_active_product') || 'cursos';
  });

  // Memory & General Policy
  const [memoryThreshold, setMemoryThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('fidel_memory_threshold');
    return saved ? Number(saved) : 5;
  });

  const [generalPolicy, setGeneralPolicy] = useState<string>(() => {
    return localStorage.getItem('fidel_general_policy') || IMMUTABLE_GENERAL_POLICY;
  });

  // Session & Chat Stream State
  const [sessionId, setSessionId] = useState<string>('TEST-WA-099');
  const [conversationState, setConversationState] = useState<ConversationState>('AI_ACTIVE');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('whatsapp');
  const [channel, setChannel] = useState<'whatsapp' | 'web'>('whatsapp');
  const [activeObservabilityTab, setActiveObservabilityTab] = useState<'extraction' | 'memory' | 'tools' | 'raw_payload'>('extraction');

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-0',
      author: 'fidel',
      content: '¡Hola! Soy Fidel, asesor comercial de KrakeDev. ¿En qué programa o solución tecnológica te gustaría capacitarte o implementar hoy?',
      timestamp: new Date().toISOString(),
      timeLabel: '10:00 AM'
    }
  ]);

  const [isTyping, setIsTyping] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [conversationSummary, setConversationSummary] = useState<string>('');
  const [lastSummarizedId, setLastSummarizedId] = useState<string>('');
  const [toolTraces, setToolTraces] = useState<ToolCallTrace[]>([]);
  const [httpInspection, setHttpInspection] = useState<HttpPayloadInspectorData | null>(null);

  const [lastExtraction, setLastExtraction] = useState<CanonicalExtractionPayload | null>({
    respuesta_whatsapp: '¡Hola! Soy Fidel, asesor comercial de KrakeDev...',
    datos_extraidos: {},
    senales_interes: { intencion_compra: 'sin_datos', objecion: 'ninguna' },
    accion_sugerida: 'continuar_cualificacion'
  });

  // Persistence helpers
  const handleSaveGeminiApiKey = (key: string) => {
    setGeminiApiKey(key);
    localStorage.setItem('fidel_gemini_api_key', key);
  };

  const handleSaveOpenaiApiKey = (key: string) => {
    setOpenaiApiKey(key);
    localStorage.setItem('fidel_openai_api_key', key);
  };

  const handleSelectProvider = (p: EngineProvider) => {
    setProvider(p);
    localStorage.setItem('fidel_selected_provider', p);
  };

  const handleSelectModel = (m: string) => {
    setSelectedModel(m);
    localStorage.setItem('fidel_selected_model', m);
  };

  const handleUpdateProductProfile = (key: string, updated: Partial<ProductLineProfile>) => {
    setProducts(prev => {
      const next = { ...prev, [key]: { ...prev[key], ...updated } };
      localStorage.setItem('fidel_product_profiles', JSON.stringify(next));
      return next;
    });
  };

  const handleChangeMemoryThreshold = (val: number) => {
    setMemoryThreshold(val);
    localStorage.setItem('fidel_memory_threshold', String(val));
  };

  const handleChangeGeneralPolicy = (policy: string) => {
    setGeneralPolicy(policy);
    localStorage.setItem('fidel_general_policy', policy);
  };

  const activeProfile = products[activeProductKey] || DEFAULT_PRODUCT_PROFILES.cursos;
  const currentApiKey = provider === 'gemini' ? geminiApiKey : openaiApiKey;
  const hasApiKey = Boolean(currentApiKey && currentApiKey.trim() !== '');

  // Toggle Human vs AI Control
  const handleToggleControl = () => {
    if (conversationState === 'AI_ACTIVE') {
      setConversationState('HUMAN_ACTIVE');
      setMessages(prev => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          author: 'system',
          content: 'Control transferido al Asesor Humano. Fidel ha pausado sus llamadas automáticas a la API.',
          timestamp: new Date().toISOString(),
          timeLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else {
      setConversationState('AI_ACTIVE');
      setMessages(prev => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          author: 'system',
          content: 'Control devuelto a Fidel IA. El agente retoma la atención comercial con memoria intacta.',
          timestamp: new Date().toISOString(),
          timeLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  // Reset entire test session
  const handleResetSession = () => {
    const newId = `TEST-WA-${Math.floor(100 + Math.random() * 900)}`;
    setSessionId(newId);
    setConversationState('AI_ACTIVE');
    setToolTraces([]);
    setConversationSummary('');
    setLastSummarizedId('');
    setHttpInspection(null);
    setMessages([
      {
        id: `msg-${Date.now()}`,
        author: 'fidel',
        content: `¡Hola! Soy Fidel, asesor comercial de ${activeProfile.name}. ¿En qué podemos apoyarte hoy?`,
        timestamp: new Date().toISOString(),
        timeLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setLastExtraction({
      respuesta_whatsapp: '¡Hola! Soy Fidel...',
      datos_extraidos: {},
      senales_interes: { intencion_compra: 'sin_datos', objecion: 'ninguna' },
      accion_sugerida: 'continuar_cualificacion'
    });
  };

  // Unsummarized messages count
  const unsummarizedCount = useMemo(() => {
    if (!lastSummarizedId) return messages.filter(m => m.author !== 'system').length;
    const lastIdx = messages.findIndex(m => m.id === lastSummarizedId);
    if (lastIdx === -1) return messages.filter(m => m.author !== 'system').length;
    return messages.slice(lastIdx + 1).filter(m => m.author !== 'system').length;
  }, [messages, lastSummarizedId]);

  // Real incremental summary execution
  const runIncrementalSummary = async (msgsToSummarize: ChatMessage[]) => {
    if (!hasApiKey) return;
    setIsSummarizing(true);
    try {
      const summaryResult = await executeRealSummaryCall({
        provider,
        apiKey: currentApiKey,
        model: selectedModel,
        messagesToSummarize: msgsToSummarize
      });

      const formattedSummary = `[RESUMEN BDD ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]: ${summaryResult}`;

      setConversationSummary(prev => (prev ? `${prev}\n\n${formattedSummary}` : formattedSummary));

      const lastId = msgsToSummarize[msgsToSummarize.length - 1]?.id;
      if (lastId) setLastSummarizedId(lastId);

      // Mark older messages as summarized
      setMessages(prev =>
        prev.map(m => {
          if (msgsToSummarize.some(sm => sm.id === m.id)) {
            return { ...m, summarized: true };
          }
          return m;
        })
      );

      // Inject system divider notice
      setMessages(prev => [
        ...prev,
        {
          id: `summary-event-${Date.now()}`,
          author: 'system',
          content: `📦 Resumen incremental real generado (${msgsToSummarize.length} mensajes compactados en BDD vía ${provider.toUpperCase()}). Ventana de contexto reducida para el LLM.`,
          timestamp: new Date().toISOString(),
          timeLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error('Error generando resumen incremental real:', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  // Send message handler with real HTTP calls
  const handleSendMessage = async (text: string) => {
    const isHuman = conversationState === 'HUMAN_ACTIVE';
    const clientMsgId = `client-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: clientMsgId,
      author: isHuman ? 'human_agent' : 'client',
      content: text,
      timestamp: new Date().toISOString(),
      timeLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextMessages = [...messages, newMsg];
    setMessages(nextMessages);

    // If human is active, Fidel stays silent
    if (isHuman) return;

    // Check if API key is present
    if (!hasApiKey) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            author: 'system',
            content: `⚠️ No se puede realizar la llamada a la API: Falta configurar tu API Key para ${provider.toUpperCase()}. Haz clic en "Configuración & Tenant" en la barra superior para agregarla.`,
            timestamp: new Date().toISOString(),
            timeLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 300);
      return;
    }

    setIsTyping(true);

    try {
      // Filter only unsummarized messages for the active LLM context
      const unsummarizedMsgs = nextMessages.filter(m => m.author !== 'system' && !m.summarized);

      let extractionResult: CanonicalExtractionPayload;
      let inspectionData: HttpPayloadInspectorData;

      if (provider === 'gemini') {
        const res = await executeRealGeminiCall({
          apiKey: geminiApiKey,
          model: selectedModel,
          generalPolicy,
          productPrompt: activeProfile.systemInstructions,
          conversationSummary,
          unsummarizedMessages: unsummarizedMsgs
        });
        extractionResult = res.extraction;
        inspectionData = res.httpInspection;
      } else {
        const res = await executeRealOpenAiCall({
          apiKey: openaiApiKey,
          model: selectedModel,
          generalPolicy,
          productPrompt: activeProfile.systemInstructions,
          conversationSummary,
          unsummarizedMessages: unsummarizedMsgs
        });
        extractionResult = res.extraction;
        inspectionData = res.httpInspection;
      }

      setHttpInspection(inspectionData);

      // Check if function calling should be simulated/recorded based on intent or suggested action
      let toolSnapshot: { toolName: string; summary: string } | undefined = undefined;
      const lowerResp = (extractionResult.respuesta_whatsapp + ' ' + (extractionResult.accion_sugerida || '')).toLowerCase();
      
      if (lowerResp.includes('agendar_cita') || lowerResp.includes('agendado') || extractionResult.accion_sugerida === 'agendar_cita') {
        const fakeId = `CITA-KRAKE-${Math.floor(100 + Math.random() * 900)}`;
        const trace: ToolCallTrace = {
          id: `trace-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          toolName: 'agendar_cita',
          parameters: {
            producto: activeProfile.name,
            fecha_hora: 'Solicitud detectada en turno',
            canal: 'Google Meet'
          },
          response: {
            estado: 'confirmada',
            cita_id: fakeId,
            enlace_meet: 'https://meet.google.com/krk-dev-fidel'
          },
          latencyMs: Math.floor(140 + Math.random() * 60)
        };
        setToolTraces(prev => [trace, ...prev]);
        toolSnapshot = { toolName: 'agendar_cita', summary: fakeId };
      } else if (lowerResp.includes('consultar_precio') || lowerResp.includes('cuotas') || extractionResult.accion_sugerida === 'enviar_cotizacion') {
        const trace: ToolCallTrace = {
          id: `trace-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          toolName: 'consultar_precio',
          parameters: { linea: activeProfile.id },
          response: {
            moneda: 'USD',
            precio_oficial: '$240',
            cuotas: '3 cuotas de $80'
          },
          latencyMs: 95
        };
        setToolTraces(prev => [trace, ...prev]);
        toolSnapshot = { toolName: 'consultar_precio', summary: '$240 USD' };
      }

      const fidelMsgId = `fidel-${Date.now()}`;
      const fidelMsg: ChatMessage = {
        id: fidelMsgId,
        author: 'fidel',
        content: extractionResult.respuesta_whatsapp,
        timestamp: new Date().toISOString(),
        timeLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolCall: toolSnapshot,
        extractionSnapshot: extractionResult
      };

      setMessages(prev => {
        const updated = [...prev, fidelMsg];
        // Check if memory threshold reached for automatic incremental summarization
        const eligible = updated.filter(m => m.author !== 'system' && !m.summarized);
        if (eligible.length >= memoryThreshold) {
          setTimeout(() => runIncrementalSummary(eligible), 300);
        }
        return updated;
      });

      setLastExtraction(extractionResult);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Error al llamar a la API real:', msg);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          author: 'system',
          content: `❌ Error en llamada HTTP real: ${msg}. Revisa tu API Key y cuota en la pestaña de Configuración.`,
          timestamp: new Date().toISOString(),
          timeLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. Header Navbar Organism with Dual View Switcher */}
      <HeaderNavbar
        currentView={currentView}
        onChangeView={setCurrentView}
        conversationState={conversationState}
        onToggleControl={handleToggleControl}
        sessionId={sessionId}
        onResetSession={handleResetSession}
        previewMode={previewMode}
        onChangePreviewMode={setPreviewMode}
        provider={provider}
        model={selectedModel}
        hasApiKey={hasApiKey}
      />

      {/* 2. Main Content Area */}
      {currentView === 'chat_lab' ? (
        /* Pestaña 1: Laboratorio de Chat & Observabilidad (Limpio, sin el sidebar izquierdo apretado) */
        <div className="flex-1 flex overflow-hidden relative">
          <ChatStreamArea
            messages={messages}
            isTyping={isTyping}
            onSendMessage={handleSendMessage}
            conversationState={conversationState}
            suggestedPrompts={activeProfile.suggestedPrompts}
            previewMode={previewMode}
            channel={channel}
            onToggleChannel={() => setChannel(prev => (prev === 'whatsapp' ? 'web' : 'whatsapp'))}
            hasApiKey={hasApiKey}
            onGoToConfig={() => setCurrentView('config_center')}
            activeProvider={provider}
          />

          <ObservabilityPanel
            activeTab={activeObservabilityTab}
            onSelectTab={setActiveObservabilityTab}
            lastExtraction={lastExtraction}
            activeProfile={activeProfile}
            conversationSummary={conversationSummary}
            toolTraces={toolTraces}
            httpInspection={httpInspection}
            onForceSummary={() => {
              const eligible = messages.filter(m => m.author !== 'system' && !m.summarized);
              if (eligible.length > 0) runIncrementalSummary(eligible);
            }}
            isSummarizing={isSummarizing}
            totalMessagesCount={messages.filter(m => m.author !== 'system').length}
            unsummarizedCount={unsummarizedCount}
            memoryThreshold={memoryThreshold}
            provider={provider}
            model={selectedModel}
          />
        </div>
      ) : (
        /* Pestaña 2: Configuración del Agente & Tenant (Pantalla Completa Organizada) */
        <ConfigDashboard
          geminiApiKey={geminiApiKey}
          onSaveGeminiApiKey={handleSaveGeminiApiKey}
          openaiApiKey={openaiApiKey}
          onSaveOpenaiApiKey={handleSaveOpenaiApiKey}
          provider={provider}
          onSelectProvider={handleSelectProvider}
          selectedModel={selectedModel}
          onSelectModel={handleSelectModel}
          products={products}
          activeProductKey={activeProductKey}
          onSelectProductKey={setActiveProductKey}
          onUpdateProductProfile={handleUpdateProductProfile}
          memoryThreshold={memoryThreshold}
          onChangeMemoryThreshold={handleChangeMemoryThreshold}
          generalPolicy={generalPolicy}
          onChangeGeneralPolicy={handleChangeGeneralPolicy}
          onSaveAndReturnToChat={() => setCurrentView('chat_lab')}
        />
      )}
    </div>
  );
}
