export type SupportedChannel = 'WHATSAPP' | 'INSTAGRAM' | 'FACEBOOK' | 'TIKTOK';

export interface McpToolSchema {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description?: string; enum?: string[] }>;
    required?: string[];
  };
}

export interface McpResourceSchema {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface McpToolExecutionTrace {
  id: string;
  serverId: string;
  serverName: string;
  toolName: string;
  arguments: Record<string, any>;
  result: Record<string, any>;
  status: 'SUCCESS' | 'ERROR';
  latencyMs: number;
  timestamp: string;
}

export interface McpServerSummary {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  transport: 'http' | 'sse' | 'websocket' | 'stdio';
  endpointUrl: string;
  hasApiKey: boolean;
  isActive: boolean;
  isDefault: boolean;
  assignedChannels: SupportedChannel[];
  tools: McpToolSchema[];
  resources: McpResourceSchema[];
  updatedAt: string;
}

export interface OmniMessage {
  id: string;
  conversationId: string;
  channel: SupportedChannel;
  fromUser: boolean;
  text: string;
  timestamp: number;
  fromAi?: boolean;
  type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  mediaUrl?: string | null;
  mimeType?: string | null;
  fileName?: string | null;
  status?: 'RECEIVED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  metadata?: {
    platform?: string;
    storyUrl?: string;
    reelUrl?: string;
    postLink?: string;
    isStoryReply?: boolean;
    [key: string]: any;
  } | null;
  mcpToolTraces?: McpToolExecutionTrace[] | null;
  replyTo?: {
    id: string;
    text: string;
    fromUser: boolean;
    type?: string;
    mediaUrl?: string | null;
  } | null;
  isReply?: boolean;
}

export interface OmniConversation {
  id: string;
  phone: string;
  name?: string;
  email?: string | null;
  tag?: string | null;
  tagId?: string | null;
  contactId?: string;
  channel: SupportedChannel;
  externalHandle?: string;
  activeMcpServerId?: string | null;
  interestStatus?: 'INTERESTED' | 'NOT_INTERESTED' | 'PENDING' | null;
  lastUserMessageAt: number | null;
  lastMessagePreview: string;
  lastMessageAt: number;
  unreadCount: number;
  assignedToUserId?: string | null;
  assignedAgentName?: string | null;
  isNewLead?: boolean;
  isAiActive?: boolean;
  isTrainingMode?: boolean;
  extractedData?: Record<string, string>;
}

export interface ChannelAccountSummary {
  id: string;
  channel: SupportedChannel;
  displayName: string;
  externalAccountId: string | null;
  hasAccessToken: boolean;
  webhookVerifyToken: string | null;
  isActive: boolean;
  webhookEndpoint: string;
  updatedAt: string;
}

export interface FidelTrainingRule {
  id: string;
  instruction: string;
  category: string;
  sourceFeedback?: string;
  createdByName?: string;
  isActive: boolean;
  createdAt: string;
}

export interface OrgAgentUser {
  id: string;
  email: string;
  displayName: string;
  role: 'ORG_ADMIN' | 'AGENT';
}
