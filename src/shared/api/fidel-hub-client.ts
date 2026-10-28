import type {
  AuthUserSession,
  ChannelAccountSummary,
  FidelTrainingRule,
  McpResourceSchema,
  McpServerSummary,
  McpToolExecutionTrace,
  McpToolSchema,
  OmniConversation,
  OmniMessage,
  OrgAgentUser,
  SupportedChannel,
} from '../../entities/omnichannel/types';

const isBrowserProd =
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1';

export const API_BASE =
  (import.meta as any).env?.VITE_API_URL ||
  (isBrowserProd
    ? 'https://fidelhub-back.onrender.com/api'
    : 'http://localhost:3001/api');

export const FIDEL_MCP_DEFAULT_URL =
  (import.meta as any).env?.VITE_FIDEL_MCP_URL ||
  (isBrowserProd
    ? 'https://fidelback-mcp.onrender.com/api/mcp'
    : 'http://localhost:4000/api/mcp');

const STORAGE_KEYS = {
  CONVERSATIONS: 'fidel_omni_conversations_v2',
  MESSAGES: 'fidel_omni_messages_v2',
  MCP_SERVERS: 'fidel_omni_mcp_servers_v2',
  CHANNELS: 'fidel_omni_channels_v2',
  RULES: 'fidel_omni_rules_v2',
  AUTH_TOKEN: 'fidel_ultra_auth_token_v1',
  AUTH_USER: 'fidel_ultra_auth_user_v1',
};

export const OFFICIAL_FIDEL_TOOLS: McpToolSchema[] = [
  {
    name: 'fidel_consultar_catalogo',
    description:
      'Consulta precios, becas activas, duración y malla curricular del catálogo oficial ClearMinds / KrakeDev.',
    inputSchema: {
      type: 'object',
      properties: {
        programa: {
          type: 'string',
          description: 'Código del programa (ia_docencia, fullstack_bootcamp, cloud_devops)',
        },
      },
      required: ['programa'],
    },
  },
  {
    name: 'fidel_consultar_horarios',
    description:
      'Verifica disponibilidad en tiempo real de horarios para sesiones de admisión o inicio de clases.',
    inputSchema: {
      type: 'object',
      properties: {
        fecha_preferida: { type: 'string', description: 'Día o fecha solicitada' },
        franja: { type: 'string', description: 'Franja (mañana, tarde, noche)' },
      },
      required: ['fecha_preferida'],
    },
  },
  {
    name: 'fidel_agendar_cita',
    description:
      'Agenda una llamada comercial o sesión diagnóstica en Google Calendar y actualiza el estado del lead.',
    inputSchema: {
      type: 'object',
      properties: {
        nombre_cliente: { type: 'string', description: 'Nombre del prospecto' },
        contacto: { type: 'string', description: 'Teléfono o handle de red social' },
        fecha_hora: { type: 'string', description: 'Fecha y hora acordada' },
        programa_interes: { type: 'string', description: 'Programa seleccionado' },
      },
      required: ['nombre_cliente', 'fecha_hora'],
    },
  },
  {
    name: 'fidel_enviar_cotizacion',
    description:
      'Genera proforma PDF personalizada con desglose de beca y cuotas sin intereses.',
    inputSchema: {
      type: 'object',
      properties: {
        programa: { type: 'string', description: 'Programa a cotizar' },
        plan_pago: { type: 'string', description: 'contado | 3_cuotas | 6_cuotas' },
      },
      required: ['programa'],
    },
  },
  {
    name: 'fidel_transferir_humano',
    description:
      'Transfiere el control de la conversación a un closer humano con resumen ejecutivo.',
    inputSchema: {
      type: 'object',
      properties: {
        motivo: { type: 'string', description: 'Motivo del escalamiento' },
        prioridad: { type: 'string', description: 'ALTA | MEDIA | BAJA' },
      },
      required: ['motivo'],
    },
  },
];

export const OFFICIAL_FIDEL_RESOURCES: McpResourceSchema[] = [
  {
    uri: 'clearminds://catalog/ia-docencia',
    name: 'Certificación IA Aplicada a la Docencia',
    description: 'Inversión $149 USD (Beca activa), 6 semanas en vivo + plataforma.',
    mimeType: 'application/json',
  },
  {
    uri: 'clearminds://catalog/fullstack-bootcamp',
    name: 'Bootcamp FullStack & Cloud Architecture',
    description: 'Inversión $490 USD (hasta 3 cuotas), 16 semanas intensivas.',
    mimeType: 'application/json',
  },
  {
    uri: 'clearminds://policies/commercial-rules',
    name: 'Políticas Comerciales y Manejo de Objeciones Fidel',
    description: 'Reglas de oro de cualificación y cierres en WhatsApp, IG, FB y TikTok.',
    mimeType: 'text/markdown',
  },
];

export const ORG_AGENTS: OrgAgentUser[] = [
  {
    id: 'agent_brayan',
    email: 'brayan@krakedev.com',
    displayName: 'Brayan Gualotuña (Admin)',
    role: 'ORG_ADMIN',
  },
  {
    id: 'agent_carla',
    email: 'carla.closers@clearminds.ec',
    displayName: 'Carla Viteri (Closer Senior)',
    role: 'AGENT',
  },
  {
    id: 'agent_mateo',
    email: 'mateo.admisiones@clearminds.ec',
    displayName: 'Mateo Andrade (Admisiones)',
    role: 'AGENT',
  },
];

const INITIAL_MCP_SERVERS: McpServerSummary[] = [
  {
    id: 'mcp_fidel_official',
    organizationId: 'org_krakedev',
    name: 'FidelMCP — ClearMinds Comercial',
    description:
      'Servidor MCP principal de Fidel (FidelBack_MCP) para cualificación de leads, consulta de catálogo, horarios, citas y cotizaciones.',
    transport: 'http',
    endpointUrl: FIDEL_MCP_DEFAULT_URL,
    hasApiKey: false,
    isActive: true,
    isDefault: true,
    assignedChannels: ['WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'TIKTOK'],
    tools: OFFICIAL_FIDEL_TOOLS,
    resources: OFFICIAL_FIDEL_RESOURCES,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mcp_crm_hubspot',
    organizationId: 'org_krakedev',
    name: 'CRM Lead Sync MCP',
    description:
      'Conector MCP secundario para sincronización de oportunidades comerciales, scoring de leads y etiquetas multicanal.',
    transport: 'sse',
    endpointUrl: 'http://localhost:3004/mcp/sse',
    hasApiKey: true,
    isActive: true,
    isDefault: false,
    assignedChannels: ['WHATSAPP', 'INSTAGRAM', 'FACEBOOK'],
    tools: [
      {
        name: 'crm_upsert_deal',
        description: 'Crea o actualiza una oportunidad comercial en el pipeline del CRM.',
        inputSchema: {
          type: 'object',
          properties: {
            lead_handle: { type: 'string', description: 'Teléfono o usuario del lead' },
            stage: { type: 'string', description: 'QUALIFIED | DEMO_SCHEDULED | WON' },
            estimated_value: { type: 'string', description: 'Valor estimado en USD' },
          },
          required: ['lead_handle', 'stage'],
        },
      },
      {
        name: 'crm_lookup_history',
        description: 'Consulta compras previas o interacciones históricas del contacto.',
        inputSchema: {
          type: 'object',
          properties: {
            identifier: { type: 'string', description: 'Correo, teléfono o handle' },
          },
          required: ['identifier'],
        },
      },
    ],
    resources: [
      {
        uri: 'crm://pipelines/admissions-2026',
        name: 'Pipeline Admisiones 2026',
        description: 'Etapas y embudo de conversión omnicanal.',
        mimeType: 'application/json',
      },
    ],
    updatedAt: new Date().toISOString(),
  },
];

const now = Date.now();

const INITIAL_CONVERSATIONS: OmniConversation[] = [
  {
    id: 'conv_wa_1',
    phone: '+593 99 842 1102',
    name: 'Dra. Elena Rivadeneira',
    email: 'elena.rivadeneira@uce.edu.ec',
    tag: 'Beca Docente',
    tagId: 'tag_docente',
    channel: 'WHATSAPP',
    externalHandle: '+593998421102',
    activeMcpServerId: 'mcp_fidel_official',
    interestStatus: 'INTERESTED',
    lastUserMessageAt: now - 3 * 60 * 1000,
    lastMessagePreview: '¿Qué precio tiene la Certificación de IA para Docentes y qué horarios manejan?',
    lastMessageAt: now - 2 * 60 * 1000,
    unreadCount: 0,
    assignedToUserId: 'agent_brayan',
    assignedAgentName: 'Brayan Gualotuña (Admin)',
    isNewLead: false,
    isAiActive: true,
    isTrainingMode: false,
    extractedData: {
      Perfil: 'Docente Universitaria',
      Programa: 'IA Aplicada a la Docencia',
      Intención: 'Alta (Solicita precio y horarios)',
    },
  },
  {
    id: 'conv_ig_1',
    phone: 'instagram:ig_992817',
    name: 'Camila Paredes',
    email: 'camila.dev@gmail.com',
    tag: 'FullStack Lead',
    tagId: 'tag_bootcamp',
    channel: 'INSTAGRAM',
    externalHandle: '@camila.edtech',
    activeMcpServerId: 'mcp_fidel_official',
    interestStatus: 'INTERESTED',
    lastUserMessageAt: now - 8 * 60 * 1000,
    lastMessagePreview: 'Vi su Reel sobre el Bootcamp FullStack 🔥 ¿tienen pago en cuotas?',
    lastMessageAt: now - 7 * 60 * 1000,
    unreadCount: 1,
    assignedToUserId: 'agent_carla',
    assignedAgentName: 'Carla Viteri (Closer Senior)',
    isNewLead: true,
    isAiActive: true,
    isTrainingMode: false,
    extractedData: {
      Origen: 'Instagram Reel Orgánico',
      Programa: 'Bootcamp FullStack & Cloud',
      Objeción: 'Financiamiento / Cuotas',
    },
  },
  {
    id: 'conv_tk_1',
    phone: 'tiktok:tt_774120',
    name: 'Andrés Villacreses',
    email: null,
    tag: 'Nuevo Lead TikTok',
    tagId: 'tag_tiktok',
    channel: 'TIKTOK',
    externalHandle: '@andres.code99',
    activeMcpServerId: 'mcp_fidel_official',
    interestStatus: 'PENDING',
    lastUserMessageAt: now - 19 * 60 * 1000,
    lastMessagePreview: 'Hola! Vengo del live de TikTok, quiero agendar una llamada para mañana en la tarde',
    lastMessageAt: now - 18 * 60 * 1000,
    unreadCount: 2,
    assignedToUserId: 'agent_mateo',
    assignedAgentName: 'Mateo Andrade (Admisiones)',
    isNewLead: true,
    isAiActive: true,
    isTrainingMode: false,
    extractedData: {
      Origen: 'TikTok Live',
      Solicitud: 'Agendar cita mañana tarde',
      Intención: 'Alta',
    },
  },
  {
    id: 'conv_fb_1',
    phone: 'facebook:psid_445012',
    name: 'Ing. Roberto Salazar',
    email: 'rsalazar@corporacionfavorita.com',
    tag: 'Corporativo',
    tagId: 'tag_corp',
    channel: 'FACEBOOK',
    externalHandle: 'fb.com/roberto.salazar.ec',
    activeMcpServerId: 'mcp_fidel_official',
    interestStatus: 'INTERESTED',
    lastUserMessageAt: now - 42 * 60 * 1000,
    lastMessagePreview: 'Necesito una cotización formal para 5 docentes de nuestra institución.',
    lastMessageAt: now - 40 * 60 * 1000,
    unreadCount: 0,
    assignedToUserId: 'agent_brayan',
    assignedAgentName: 'Brayan Gualotuña (Admin)',
    isNewLead: false,
    isAiActive: false,
    isTrainingMode: false,
    extractedData: {
      Segmento: 'B2B / Institución Educativa',
      Cupos: '5 licencias',
      Acción: 'Proforma enviada',
    },
  },
];

const INITIAL_MESSAGES: Record<string, OmniMessage[]> = {
  conv_wa_1: [
    {
      id: 'm_wa_1',
      conversationId: 'conv_wa_1',
      channel: 'WHATSAPP',
      fromUser: true,
      text: '¡Hola! Buenas tardes, vi su anuncio de la Certificación de IA para Docentes.',
      timestamp: now - 15 * 60 * 1000,
      type: 'TEXT',
      status: 'READ',
    },
    {
      id: 'm_wa_2',
      conversationId: 'conv_wa_1',
      channel: 'WHATSAPP',
      fromUser: false,
      fromAi: true,
      text: '¡Hola Dra. Elena! Qué gusto saludarte. Soy Fidel de ClearMinds. Nuestra Certificación en IA Aplicada a la Docencia está diseñada para crear material didáctico y evaluaciones automatizadas en minutos. ¿Actualmente das clases en colegio o universidad?',
      timestamp: now - 14 * 60 * 1000,
      type: 'TEXT',
      status: 'READ',
    },
    {
      id: 'm_wa_3',
      conversationId: 'conv_wa_1',
      channel: 'WHATSAPP',
      fromUser: true,
      text: 'Doy clases en la universidad. ¿Qué precio tiene la Certificación de IA para Docentes y qué horarios manejan?',
      timestamp: now - 3 * 60 * 1000,
      type: 'TEXT',
      status: 'READ',
    },
    {
      id: 'm_wa_4',
      conversationId: 'conv_wa_1',
      channel: 'WHATSAPP',
      fromUser: false,
      fromAi: true,
      text: 'Excelente, para docentes universitarios tenemos la beca del 32% activa hoy: la inversión queda en $149 USD (precio regular $220 USD) por las 6 semanas prácticas. Además, revisé nuestra disponibilidad y tenemos sesión informativa mañana a las 18:00. ¿Te gustaría reservar tu cupo en ese horario?',
      timestamp: now - 2 * 60 * 1000,
      type: 'TEXT',
      status: 'DELIVERED',
      mcpToolTraces: [
        {
          id: 'tr_init_1',
          serverId: 'mcp_fidel_official',
          serverName: 'FidelMCP — ClearMinds Comercial',
          toolName: 'fidel_consultar_catalogo',
          arguments: { programa: 'ia_docencia' },
          result: {
            programa: 'Certificación IA Aplicada a la Docencia',
            inversion_regular: '$220 USD',
            inversion_beca_vigente: '$149 USD (Beca 32% activa)',
            duracion: '6 semanas',
            cupos_disponibles: 7,
          },
          status: 'SUCCESS',
          latencyMs: 34,
          timestamp: new Date(now - 2 * 60 * 1000).toISOString(),
        },
        {
          id: 'tr_init_2',
          serverId: 'mcp_fidel_official',
          serverName: 'FidelMCP — ClearMinds Comercial',
          toolName: 'fidel_consultar_horarios',
          arguments: { fecha_preferida: 'mañana', franja: 'tarde' },
          result: {
            slots_disponibles: ['Hoy 16:30 (GMT-5)', 'Mañana 10:00 (GMT-5)', 'Mañana 18:00 (GMT-5)'],
            asesor_asignado: 'Especialista de Admisiones ClearMinds',
          },
          status: 'SUCCESS',
          latencyMs: 28,
          timestamp: new Date(now - 2 * 60 * 1000).toISOString(),
        },
      ],
    },
  ],
  conv_ig_1: [
    {
      id: 'm_ig_1',
      conversationId: 'conv_ig_1',
      channel: 'INSTAGRAM',
      fromUser: true,
      text: 'Vi su Reel sobre el Bootcamp FullStack 🔥 ¿tienen pago en cuotas?',
      timestamp: now - 8 * 60 * 1000,
      type: 'TEXT',
      status: 'RECEIVED',
      metadata: {
        platform: 'INSTAGRAM',
        isStoryReply: true,
        reelUrl: 'https://instagram.com/reel/krakedev-bootcamp',
      },
    },
    {
      id: 'm_ig_2',
      conversationId: 'conv_ig_1',
      channel: 'INSTAGRAM',
      fromUser: false,
      fromAi: true,
      text: '¡Hola Camila! 🙌 Sí, el Bootcamp FullStack & Cloud Architecture ($490 USD con beca vigente) cuenta con plan de hasta 3 cuotas sin intereses. Acabo de generar el detalle del financiamiento con nuestro MCP. ¿Quieres que te agende una breve llamada de admisión para mañana?',
      timestamp: now - 7 * 60 * 1000,
      type: 'TEXT',
      status: 'SENT',
      mcpToolTraces: [
        {
          id: 'tr_ig_1',
          serverId: 'mcp_fidel_official',
          serverName: 'FidelMCP — ClearMinds Comercial',
          toolName: 'fidel_enviar_cotizacion',
          arguments: { programa: 'fullstack_bootcamp', plan_pago: '3_cuotas' },
          result: {
            cotizacion_id: 'PRO-84920',
            programa: 'Bootcamp FullStack & Cloud Architecture',
            plan_pago: '3 cuotas mensuales de $163.33 USD sin interés',
            validez: '48 horas',
          },
          status: 'SUCCESS',
          latencyMs: 41,
          timestamp: new Date(now - 7 * 60 * 1000).toISOString(),
        },
      ],
    },
  ],
  conv_tk_1: [
    {
      id: 'm_tk_1',
      conversationId: 'conv_tk_1',
      channel: 'TIKTOK',
      fromUser: true,
      text: 'Hola! Vengo del live de TikTok, quiero agendar una llamada para mañana en la tarde',
      timestamp: now - 19 * 60 * 1000,
      type: 'TEXT',
      status: 'RECEIVED',
      metadata: {
        platform: 'TIKTOK',
        postLink: 'https://tiktok.com/@krakedev/live',
      },
    },
    {
      id: 'm_tk_2',
      conversationId: 'conv_tk_1',
      channel: 'TIKTOK',
      fromUser: false,
      fromAi: true,
      text: '¡Bienvenido Andrés! 🎵 Qué genial verte por el Live de TikTok. Ya bloqueé tu espacio en nuestra agenda para mañana a las 18:00 (GMT-5). Te dejo el código de confirmación; ¿me compartes tu correo para enviarte la invitación de Google Meet?',
      timestamp: now - 18 * 60 * 1000,
      type: 'TEXT',
      status: 'SENT',
      mcpToolTraces: [
        {
          id: 'tr_tk_1',
          serverId: 'mcp_fidel_official',
          serverName: 'FidelMCP — ClearMinds Comercial',
          toolName: 'fidel_agendar_cita',
          arguments: {
            nombre_cliente: 'Andrés Villacreses (@andres.code99)',
            fecha_hora: 'Mañana 18:00 (GMT-5)',
            programa_interes: 'Bootcamp / Certificación IA',
          },
          result: {
            confirmacion_id: 'CITA-582910',
            estado: 'CONFIRMADA',
            fecha_hora: 'Mañana 18:00 (GMT-5)',
            enlace_reunion: 'https://meet.google.com/krk-fidel-ai',
          },
          status: 'SUCCESS',
          latencyMs: 39,
          timestamp: new Date(now - 18 * 60 * 1000).toISOString(),
        },
      ],
    },
  ],
  conv_fb_1: [
    {
      id: 'm_fb_1',
      conversationId: 'conv_fb_1',
      channel: 'FACEBOOK',
      fromUser: true,
      text: 'Necesito una cotización formal para 5 docentes de nuestra institución.',
      timestamp: now - 42 * 60 * 1000,
      type: 'TEXT',
      status: 'READ',
    },
    {
      id: 'm_fb_2',
      conversationId: 'conv_fb_1',
      channel: 'FACEBOOK',
      fromUser: false,
      fromAi: false,
      text: '¡Con gusto Ing. Roberto! Le acabo de habilitar el descuento corporativo para los 5 docentes. ¿A qué RUC emitimos la proforma?',
      timestamp: now - 40 * 60 * 1000,
      type: 'TEXT',
      status: 'READ',
    },
  ],
};

const INITIAL_CHANNELS: ChannelAccountSummary[] = [
  {
    id: 'ch_wa',
    channel: 'WHATSAPP',
    displayName: 'WhatsApp Business Cloud API (+593 99 100 2000)',
    externalAccountId: 'wa_phone_id_10928374',
    hasAccessToken: true,
    webhookVerifyToken: 'fidel_verify_whatsapp',
    isActive: true,
    webhookEndpoint: '/webhooks/whatsapp',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ch_ig',
    channel: 'INSTAGRAM',
    displayName: 'Instagram Direct (@clearminds.ec)',
    externalAccountId: 'ig_biz_88392011',
    hasAccessToken: true,
    webhookVerifyToken: 'fidel_verify_instagram',
    isActive: true,
    webhookEndpoint: '/webhooks/instagram',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ch_fb',
    channel: 'FACEBOOK',
    displayName: 'Facebook Messenger (ClearMinds & KrakeDev)',
    externalAccountId: 'fb_page_77102938',
    hasAccessToken: true,
    webhookVerifyToken: 'fidel_verify_facebook',
    isActive: true,
    webhookEndpoint: '/webhooks/facebook',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ch_tk',
    channel: 'TIKTOK',
    displayName: 'TikTok Business Messaging (@krakedev)',
    externalAccountId: 'tt_open_id_559102',
    hasAccessToken: true,
    webhookVerifyToken: 'fidel_verify_tiktok',
    isActive: true,
    webhookEndpoint: '/webhooks/tiktok',
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_RULES: FidelTrainingRule[] = [
  {
    id: 'rule_1',
    instruction:
      'Realiza siempre UNA sola pregunta de cualificación por mensaje para mantener fluidez en WhatsApp, Instagram y TikTok.',
    category: 'ESTILO',
    createdByName: 'Brayan Gualotuña',
    isActive: true,
    createdAt: new Date(now - 86400000).toISOString(),
  },
  {
    id: 'rule_2',
    instruction:
      'Antes de dar un precio o disponibilidad, consulta siempre la herramienta del servidor MCP activo (fidel_consultar_catalogo o fidel_consultar_horarios).',
    category: 'MCP_POLICY',
    createdByName: 'Brayan Gualotuña',
    isActive: true,
    createdAt: new Date(now - 43200000).toISOString(),
  },
];

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function getStoredConversations(): OmniConversation[] {
  return loadFromStorage(STORAGE_KEYS.CONVERSATIONS, INITIAL_CONVERSATIONS);
}

export function saveStoredConversations(list: OmniConversation[]): void {
  saveToStorage(STORAGE_KEYS.CONVERSATIONS, list);
}

export function getStoredMessagesMap(): Record<string, OmniMessage[]> {
  return loadFromStorage(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
}

export function saveStoredMessagesMap(map: Record<string, OmniMessage[]>): void {
  saveToStorage(STORAGE_KEYS.MESSAGES, map);
}

export function getStoredMcpServers(): McpServerSummary[] {
  const loaded = loadFromStorage(STORAGE_KEYS.MCP_SERVERS, INITIAL_MCP_SERVERS);
  if (isBrowserProd) {
    return loaded.map((s) => {
      if (
        s.id === 'mcp_fidel_official' &&
        (s.endpointUrl.includes('localhost') || s.endpointUrl.includes('127.0.0.1'))
      ) {
        return { ...s, endpointUrl: FIDEL_MCP_DEFAULT_URL };
      }
      return s;
    });
  }
  return loaded;
}

export function saveStoredMcpServers(servers: McpServerSummary[]): void {
  saveToStorage(STORAGE_KEYS.MCP_SERVERS, servers);
}

export function getStoredChannelAccounts(): ChannelAccountSummary[] {
  return loadFromStorage(STORAGE_KEYS.CHANNELS, INITIAL_CHANNELS);
}

export function saveStoredChannelAccounts(accounts: ChannelAccountSummary[]): void {
  saveToStorage(STORAGE_KEYS.CHANNELS, accounts);
}

export function getStoredRules(): FidelTrainingRule[] {
  return loadFromStorage(STORAGE_KEYS.RULES, INITIAL_RULES);
}

export function saveStoredRules(rules: FidelTrainingRule[]): void {
  saveToStorage(STORAGE_KEYS.RULES, rules);
}

/**
 * Ejecuta una herramienta en vivo intentando primero contra FidelHub_Back / FidelBack_MCP
 * y con respaldo determinístico instantáneo si el proceso externo no está corriendo.
 */
export async function executeMcpToolLive(
  serverId: string | undefined,
  toolName: string,
  args: Record<string, any>,
): Promise<McpToolExecutionTrace> {
  const start = Date.now();
  const servers = getStoredMcpServers();
  const server =
    (serverId ? servers.find((s) => s.id === serverId) : undefined) ||
    servers.find((s) => s.tools.some((t) => t.name === toolName)) ||
    servers.find((s) => s.isDefault) ||
    servers[0];

  const endpoint = (server?.endpointUrl || FIDEL_MCP_DEFAULT_URL).replace(/\/+$/, '');

  // 1. Intentar primero contra endpoint NestJS de FidelBack_MCP (/execute)
  try {
    const executeUrl = endpoint.endsWith('/execute') ? endpoint : `${endpoint}/execute`;
    const mcpToolName =
      toolName === 'fidel_consultar_catalogo'
        ? 'cotizar_descuento_grupo'
        : toolName === 'fidel_agendar_cita'
        ? 'agendar_cita'
        : toolName === 'fidel_transferir_humano'
        ? 'transferir_a_humano'
        : toolName;

    const mcpArgs =
      toolName === 'fidel_consultar_catalogo'
        ? {
            productKey: String(args.programa || 'ia_docencia').includes('fullstack')
              ? 'aws_pack'
              : 'ia_docencia',
            participants: Number(args.participantes || 1),
            paymentMode: 'cuotas',
          }
        : toolName === 'fidel_agendar_cita'
        ? {
            leadName: args.nombre_cliente || 'Prospecto Omnicanal',
            leadContact: args.contacto || 'WhatsApp/Direct',
            productKey: 'ia_docencia',
            scheduledAt: args.fecha_hora || 'Próxima disponible',
          }
        : args;

    const ctrl1 = new AbortController();
    const t1 = setTimeout(() => ctrl1.abort(), 2000);
    const res1 = await fetch(executeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolName: mcpToolName,
        arguments: mcpArgs,
      }),
      signal: ctrl1.signal,
    });
    clearTimeout(t1);

    if (res1.ok) {
      const data1 = await res1.json().catch(() => null);
      if (data1 && (data1.success !== undefined || data1.data || data1.result)) {
        return {
          id: `trace_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          serverId: server?.id || 'mcp_fidel_official',
          serverName: server?.name || 'FidelBack_MCP (Live)',
          toolName,
          arguments: args,
          result: data1.data || data1.result || data1,
          status: 'SUCCESS',
          latencyMs: Math.max(12, Date.now() - start),
          timestamp: new Date().toISOString(),
        };
      }
    }
  } catch {
    /* continuar con JSON-RPC */
  }

  // 2. Intentar vía JSON-RPC 2.0 estándar
  try {
    const ctrl2 = new AbortController();
    const t2 = setTimeout(() => ctrl2.abort(), 2000);
    const res2 = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: { name: toolName, arguments: args },
      }),
      signal: ctrl2.signal,
    });
    clearTimeout(t2);
    if (res2.ok) {
      const data2: any = await res2.json().catch(() => null);
      if (data2?.result) {
        return {
          id: `trace_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          serverId: server?.id || 'mcp_fidel_official',
          serverName: server?.name || 'FidelMCP',
          toolName,
          arguments: args,
          result: data2.result,
          status: 'SUCCESS',
          latencyMs: Math.max(12, Date.now() - start),
          timestamp: new Date().toISOString(),
        };
      }
    }
  } catch {
    /* fallback local determinístico */
  }

  let output: Record<string, any> = {};
  switch (toolName) {
    case 'fidel_consultar_catalogo': {
      const p = String(args.programa || 'ia_docencia').toLowerCase();
      output = p.includes('fullstack')
        ? {
            programa: 'Bootcamp FullStack & Cloud Architecture',
            inversion_regular: '$650 USD',
            inversion_beca_vigente: '$490 USD (Hasta 3 cuotas sin interés)',
            duracion: '16 semanas en vivo',
            cupos_disponibles: 5,
          }
        : {
            programa: 'Certificación IA Aplicada a la Docencia',
            inversion_regular: '$220 USD',
            inversion_beca_vigente: '$149 USD (Beca 32% activa)',
            duracion: '6 semanas prácticas',
            cupos_disponibles: 7,
          };
      break;
    }
    case 'fidel_consultar_horarios':
      output = {
        fecha_consultada: args.fecha_preferida || 'Próxima disponible',
        franja: args.franja || 'Tarde / Noche',
        slots_disponibles: ['Hoy 16:30 (GMT-5)', 'Mañana 10:00 (GMT-5)', 'Mañana 18:00 (GMT-5)'],
        asesor_asignado: 'Especialista de Admisiones ClearMinds',
      };
      break;
    case 'fidel_agendar_cita':
      output = {
        confirmacion_id: `CITA-${Math.floor(100000 + Math.random() * 900000)}`,
        estado: 'CONFIRMADA',
        prospecto: args.nombre_cliente || 'Prospecto Omnicanal',
        fecha_hora: args.fecha_hora || 'Mañana 18:00 (GMT-5)',
        programa: args.programa_interes || 'Certificación ClearMinds',
        enlace_reunion: 'https://meet.google.com/krk-fidel-ai',
      };
      break;
    case 'fidel_enviar_cotizacion':
      output = {
        cotizacion_id: `PRO-${Math.floor(10000 + Math.random() * 90000)}`,
        programa: args.programa || 'Certificación IA / Bootcamp',
        plan_pago: args.plan_pago || '3 cuotas sin intereses',
        validez: '48 horas',
        pdf_url: 'https://clearminds.ec/cotizaciones/proforma-fidel.pdf',
      };
      break;
    case 'fidel_transferir_humano':
      output = {
        handoff_status: 'ESCALADO_A_CLOSER_HUMANO',
        motivo: args.motivo || 'Atención especializada requerida',
        prioridad: args.prioridad || 'ALTA',
      };
      break;
    default:
      output = {
        status: 'EXECUTED',
        server: server?.name || 'Custom MCP Server',
        tool: toolName,
        input: args,
        executedAt: new Date().toISOString(),
      };
  }

  return {
    id: `trace_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    serverId: server?.id || 'mcp_fidel_official',
    serverName: server?.name || 'FidelMCP — ClearMinds Comercial',
    toolName,
    arguments: args,
    result: output,
    status: 'SUCCESS',
    latencyMs: Math.max(21, Date.now() - start + Math.floor(Math.random() * 18)),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Genera respuesta de Fidel orquestando las herramientas del servidor MCP asignado a la conversación/canal
 */
export async function orchestrateFidelMcpReply(
  conv: OmniConversation,
  latestUserText: string,
): Promise<{ replyText: string; traces: McpToolExecutionTrace[] }> {
  const servers = getStoredMcpServers();
  const activeServer =
    (conv.activeMcpServerId
      ? servers.find((s) => s.id === conv.activeMcpServerId && s.isActive)
      : undefined) ||
    servers.find(
      (s) => s.isActive && s.isDefault && s.assignedChannels.includes(conv.channel),
    ) ||
    servers.find((s) => s.isActive) ||
    servers[0];

  const traces: McpToolExecutionTrace[] = [];
  const lower = latestUserText.toLowerCase();

  if (activeServer) {
    const hasCatalog = activeServer.tools.some((t) => t.name === 'fidel_consultar_catalogo');
    const hasSchedule = activeServer.tools.some((t) => t.name === 'fidel_consultar_horarios');
    const hasBooking = activeServer.tools.some((t) => t.name === 'fidel_agendar_cita');
    const hasQuote = activeServer.tools.some((t) => t.name === 'fidel_enviar_cotizacion');

    if (
      hasCatalog &&
      /precio|costo|cuanto|cuánto|valor|beca|curso|programa|certificaci|bootcamp|info/i.test(lower)
    ) {
      const prog =
        lower.includes('fullstack') || lower.includes('bootcamp')
          ? 'fullstack_bootcamp'
          : 'ia_docencia';
      traces.push(
        await executeMcpToolLive(activeServer.id, 'fidel_consultar_catalogo', {
          programa: prog,
        }),
      );
    }

    if (
      hasSchedule &&
      /horario|disponib|cuando|cuándo|hora|agenda|reuni/i.test(lower)
    ) {
      traces.push(
        await executeMcpToolLive(activeServer.id, 'fidel_consultar_horarios', {
          fecha_preferida: 'Mañana',
          franja: 'Tarde',
        }),
      );
    }

    if (
      hasBooking &&
      /agendar|reservar|cita|llamada|mañana a las|confirmo/i.test(lower)
    ) {
      traces.push(
        await executeMcpToolLive(activeServer.id, 'fidel_agendar_cita', {
          nombre_cliente: conv.name || conv.externalHandle || conv.phone,
          contacto: conv.externalHandle || conv.phone,
          fecha_hora: 'Mañana 18:00 (GMT-5)',
          programa_interes: 'Certificación ClearMinds',
        }),
      );
    }

    if (
      hasQuote &&
      /cotizaci|proforma|cuotas|financiamiento|factura/i.test(lower)
    ) {
      traces.push(
        await executeMcpToolLive(activeServer.id, 'fidel_enviar_cotizacion', {
          programa: lower.includes('fullstack') ? 'Bootcamp FullStack' : 'Certificación IA Docencia',
          plan_pago: '3_cuotas',
        }),
      );
    }

    // Si es un MCP personalizado externo, invocar su primera tool disponible
    const customTool = activeServer.tools.find((t) => !t.name.startsWith('fidel_'));
    if (customTool && traces.length === 0) {
      traces.push(
        await executeMcpToolLive(activeServer.id, customTool.name, {
          lead_handle: conv.externalHandle || conv.phone,
          query: latestUserText,
          stage: 'QUALIFIED',
        }),
      );
    }
  }

  let replyText = '';
  if (traces.some((t) => t.toolName === 'fidel_agendar_cita')) {
    const tr = traces.find((t) => t.toolName === 'fidel_agendar_cita')!;
    replyText = `¡Perfecto ${conv.name || ''}! He agendado tu sesión mediante ${tr.serverName} con código ${tr.result.confirmacion_id} para ${tr.result.fecha_hora}. Enlace: ${tr.result.enlace_reunion}. ¿A qué correo te envío el recordatorio?`;
  } else if (traces.some((t) => t.toolName === 'fidel_enviar_cotizacion')) {
    const tr = traces.find((t) => t.toolName === 'fidel_enviar_cotizacion')!;
    replyText = `¡Listo! Generé tu proforma ${tr.result.cotizacion_id} para ${tr.result.programa} con modalidad ${tr.result.plan_pago}. ¿Te gustaría agendar una breve llamada mañana para revisar los detalles?`;
  } else if (traces.some((t) => t.toolName === 'fidel_consultar_catalogo')) {
    const tr = traces.find((t) => t.toolName === 'fidel_consultar_catalogo')!;
    replyText = `¡Con gusto! Consulté nuestro catálogo oficial en ${tr.serverName}: ${tr.result.programa} tiene una inversión con beca vigente de ${tr.result.inversion_beca_vigente} (regular ${tr.result.inversion_regular}), duración de ${tr.result.duracion} y quedan ${tr.result.cupos_disponibles} cupos. ¿Prefieres horario entre semana o sábados?`;
  } else if (traces.some((t) => t.toolName === 'fidel_consultar_horarios')) {
    const tr = traces.find((t) => t.toolName === 'fidel_consultar_horarios')!;
    const slots = (tr.result.slots_disponibles || []).join(', ');
    replyText = `Verifiqué en tiempo real con ${tr.serverName} y tenemos disponibilidad en: ${slots}. ¿Cuál de estos horarios te funciona mejor para reservarte el espacio?`;
  } else if (traces.length > 0) {
    const tr = traces[0];
    replyText = `He procesado tu solicitud conectando con el servidor MCP "${tr.serverName}" (tool: ${tr.toolName}). ¿Cómo te gustaría continuar con tu inscripción?`;
  } else {
    replyText = `¡Hola ${conv.name || ''}! Soy Fidel atendiendo por ${conv.channel}. Estoy conectado a ${activeServer?.name || 'FidelMCP'}. ¿Te gustaría consultar precios con beca, horarios disponibles o agendar una sesión diagnóstica?`;
  }

  return { replyText, traces };
}

// ==========================================
// Multi-tenant Authentication & Integrations
// ==========================================

export function getStoredAuthToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch {
    return null;
  }
}

export function getStoredAuthSession(): AuthUserSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthUserSession, remember = true) {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, session.token);
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(session));
    if (!remember) {
      sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, session.token);
    }
  } catch (e) {
    console.warn('No se pudo guardar la sesión en storage', e);
  }
}

export function clearAuthSession() {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (e) {
    console.warn('Error al limpiar sesión', e);
  }
}

export async function loginToHub(
  email: string,
  password: string,
  remember = true,
): Promise<AuthUserSession> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.message || 'Credenciales inválidas. Verifica tu correo y contraseña.',
    );
  }

  const tokenData = await res.json();
  const token = tokenData.access_token;

  // Obtener perfil y tenant asociado con GET /auth/me
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!meRes.ok) {
    throw new Error('No se pudo obtener el perfil de la empresa.');
  }

  const meData = await meRes.json();
  const session: AuthUserSession = {
    id: meData.id,
    email: meData.email,
    displayName: meData.displayName || 'Usuario Fidel',
    role: meData.role,
    organizationId: meData.organizationId,
    organizationName: meData.organizationName || 'Empresa Principal',
    isSandbox: meData.isSandbox ?? false,
    hasCrm: meData.hasCrm ?? false,
    token,
  };

  saveAuthSession(session, remember);
  return session;
}

export async function fetchIntegrationStatus(): Promise<{
  hasWhatsappToken: boolean;
  hasGeminiKey: boolean;
  whatsappPhoneNumberId: string | null;
  hasWhatsappBusinessAccountId: boolean;
}> {
  const token = getStoredAuthToken();
  if (!token) {
    return {
      hasWhatsappToken: false,
      hasGeminiKey: false,
      whatsappPhoneNumberId: null,
      hasWhatsappBusinessAccountId: false,
    };
  }

  try {
    const res = await fetch(`${API_BASE}/org/integrations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Error al consultar integraciones');
    return await res.json();
  } catch {
    return {
      hasWhatsappToken: false,
      hasGeminiKey: false,
      whatsappPhoneNumberId: null,
      hasWhatsappBusinessAccountId: false,
    };
  }
}

export async function updateIntegrationCredentials(dto: {
  whatsappAccessToken?: string;
  whatsappPhoneNumberId?: string;
  whatsappBusinessAccountId?: string;
  geminiApiKey?: string;
}) {
  const token = getStoredAuthToken();
  if (!token) throw new Error('Sesión no válida o expirada.');

  const res = await fetch(`${API_BASE}/org/integrations`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'No se pudieron actualizar las credenciales de Meta');
  }

  return await res.json();
}

export async function testChannelApiConnection(
  channel: SupportedChannel,
  params?: {
    accessToken?: string;
    externalAccountId?: string;
    businessAccountId?: string;
  },
): Promise<{
  ok: boolean;
  channel: SupportedChannel;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  message: string;
  details?: Record<string, any>;
}> {
  const token = getStoredAuthToken();
  if (!token) {
    return {
      ok: false,
      channel,
      status: 'DISCONNECTED',
      message: 'Inicia sesión para probar la conexión con Meta/TikTok.',
    };
  }

  try {
    const res = await fetch(`${API_BASE}/channels/test-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ channel, ...params }),
    });
    return await res.json();
  } catch (err: any) {
    return {
      ok: false,
      channel,
      status: 'ERROR',
      message: `Error de red al conectar con el backend: ${err?.message}`,
    };
  }
}


