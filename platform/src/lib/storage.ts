// I.ARA Scale - LocalStorage Data Layer

// Types
export interface Client {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  plan: 'ESSENCIAL' | 'GROWTH' | 'PRO';
  // Pools inclusos no plano (baseado na tabela de planos)
  poolsIncluded: number;
  // Pools adicionais contratados (max 1000/mês)
  poolsAdditional: number;
  // Total de pools consumidos no mês
  poolsUsed: number;
  // Limite de usuários baseado no plano
  userLimit: number;
  // Valor da mensalidade
  monthlyPrice: number;
  createdAt: string;
  // Legacy compatibility
  poolsLimit?: number;
}

export interface User {
  id: string;
  clientId: string | null; // null for superadmin (multi-tenant access)
  name: string;
  role: 'superadmin' | 'gestor' | 'marketing' | 'vendedor' | 'iara_admin';
  email: string;
  password: string;
  active: boolean;
  createdAt: string;
  avatar?: string;
}

// Updated Lead status for AI activation workflow
export type LeadAIStatus = 'not_activated' | 'ai_active' | 'in_conversation' | 'scheduled' | 'archived';

export interface Lead {
  id: string;
  clientId: string;
  assignedTo?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'new' | 'qualified' | 'nurturing' | 'cold' | 'converted' | 'lost';
  aiStatus: LeadAIStatus;
  origin: string;
  lastInteraction: string;
  score: number;
  poolActivated: boolean;
  createdAt: string;
  lossReason?: string;
}

// AI Activation History (Legacy - for backward compatibility)
export interface AIActivation {
  id: string;
  leadId: string;
  clientId: string;
  activatedBy: string;
  activatedByName: string;
  activatedAt: string;
  poolConsumed: boolean;
  conversationStatus: 'pending' | 'active' | 'paused' | 'transferred' | 'completed';
}

// Import AI types and plans
import type { AITypeId, LeadAIActivation } from './aiTypes';
import { AI_TYPES, isAIAvailableForPlan } from './aiTypes';
import { generatePerformanceInsights } from './performanceInsightsEngine';
import { generateMarketingInsights } from './marketingInsightsEngine';
import { generateCopyInsightsReport } from './copyInsightsEngine';
import { PLANS } from './plans';

// WhatsApp Conversation
export interface WhatsAppMessage {
  id: string;
  leadId: string;
  clientId: string;
  sender: 'ai' | 'lead' | 'human';
  content: string;
  timestamp: string;
  read: boolean;
}

export interface WhatsAppConversation {
  leadId: string;
  clientId: string;
  status: 'active' | 'paused' | 'transferred' | 'completed';
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  transferredTo?: string;
}

export interface Score {
  leadId: string;
  usageLevel: 'high' | 'medium' | 'low';
  scoreValue: number;
  explanation: string;
  recommendation: string;
  signals: ScoreSignal[];
}

export interface ScoreSignal {
  name: string;
  weight: number;
  value: number;
  contribution: number;
}

export interface Campaign {
  id: string;
  clientId: string;
  name: string;
  channel: 'Meta Ads' | 'Google Ads' | 'Email' | 'LinkedIn' | 'Organic';
  status: 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  leads: number;
  conversions: number;
  revenue: number;
  startDate: string;
  endDate?: string;
}

export type AccessMode = 'customer' | 'iara_admin';

export interface Session {
  userId: string;
  clientId: string | null; // null for superadmin
  email: string;
  role: User['role'];
  loginAt: string;
  mode: AccessMode;
  // For superadmin: currently viewing client (multi-tenant switching)
  viewingClientId?: string;
}

// Admin user for iara_admin mode
export interface AdminUser {
  id: string;
  name: string;
  email: string;
}

export interface DashboardMetrics {
  totalLeads: number;
  activeLeads: number;
  averageScore: number;
  poolsAvailable: number;
  poolsUsed: number;
  poolsPercentage: number;
  upsellOpportunities: number;
  crossSellOpportunities: number;
  scheduledMeetings: number;
  conversionRate: number;
  revenueThisMonth: number;
  revenueGrowth: number;
  // New AI metrics
  leadsWithAIActive: number;
  conversationsInProgress: number;
  poolsConsumedByActivations: number;
  conversionsToScheduled: number;
}

// Active Conversation Pointer (for WhatsApp navigation)
export interface ActiveConversation {
  leadId: string;
  aiTypeId: AITypeId;
  timestamp: string;
}

// Storage Keys - IMPORTANT: Users stored in iara_users, session in iara_session
const KEYS = {
  clients: 'iara_clients',
  users: 'iara_users',
  leads: 'iara_leads',
  scores: 'iara_scores',
  campaigns: 'iara_campaigns',
  session: 'iara_session',
  copyDrafts: 'iara_copy_drafts',
  adminUser: 'iara_admin_user',
  aiActivations: 'iara_ai_activations',
  leadAIActivations: 'iara_lead_ai_activations',
  whatsappMessages: 'iara_whatsapp_messages',
  whatsappConversations: 'iara_whatsapp_conversations',
  activeConversation: 'iara_active_conversation',
  // Legacy keys for migration
  legacyUsers: 'id_users',
  legacySession: 'id_session',
} as const;

// Generic storage helpers
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Session Management
export function getSession(): Session | null {
  return getItem<Session | null>(KEYS.session, null);
}

export function setSession(session: Session): void {
  setItem(KEYS.session, session);
}

export function clearSession(): void {
  // Clear both current and legacy session keys to prevent auto-restore
  localStorage.removeItem(KEYS.session);
  localStorage.removeItem(KEYS.legacySession);
  console.log('[IARA] Session cleared');
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

export function isCustomerAuthenticated(): boolean {
  const session = getSession();
  return session !== null && session.mode === 'customer';
}

export function isAdminAuthenticated(): boolean {
  const session = getSession();
  return session !== null && session.mode === 'iara_admin';
}

// ========================================
// SUPERADMIN FUNCTIONS
// ========================================

// Check if current user is SuperAdmin (Fundador I.ARA)
export function isSuperAdmin(): boolean {
  const session = getSession();
  return session !== null && session.role === 'superadmin';
}

// Check if user has full system access (SuperAdmin only)
export function hasSystemAccess(): boolean {
  return isSuperAdmin();
}

// Get the effective clientId for data access
// SuperAdmin can view any client, regular users see only their own
export function getEffectiveClientId(): string | null {
  const session = getSession();
  if (!session) return null;
  
  // SuperAdmin uses viewingClientId if set, otherwise null (all clients)
  if (session.role === 'superadmin') {
    return session.viewingClientId || null;
  }
  
  // Regular users always use their own clientId
  return session.clientId;
}

// SuperAdmin: Switch to viewing a specific client
export function setViewingClient(clientId: string | null): void {
  const session = getSession();
  if (!session || session.role !== 'superadmin') return;
  
  setSession({
    ...session,
    viewingClientId: clientId || undefined,
  });
  console.log('[IARA] SuperAdmin viewing client:', clientId || 'ALL');
}

// Get current viewing client for SuperAdmin
export function getViewingClient(): string | null {
  const session = getSession();
  if (!session || session.role !== 'superadmin') return null;
  return session.viewingClientId || null;
}

// Admin User Management
export function getAdminUser(): AdminUser | null {
  return getItem<AdminUser | null>(KEYS.adminUser, null);
}

export function setAdminUser(user: AdminUser): void {
  setItem(KEYS.adminUser, user);
}

export function clearAdminUser(): void {
  localStorage.removeItem(KEYS.adminUser);
}

// Active Conversation Management (for WhatsApp navigation)
export function getActiveConversation(): ActiveConversation | null {
  return getItem<ActiveConversation | null>(KEYS.activeConversation, null);
}

export function setActiveConversation(conversation: ActiveConversation): void {
  setItem(KEYS.activeConversation, conversation);
}

export function clearActiveConversation(): void {
  localStorage.removeItem(KEYS.activeConversation);
}

// Clients CRUD
export function getClients(): Client[] {
  return getItem<Client[]>(KEYS.clients, []);
}

export function getClient(id: string): Client | undefined {
  return getClients().find(c => c.id === id);
}

export function saveClient(client: Client): void {
  const clients = getClients();
  const index = clients.findIndex(c => c.id === client.id);
  if (index >= 0) {
    clients[index] = client;
  } else {
    clients.push(client);
  }
  setItem(KEYS.clients, clients);
}

export function deleteClient(id: string): void {
  const clients = getClients().filter(c => c.id !== id);
  setItem(KEYS.clients, clients);
}

// ========================================
// USERS CRUD - EXCLUSIVE iara_users storage
// ========================================

// Load all users from iara_users (PRIMARY FUNCTION)
export function loadUsers(): User[] {
  return getItem<User[]>(KEYS.users, []);
}

// Save all users to iara_users (PRIMARY FUNCTION)
export function saveUsers(users: User[]): void {
  localStorage.setItem(KEYS.users, JSON.stringify(users));
}

// Get users (with optional client filter)
export function getUsers(clientId?: string): User[] {
  const users = loadUsers();
  return clientId ? users.filter(u => u.clientId === clientId) : users;
}

export function getUser(id: string): User | undefined {
  return loadUsers().find(u => u.id === id);
}

export function getUserByEmail(email: string): User | undefined {
  return loadUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function saveUser(user: User): void {
  const users = loadUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  saveUsers(users);
}

export function deleteUser(id: string): void {
  const users = loadUsers().filter(u => u.id !== id);
  saveUsers(users);
}

// Leads CRUD
export function getLeads(clientId?: string, userId?: string, userRole?: string): Lead[] {
  let leads = getItem<Lead[]>(KEYS.leads, []);
  if (clientId) {
    leads = leads.filter(l => l.clientId === clientId);
  }
  // Vendedor only sees assigned leads
  if (userRole === 'vendedor' && userId) {
    leads = leads.filter(l => l.assignedTo === userId);
  }
  return leads;
}

export function getLead(id: string): Lead | undefined {
  return getLeads().find(l => l.id === id);
}

export function saveLead(lead: Lead): void {
  const leads = getLeads();
  const index = leads.findIndex(l => l.id === lead.id);
  if (index >= 0) {
    leads[index] = lead;
  } else {
    leads.push(lead);
  }
  setItem(KEYS.leads, leads);
}

export function deleteLead(id: string): void {
  const leads = getLeads().filter(l => l.id !== id);
  setItem(KEYS.leads, leads);
}

// AI Activation Management
export function getAIActivations(leadId?: string, clientId?: string): AIActivation[] {
  let activations = getItem<AIActivation[]>(KEYS.aiActivations, []);
  if (leadId) {
    activations = activations.filter(a => a.leadId === leadId);
  }
  if (clientId) {
    activations = activations.filter(a => a.clientId === clientId);
  }
  return activations.sort((a, b) => new Date(b.activatedAt).getTime() - new Date(a.activatedAt).getTime());
}

export function saveAIActivation(activation: AIActivation): void {
  const activations = getItem<AIActivation[]>(KEYS.aiActivations, []);
  const index = activations.findIndex(a => a.id === activation.id);
  if (index >= 0) {
    activations[index] = activation;
  } else {
    activations.push(activation);
  }
  setItem(KEYS.aiActivations, activations);
}

// Lead AI Activations (Multi-AI per Lead)
export function getLeadAIActivations(leadId?: string, clientId?: string): LeadAIActivation[] {
  let activations = getItem<LeadAIActivation[]>(KEYS.leadAIActivations, []);
  if (leadId) {
    activations = activations.filter(a => a.leadId === leadId);
  }
  if (clientId) {
    activations = activations.filter(a => a.clientId === clientId);
  }
  return activations.sort((a, b) => new Date(b.activatedAt).getTime() - new Date(a.activatedAt).getTime());
}

export function getLeadAIActivation(id: string): LeadAIActivation | undefined {
  return getItem<LeadAIActivation[]>(KEYS.leadAIActivations, []).find(a => a.id === id);
}

export function saveLeadAIActivation(activation: LeadAIActivation): void {
  const activations = getItem<LeadAIActivation[]>(KEYS.leadAIActivations, []);
  const index = activations.findIndex(a => a.id === activation.id);
  if (index >= 0) {
    activations[index] = activation;
  } else {
    activations.push(activation);
  }
  setItem(KEYS.leadAIActivations, activations);
}

// Activate specific AI type for Lead
export function activateAITypeForLead(
  leadId: string, 
  clientId: string, 
  aiTypeId: AITypeId,
  userId?: string, 
  userName?: string
): { success: boolean; message: string; activation?: LeadAIActivation } {
  const client = getClient(clientId);
  const lead = getLead(leadId);
  
  if (!client || !lead) {
    return { success: false, message: 'Cliente ou lead não encontrado' };
  }
  
  if (client.status === 'inactive') {
    return { success: false, message: 'Cliente inativo. Ative o cliente para usar a IA.' };
  }
  
  // Check if AI is available for the plan
  if (!isAIAvailableForPlan(aiTypeId, client.plan)) {
    const aiType = AI_TYPES[aiTypeId];
    return { 
      success: false, 
      message: `${aiType.name} requer plano ${aiType.requiredPlan}. Faça upgrade para ativar.` 
    };
  }
  
  // Check if this AI type is already active for this lead
  const existingActivations = getLeadAIActivations(leadId);
  const existingActive = existingActivations.find(
    a => a.aiTypeId === aiTypeId && (a.status === 'active' || a.status === 'paused')
  );
  
  if (existingActive) {
    return { success: false, message: 'Esta IA já está ativa para este lead.' };
  }
  
  // Check pool availability
  const aiType = AI_TYPES[aiTypeId];
  const totalPools = (client.poolsIncluded || client.poolsLimit || 0) + (client.poolsAdditional || 0);
  if (client.poolsUsed + aiType.poolCost > totalPools) {
    return { success: false, message: 'Limite de pools atingido. Adquira pools adicionais ou faça upgrade do plano.' };
  }
  
  // Consume pool
  client.poolsUsed += aiType.poolCost;
  saveClient(client);
  
  // Update lead status if this is the first activation
  if (lead.aiStatus === 'not_activated') {
    lead.aiStatus = 'ai_active';
    lead.poolActivated = true;
  }
  lead.lastInteraction = new Date().toISOString().split('T')[0];
  saveLead(lead);
  
  // Create activation record
  const activation: LeadAIActivation = {
    id: generateId('leadai'),
    leadId,
    clientId,
    aiTypeId,
    status: 'active',
    activatedBy: userId || 'system',
    activatedByName: userName || 'Sistema',
    activatedAt: new Date().toISOString(),
    poolConsumed: true,
    lastInteraction: new Date().toISOString(),
  };
  saveLeadAIActivation(activation);
  
  // Create WhatsApp conversation for conversational AIs
  if (aiType.conversational) {
    const existingConversation = getWhatsAppConversation(leadId);
    if (!existingConversation) {
      createWhatsAppConversation(leadId, clientId);
    }
    
    // Set active conversation pointer for navigation (ATOMIC - one time)
    setActiveConversation({
      leadId,
      aiTypeId,
      timestamp: new Date().toISOString(),
    });
    
    // Send initial AI message
    setTimeout(() => {
      addWhatsAppMessage({
        id: generateId('msg'),
        leadId,
        clientId,
        sender: 'ai',
        content: `🤖 ${aiType.name}\n\nOlá! Sou a ${aiType.name} da ${client.name}. ${getAIGreeting(aiTypeId)}`,
        timestamp: new Date().toISOString(),
        read: false,
      });
    }, 1000);
  }
  
  // Generate reports for non-conversational AIs
  if (aiTypeId === 'performance') {
    generatePerformanceInsights(lead, activation.id);
  }
  if (aiTypeId === 'marketing') {
    generateMarketingInsights(lead, activation.id);
  }
  if (aiTypeId === 'copy') {
    generateCopyInsightsReport(lead, activation.id);
  }
  
  return { success: true, message: `${aiType.name} ativada com sucesso!`, activation };
}

function getAIGreeting(aiTypeId: AITypeId): string {
  const greetings: Record<AITypeId, string> = {
    commercial: 'Vi que você demonstrou interesse em nossos serviços. Como posso ajudá-lo hoje?',
    reactivation: 'Notei que faz um tempo desde nosso último contato. Gostaria de saber como posso ajudá-lo agora?',
    upsell: 'Com base no seu perfil, tenho algumas sugestões que podem agregar valor ao seu negócio. Posso compartilhar?',
    performance: 'Estou analisando as métricas do seu negócio para gerar insights.',
    marketing: 'Estou trabalhando nas suas campanhas de marketing.',
    copy: 'Estou preparando copies otimizados para suas campanhas.',
  };
  return greetings[aiTypeId] || 'Como posso ajudá-lo?';
}

// Pause AI activation
export function pauseLeadAI(activationId: string): boolean {
  const activation = getLeadAIActivation(activationId);
  if (!activation || activation.status !== 'active') return false;
  
  activation.status = 'paused';
  activation.pausedAt = new Date().toISOString();
  saveLeadAIActivation(activation);
  
  // Check if there are other active AIs for this lead
  const leadActivations = getLeadAIActivations(activation.leadId);
  const hasOtherActive = leadActivations.some(a => a.id !== activationId && a.status === 'active');
  
  // Update WhatsApp conversation status if no other active AIs
  const aiType = AI_TYPES[activation.aiTypeId];
  
  if (aiType.conversational && !hasOtherActive) {
    const conversation = getWhatsAppConversation(activation.leadId);
    if (conversation) {
      conversation.status = 'paused';
      saveWhatsAppConversation(conversation);
    }
  }
  
  return true;
}

// Resume AI activation
export function resumeLeadAI(activationId: string): boolean {
  const activation = getLeadAIActivation(activationId);
  if (!activation || activation.status !== 'paused') return false;
  
  activation.status = 'active';
  activation.pausedAt = undefined;
  saveLeadAIActivation(activation);
  
  // Update lead status
  const lead = getLead(activation.leadId);
  if (lead && lead.aiStatus !== 'in_conversation') {
    lead.aiStatus = 'ai_active';
    saveLead(lead);
  }
  
  // Resume WhatsApp conversation
  const aiType = AI_TYPES[activation.aiTypeId];
  
  if (aiType.conversational) {
    const conversation = getWhatsAppConversation(activation.leadId);
    if (conversation && conversation.status === 'paused') {
      conversation.status = 'active';
      saveWhatsAppConversation(conversation);
    }
  }
  
  return true;
}

// Finish AI activation
export function finishLeadAI(activationId: string): boolean {
  const activation = getLeadAIActivation(activationId);
  if (!activation) return false;
  
  activation.status = 'finished';
  activation.finishedAt = new Date().toISOString();
  saveLeadAIActivation(activation);
  
  // Check if there are other active AIs for this lead
  const leadActivations = getLeadAIActivations(activation.leadId);
  const hasOtherActive = leadActivations.some(
    a => a.id !== activationId && (a.status === 'active' || a.status === 'paused')
  );
  
  // Update lead status if no other active AIs
  if (!hasOtherActive) {
    const lead = getLead(activation.leadId);
    if (lead) {
      lead.aiStatus = 'archived';
      saveLead(lead);
    }
    
    // Complete WhatsApp conversation
    const conversation = getWhatsAppConversation(activation.leadId);
    if (conversation) {
      conversation.status = 'completed';
      saveWhatsAppConversation(conversation);
    }
  }
  
  return true;
}

// Get active AI for WhatsApp conversation
export function getActiveConversationalAI(leadId: string): LeadAIActivation | undefined {
  const activations = getLeadAIActivations(leadId);
  
  return activations.find(a => {
    const aiType = AI_TYPES[a.aiTypeId];
    return a.status === 'active' && aiType.conversational;
  });
}

// Activate AI for Lead (Pool Consumption) - Enhanced version
export function activateAIForLead(
  leadId: string, 
  clientId: string, 
  userId?: string, 
  userName?: string
): { success: boolean; message: string; activation?: AIActivation } {
  const client = getClient(clientId);
  const lead = getLead(leadId);
  
  if (!client || !lead) {
    return { success: false, message: 'Cliente ou lead não encontrado' };
  }
  
  if (client.status === 'inactive') {
    return { success: false, message: 'Cliente inativo. Ative o cliente para usar a IA.' };
  }
  
  if (lead.poolActivated && lead.aiStatus !== 'archived') {
    return { success: false, message: 'IA já ativada para este lead' };
  }
  
  const totalPools = (client.poolsIncluded || client.poolsLimit || 0) + (client.poolsAdditional || 0);
  if (client.poolsUsed >= totalPools) {
    return { success: false, message: 'Limite de pools atingido. Adquira pools adicionais ou faça upgrade do plano.' };
  }
  
  // Consume pool
  client.poolsUsed += 1;
  saveClient(client);
  
  // Mark lead as activated
  lead.poolActivated = true;
  lead.aiStatus = 'ai_active';
  lead.lastInteraction = new Date().toISOString().split('T')[0];
  saveLead(lead);
  
  // Create activation record
  const activation: AIActivation = {
    id: generateId('activation'),
    leadId,
    clientId,
    activatedBy: userId || 'system',
    activatedByName: userName || 'Sistema',
    activatedAt: new Date().toISOString(),
    poolConsumed: true,
    conversationStatus: 'active',
  };
  saveAIActivation(activation);
  
  // Create initial WhatsApp conversation
  createWhatsAppConversation(leadId, clientId);
  
  // Simulate AI sending first message
  setTimeout(() => {
    addWhatsAppMessage({
      id: generateId('msg'),
      leadId,
      clientId,
      sender: 'ai',
      content: `Olá! Sou a assistente virtual da ${client.name}. Vi que você demonstrou interesse em nossos serviços. Como posso ajudá-lo hoje?`,
      timestamp: new Date().toISOString(),
      read: false,
    });
  }, 1000);
  
  return { success: true, message: 'IA ativada com sucesso!', activation };
}

// Pause/Resume AI for Lead
export function pauseAIForLead(leadId: string): boolean {
  const lead = getLead(leadId);
  if (!lead) return false;
  
  lead.aiStatus = 'not_activated';
  saveLead(lead);
  
  const conversation = getWhatsAppConversation(leadId);
  if (conversation) {
    conversation.status = 'paused';
    saveWhatsAppConversation(conversation);
  }
  
  return true;
}

export function transferToHuman(leadId: string, humanUserId?: string): boolean {
  const lead = getLead(leadId);
  if (!lead) return false;
  
  const conversation = getWhatsAppConversation(leadId);
  if (conversation) {
    conversation.status = 'transferred';
    conversation.transferredTo = humanUserId;
    saveWhatsAppConversation(conversation);
  }
  
  // Add system message
  addWhatsAppMessage({
    id: generateId('msg'),
    leadId,
    clientId: lead.clientId,
    sender: 'ai',
    content: '📞 Esta conversa foi transferida para um atendente humano. Em breve você receberá uma resposta.',
    timestamp: new Date().toISOString(),
    read: false,
  });
  
  return true;
}

export function finishConversation(leadId: string): boolean {
  const lead = getLead(leadId);
  if (!lead) return false;
  
  lead.aiStatus = 'archived';
  saveLead(lead);
  
  const conversation = getWhatsAppConversation(leadId);
  if (conversation) {
    conversation.status = 'completed';
    saveWhatsAppConversation(conversation);
  }
  
  return true;
}

export function scheduleLeadMeeting(leadId: string): boolean {
  const lead = getLead(leadId);
  if (!lead) return false;
  
  lead.aiStatus = 'scheduled';
  lead.status = 'qualified';
  saveLead(lead);
  
  return true;
}

// WhatsApp Conversations
export function getWhatsAppConversations(clientId: string): WhatsAppConversation[] {
  const conversations = getItem<WhatsAppConversation[]>(KEYS.whatsappConversations, []);
  return conversations
    .filter(c => c.clientId === clientId)
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

export function getWhatsAppConversation(leadId: string): WhatsAppConversation | undefined {
  const conversations = getItem<WhatsAppConversation[]>(KEYS.whatsappConversations, []);
  return conversations.find(c => c.leadId === leadId);
}

export function saveWhatsAppConversation(conversation: WhatsAppConversation): void {
  const conversations = getItem<WhatsAppConversation[]>(KEYS.whatsappConversations, []);
  const index = conversations.findIndex(c => c.leadId === conversation.leadId);
  if (index >= 0) {
    conversations[index] = conversation;
  } else {
    conversations.push(conversation);
  }
  setItem(KEYS.whatsappConversations, conversations);
}

export function createWhatsAppConversation(leadId: string, clientId: string): WhatsAppConversation {
  const conversation: WhatsAppConversation = {
    leadId,
    clientId,
    status: 'active',
    lastMessage: '',
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
  };
  saveWhatsAppConversation(conversation);
  return conversation;
}

// WhatsApp Messages
export function getWhatsAppMessages(leadId: string): WhatsAppMessage[] {
  const messages = getItem<WhatsAppMessage[]>(KEYS.whatsappMessages, []);
  return messages
    .filter(m => m.leadId === leadId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function addWhatsAppMessage(message: WhatsAppMessage): void {
  const messages = getItem<WhatsAppMessage[]>(KEYS.whatsappMessages, []);
  messages.push(message);
  setItem(KEYS.whatsappMessages, messages);
  
  // Update conversation
  const conversation = getWhatsAppConversation(message.leadId);
  if (conversation) {
    conversation.lastMessage = message.content;
    conversation.lastMessageAt = message.timestamp;
    if (message.sender === 'lead') {
      conversation.unreadCount += 1;
    }
    saveWhatsAppConversation(conversation);
  }
  
  // Update lead status if in conversation
  const lead = getLead(message.leadId);
  if (lead && lead.aiStatus === 'ai_active' && message.sender === 'lead') {
    lead.aiStatus = 'in_conversation';
    lead.lastInteraction = new Date().toISOString().split('T')[0];
    saveLead(lead);
  }
}

export function markMessagesAsRead(leadId: string): void {
  const messages = getItem<WhatsAppMessage[]>(KEYS.whatsappMessages, []);
  messages.forEach(m => {
    if (m.leadId === leadId) {
      m.read = true;
    }
  });
  setItem(KEYS.whatsappMessages, messages);
  
  const conversation = getWhatsAppConversation(leadId);
  if (conversation) {
    conversation.unreadCount = 0;
    saveWhatsAppConversation(conversation);
  }
}

// Simulate AI response
export function simulateAIResponse(leadId: string, leadMessage: string): void {
  const lead = getLead(leadId);
  const client = lead ? getClient(lead.clientId) : null;
  
  if (!lead || !client) return;
  
  // Simulate typing delay
  setTimeout(() => {
    const responses = [
      `Entendi! Vou verificar isso para você. Poderia me informar mais detalhes sobre o que você precisa?`,
      `Perfeito! Temos algumas opções que podem te interessar. Qual seria o melhor horário para conversarmos?`,
      `Ótimo! Nosso time está preparado para atender suas necessidades. Posso agendar uma demonstração para você?`,
      `Claro! Deixa eu te explicar melhor como funciona. Você prefere por telefone ou videoconferência?`,
      `Maravilha! Vou te passar algumas informações importantes. Qual é o principal desafio que você enfrenta hoje?`,
    ];
    
    const aiMessage: WhatsAppMessage = {
      id: generateId('msg'),
      leadId,
      clientId: lead.clientId,
      sender: 'ai',
      content: responses[Math.floor(Math.random() * responses.length)],
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    addWhatsAppMessage(aiMessage);
  }, 2000 + Math.random() * 2000);
}

// Scores
export function getScores(clientId?: string): Score[] {
  const scores = getItem<Score[]>(KEYS.scores, []);
  if (!clientId) return scores;
  
  const clientLeads = getLeads(clientId);
  const leadIds = new Set(clientLeads.map(l => l.id));
  return scores.filter(s => leadIds.has(s.leadId));
}

export function getScore(leadId: string): Score | undefined {
  return getScores().find(s => s.leadId === leadId);
}

export function saveScore(score: Score): void {
  const scores = getScores();
  const index = scores.findIndex(s => s.leadId === score.leadId);
  if (index >= 0) {
    scores[index] = score;
  } else {
    scores.push(score);
  }
  setItem(KEYS.scores, scores);
}

// Calculate Score using Double Signal Method
export function calculateScore(lead: Lead): Score {
  const signals: ScoreSignal[] = [
    { name: 'Engajamento Recente', weight: 0.25, value: getEngagementValue(lead), contribution: 0 },
    { name: 'Qualificação', weight: 0.20, value: getQualificationValue(lead), contribution: 0 },
    { name: 'Origem do Lead', weight: 0.15, value: getOriginValue(lead), contribution: 0 },
    { name: 'Tempo no Funil', weight: 0.20, value: getFunnelTimeValue(lead), contribution: 0 },
    { name: 'Histórico de Interações', weight: 0.20, value: Math.random() * 100, contribution: 0 },
  ];
  
  let totalScore = 0;
  signals.forEach(signal => {
    signal.contribution = signal.weight * signal.value;
    totalScore += signal.contribution;
  });
  
  const scoreValue = Math.round(totalScore);
  const usageLevel = scoreValue >= 70 ? 'high' : scoreValue >= 40 ? 'medium' : 'low';
  
  const explanations: Record<string, string> = {
    high: 'Alto engajamento e perfil qualificado. Lead prioritário para conversão.',
    medium: 'Engajamento moderado. Recomenda-se nutrição antes da abordagem comercial.',
    low: 'Baixo engajamento. Considere reativação ou remoção do funil ativo.',
  };
  
  const recommendations: Record<string, string> = {
    high: 'Alta probabilidade de upgrade. Priorize contato imediato.',
    medium: 'Oportunidade de cross-sell após qualificação adicional.',
    low: 'Reativar com campanha segmentada ou arquivar.',
  };
  
  return {
    leadId: lead.id,
    usageLevel,
    scoreValue,
    explanation: explanations[usageLevel],
    recommendation: recommendations[usageLevel],
    signals,
  };
}

function getEngagementValue(lead: Lead): number {
  const daysSinceInteraction = Math.floor(
    (Date.now() - new Date(lead.lastInteraction).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceInteraction <= 3) return 100;
  if (daysSinceInteraction <= 7) return 80;
  if (daysSinceInteraction <= 14) return 60;
  if (daysSinceInteraction <= 30) return 40;
  return 20;
}

function getQualificationValue(lead: Lead): number {
  const statusScores: Record<string, number> = {
    converted: 100,
    qualified: 85,
    nurturing: 60,
    new: 50,
    cold: 30,
    lost: 10,
  };
  return statusScores[lead.status] || 50;
}

function getOriginValue(lead: Lead): number {
  const originScores: Record<string, number> = {
    'Meta Ads': 75,
    'Google Ads': 80,
    'LinkedIn': 85,
    'Organic': 70,
    'Email': 65,
    'Referral': 90,
  };
  return originScores[lead.origin] || 60;
}

function getFunnelTimeValue(lead: Lead): number {
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceCreation <= 7) return 90;
  if (daysSinceCreation <= 14) return 75;
  if (daysSinceCreation <= 30) return 60;
  if (daysSinceCreation <= 60) return 40;
  return 25;
}

// Campaigns
export function getCampaigns(clientId?: string): Campaign[] {
  const campaigns = getItem<Campaign[]>(KEYS.campaigns, []);
  return clientId ? campaigns.filter(c => c.clientId === clientId) : campaigns;
}

export function saveCampaign(campaign: Campaign): void {
  const campaigns = getCampaigns();
  const index = campaigns.findIndex(c => c.id === campaign.id);
  if (index >= 0) {
    campaigns[index] = campaign;
  } else {
    campaigns.push(campaign);
  }
  setItem(KEYS.campaigns, campaigns);
}

// Dashboard Metrics - Enhanced with AI metrics
export function calculateDashboardMetrics(clientId: string): DashboardMetrics {
  const client = getClient(clientId);
  const leads = getLeads(clientId);
  const campaigns = getCampaigns(clientId);
  const activations = getAIActivations(undefined, clientId);
  const conversations = getWhatsAppConversations(clientId);
  
  const activeLeads = leads.filter(l => 
    ['new', 'qualified', 'nurturing'].includes(l.status) && l.poolActivated
  );
  
  const totalScore = leads.reduce((sum, l) => sum + l.score, 0);
  const averageScore = leads.length > 0 ? Math.round(totalScore / leads.length) : 0;
  
  const upsellOpportunities = leads.filter(l => l.score >= 70 && l.status === 'converted').length;
  const crossSellOpportunities = leads.filter(l => l.score >= 50 && l.score < 70).length;
  
  const convertedLeads = leads.filter(l => l.status === 'converted').length;
  const conversionRate = leads.length > 0 ? Math.round((convertedLeads / leads.length) * 100) : 0;
  
  const revenueThisMonth = campaigns.reduce((sum, c) => sum + c.revenue, 0);
  
  // AI-specific metrics
  const leadsWithAIActive = leads.filter(l => 
    l.aiStatus === 'ai_active' || l.aiStatus === 'in_conversation'
  ).length;
  
  const conversationsInProgress = conversations.filter(c => 
    c.status === 'active' || c.status === 'transferred'
  ).length;
  
  const poolsConsumedByActivations = activations.filter(a => a.poolConsumed).length;
  
  const conversionsToScheduled = leads.filter(l => l.aiStatus === 'scheduled').length;
  
  const totalPools = client ? (client.poolsIncluded || client.poolsLimit || 0) + (client.poolsAdditional || 0) : 0;
  
  return {
    totalLeads: leads.length,
    activeLeads: activeLeads.length,
    averageScore,
    poolsAvailable: totalPools - (client?.poolsUsed || 0),
    poolsUsed: client?.poolsUsed || 0,
    poolsPercentage: totalPools > 0 ? Math.round((client!.poolsUsed / totalPools) * 100) : 0,
    upsellOpportunities,
    crossSellOpportunities,
    scheduledMeetings: conversionsToScheduled + Math.floor(Math.random() * 5) + 3,
    conversionRate,
    revenueThisMonth,
    revenueGrowth: Math.round((Math.random() * 30) - 5),
    leadsWithAIActive,
    conversationsInProgress,
    poolsConsumedByActivations,
    conversionsToScheduled,
  };
}

// Pool pricing per plan
export function getPoolPrice(plan: Client['plan']): number {
  const prices: Record<Client['plan'], number> = {
    ESSENCIAL: 8,
    GROWTH: 12,
    PRO: 20,
  };
  return prices[plan];
}

// Copy Drafts
export interface CopyDraft {
  id: string;
  clientId: string;
  content: string;
  approved: boolean;
  createdAt: string;
}

export function getCopyDrafts(clientId: string): CopyDraft[] {
  const drafts = getItem<CopyDraft[]>(KEYS.copyDrafts, []);
  return drafts.filter(d => d.clientId === clientId);
}

export function saveCopyDraft(draft: CopyDraft): void {
  const drafts = getItem<CopyDraft[]>(KEYS.copyDrafts, []);
  drafts.push(draft);
  setItem(KEYS.copyDrafts, drafts);
}

// ========================================
// USER MIGRATION & INITIALIZATION
// ========================================

// Migrate from legacy id_users to iara_users (without overwriting complete users)
function migrateLegacyUsers(): void {
  const legacyRaw = localStorage.getItem(KEYS.legacyUsers);
  const currentRaw = localStorage.getItem(KEYS.users);
  
  // If legacy exists and current is empty, migrate
  if (legacyRaw && (!currentRaw || currentRaw === '[]')) {
    try {
      const legacyUsers = JSON.parse(legacyRaw);
      if (Array.isArray(legacyUsers) && legacyUsers.length > 0) {
        localStorage.setItem(KEYS.users, JSON.stringify(legacyUsers));
        console.log('[IARA] Migrated users from id_users to iara_users:', legacyUsers);
      }
    } catch (e) {
      console.error('[IARA] Error migrating legacy users:', e);
    }
  }
  
  // Also migrate session
  const legacySession = localStorage.getItem(KEYS.legacySession);
  const currentSession = localStorage.getItem(KEYS.session);
  if (legacySession && !currentSession) {
    localStorage.setItem(KEYS.session, legacySession);
  }
}

function isValidUserRole(role: unknown): role is User['role'] {
  return role === 'superadmin' || role === 'gestor' || role === 'marketing' || role === 'vendedor' || role === 'iara_admin';
}

function normalizeUserSchema(input: any): { normalized: User; changed: boolean } {
  const original = input ?? {};
  const id = typeof original.id === 'string' && original.id.trim() ? original.id : generateId('user');

  const normalized: any = { ...original };

  const beforeEmail = normalized.email;
  const beforePassword = normalized.password;
  const beforeActive = normalized.active;
  const beforeRole = normalized.role;
  const beforeName = normalized.name;
  const beforeClientId = normalized.clientId;

  normalized.id = id;
  normalized.clientId = typeof beforeClientId === 'string' && beforeClientId.trim() ? beforeClientId : 'client_001';
  normalized.name = typeof beforeName === 'string' && beforeName.trim() ? beforeName : 'Usuário';
  normalized.email = typeof beforeEmail === 'string' && beforeEmail.trim() ? beforeEmail : `${id}@demo.com`;
  normalized.password = typeof beforePassword === 'string' && beforePassword.trim() ? beforePassword : '123456';
  normalized.role = isValidUserRole(beforeRole) ? beforeRole : 'gestor';
  normalized.active = typeof beforeActive === 'boolean' ? beforeActive : true;

  // Keep createdAt for backward compatibility (optional in data), but never block bootstrap.
  if (normalized.createdAt === undefined) {
    normalized.createdAt = new Date().toISOString().split('T')[0];
  }

  const changed =
    original.id !== normalized.id ||
    beforeClientId !== normalized.clientId ||
    beforeName !== normalized.name ||
    beforeEmail !== normalized.email ||
    beforePassword !== normalized.password ||
    beforeRole !== normalized.role ||
    beforeActive !== normalized.active ||
    original.createdAt !== normalized.createdAt;

  return { normalized: normalized as User, changed };
}

/**
 * Bootstrap obrigatório do protótipo:
 * - Usa SEMPRE a key iara_users
 * - Se não existir, cria seed correto
 * - Se existir, normaliza schema sem sobrescrever usuários completos
 */
export function bootstrapUsers(): void {
  // 1) Migrate legacy id_users -> iara_users if needed (but do not overwrite)
  migrateLegacyUsers();

  const raw = localStorage.getItem(KEYS.users);
  const seedUsers = getDefaultSeedUsers();
  // Include superadmin in required emails
  const requiredEmails = ['matheus@iara.com', 'gestor@iara.com', 'marketing@iara.com', 'vendas@iara.com'];

  // 2) Seed if missing / invalid
  if (!raw) {
    saveUsers(seedUsers);
    console.log('[IARA] iara_users initialized with demo users:', seedUsers.map(u => u.email));
    return;
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    saveUsers(seedUsers);
    console.log('[IARA] iara_users reset due to invalid JSON');
    return;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    saveUsers(seedUsers);
    console.log('[IARA] iara_users reset due to empty array');
    return;
  }

  // 3) Check if all required demo users exist with correct credentials
  const hasSuperAdmin = parsed.some((u: any) => 
    u.email === 'matheus@iara.com' && u.password === 'admin2026' && u.role === 'superadmin' && u.active === true
  );
  const hasClientUsers = ['gestor@iara.com', 'marketing@iara.com', 'vendas@iara.com'].every(email => 
    parsed.some((u: any) => u.email === email && u.password === 'senha123' && u.active === true)
  );
  
  if (!hasSuperAdmin || !hasClientUsers) {
    // Reset to seed users with correct credentials
    saveUsers(seedUsers);
    console.log('[IARA] iara_users reset to demo users (missing required users):', seedUsers.map(u => u.email));
    return;
  }

  // 4) Normalize existing users (fill missing fields only)
  let updated = false;
  const normalizedUsers = parsed.map((u: any) => {
    const { normalized, changed } = normalizeUserSchema(u);
    if (changed) updated = true;
    return normalized;
  });

  if (updated) {
    saveUsers(normalizedUsers);
  }
}

// Backward compatible alias (do not remove)
export function migrateUsers(): void {
  bootstrapUsers();
}

// Migrate existing clients to new plan structure
// SEMPRE sincroniza poolsIncluded com o plano atual
export function migrateClients(): void {
  const clients = getClients();
  let updated = false;
  
  const migratedClients = clients.map(client => {
    const plan = PLANS[client.plan];
    
    // Verifica se precisa atualizar os pools para o valor do plano
    const correctPoolsIncluded = plan.poolsIncluded;
    const currentPoolsIncluded = client.poolsIncluded;
    
    // Se o poolsIncluded não corresponde ao plano atual, força atualização
    const needsUpdate = 
      currentPoolsIncluded !== correctPoolsIncluded ||
      client.userLimit !== plan.userLimit ||
      client.monthlyPrice !== plan.monthlyPrice;
    
    if (!needsUpdate) {
      return client;
    }
    
    updated = true;
    
    return {
      ...client,
      // SEMPRE usa o valor do plano (não do poolsLimit antigo)
      poolsIncluded: correctPoolsIncluded,
      poolsAdditional: client.poolsAdditional || 0,
      userLimit: plan.userLimit,
      monthlyPrice: plan.monthlyPrice,
      // Mantém legacy field por compatibilidade
      poolsLimit: correctPoolsIncluded,
    };
  });
  
  if (updated) {
    setItem(KEYS.clients, migratedClients);
    console.log('[IARA] Clients migrated to new plan structure. Pools synced with plan.');
  }
}

// Get default seed users for iara_users (4 demo accounts with different roles)
function getDefaultSeedUsers(): User[] {
  return [
    // SuperAdmin - Fundador I.ARA (acesso multi-tenant)
    {
      id: 'user_superadmin',
      clientId: null, // SuperAdmin has access to ALL clients
      name: 'Matheus Pacheco',
      role: 'superadmin',
      email: 'matheus@iara.com',
      password: 'admin2026',
      active: true,
      createdAt: new Date().toISOString().split('T')[0],
    },
    // Cliente Demo - Gestor
    {
      id: 'user_gestor',
      clientId: 'client_001',
      name: 'Gestor Demo',
      role: 'gestor',
      email: 'gestor@iara.com',
      password: 'senha123',
      active: true,
      createdAt: new Date().toISOString().split('T')[0],
    },
    // Cliente Demo - Marketing
    {
      id: 'user_marketing',
      clientId: 'client_001',
      name: 'Marketing Demo',
      role: 'marketing',
      email: 'marketing@iara.com',
      password: 'senha123',
      active: true,
      createdAt: new Date().toISOString().split('T')[0],
    },
    // Cliente Demo - Vendedor
    {
      id: 'user_vendedor',
      clientId: 'client_001',
      name: 'Vendedor Demo',
      role: 'vendedor',
      email: 'vendas@iara.com',
      password: 'senha123',
      active: true,
      createdAt: new Date().toISOString().split('T')[0],
    },
  ];
}

// Legacy alias for compatibility
function getDefaultSeedUser(): User {
  return getDefaultSeedUsers()[0];
}

// Clean up old demo users and ensure proper data structure
export function cleanupOldDemoUsers(): void {
  // First migrate existing users to add missing fields
  bootstrapUsers();
  
  // Migrate existing clients to new plan structure
  migrateClients();
  
  const usersToRemove = ['Carlos Mendes', 'Ana Oliveira', 'Pedro Santos'];
  const users = loadUsers();
  const filteredUsers = users.filter(u => !usersToRemove.includes(u.name));
  if (filteredUsers.length !== users.length) {
    saveUsers(filteredUsers);
  }
  
  // Ensure at least one default user exists for the demo client
  const currentUsers = loadUsers();
  const hasClientUser = currentUsers.some(u => u.clientId === 'client_001');
  if (!hasClientUser) {
    const defaultUser = getDefaultSeedUser();
    currentUsers.push(defaultUser);
    saveUsers(currentUsers);
    console.log('[IARA] Default user created in iara_users:', defaultUser);
  }
}

// Force reset users with correct structure (call this to fix corrupted data)
export function forceResetUsers(): void {
  const defaultUsers: User[] = [getDefaultSeedUser()];
  saveUsers(defaultUsers);
  console.log('[IARA] Users reset in iara_users with seed:', defaultUsers);
}

// Initialize iara_users with seed if empty or missing
export function initializeIdUsers(): void {
  // Keep function name for compatibility, but bootstrap iara_users.
  bootstrapUsers();
  
  // Check if iara_users has valid data
  const users = loadUsers();
  
  if (!users || users.length === 0) {
    // Create seed user
    const seedUser = getDefaultSeedUser();
    saveUsers([seedUser]);
    console.log('[IARA] iara_users initialized with seed:', seedUser);
  } else {
    console.log('[IARA] iara_users loaded with', users.length, 'users:', users);
  }
}

// Initialize Demo Data
export function initializeDemoData(): void {
  // Always cleanup old demo users first
  cleanupOldDemoUsers();
  
  // Check if already initialized
  if (getClients().length > 0) return;
  
  // Demo Client
  const demoClient: Client = {
    id: 'client_001',
    name: 'TechScale Solutions',
    status: 'active',
    plan: 'PRO',
    poolsIncluded: 3200,
    poolsAdditional: 0,
    poolsUsed: 847,
    userLimit: 10,
    monthlyPrice: 2099,
    createdAt: '2025-01-01',
    // Legacy compatibility
    poolsLimit: 3200,
  };
  saveClient(demoClient);
  
  // Demo Users with correct credentials (3 roles)
  const demoUsers: User[] = [
    {
      id: 'user_gestor',
      clientId: 'client_001',
      name: 'Gestor Demo',
      role: 'gestor',
      email: 'gestor@iara.com',
      password: 'senha123',
      active: true,
      createdAt: new Date().toISOString().split('T')[0],
    },
    {
      id: 'user_marketing',
      clientId: 'client_001',
      name: 'Marketing Demo',
      role: 'marketing',
      email: 'marketing@iara.com',
      password: 'senha123',
      active: true,
      createdAt: new Date().toISOString().split('T')[0],
    },
    {
      id: 'user_vendedor',
      clientId: 'client_001',
      name: 'Vendedor Demo',
      role: 'vendedor',
      email: 'vendas@iara.com',
      password: 'senha123',
      active: true,
      createdAt: new Date().toISOString().split('T')[0],
    },
  ];
  demoUsers.forEach(saveUser);
  
  // Demo Leads with AI status
  const origins = ['Meta Ads', 'Google Ads', 'LinkedIn', 'Organic', 'Email'];
  const statuses: Lead['status'][] = ['new', 'qualified', 'nurturing', 'cold', 'converted', 'lost'];
  const aiStatuses: LeadAIStatus[] = ['not_activated', 'ai_active', 'in_conversation', 'scheduled', 'archived'];
  const names = [
    'João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Lucas Pereira',
    'Julia Rodrigues', 'Gabriel Ferreira', 'Isabela Almeida', 'Rafael Souza', 'Camila Lima',
    'Bruno Martins', 'Leticia Gomes', 'Thiago Ribeiro', 'Fernanda Carvalho', 'Diego Nascimento',
  ];
  
  const demoLeads: Lead[] = names.map((name, i) => {
    const poolActivated = Math.random() > 0.3;
    const aiStatus: LeadAIStatus = poolActivated 
      ? aiStatuses[Math.floor(Math.random() * (aiStatuses.length - 1)) + 1]
      : 'not_activated';
    
    return {
      id: `lead_${String(i + 1).padStart(3, '0')}`,
      clientId: 'client_001',
      assignedTo: i % 3 === 0 ? 'user_003' : undefined,
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@empresa.com`,
      phone: `(11) 9${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      company: `Empresa ${String.fromCharCode(65 + (i % 10))}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      aiStatus,
      origin: origins[Math.floor(Math.random() * origins.length)],
      lastInteraction: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      score: Math.floor(Math.random() * 60) + 40,
      poolActivated,
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
  });
  demoLeads.forEach(saveLead);
  
  // Generate scores for leads
  demoLeads.forEach(lead => {
    const score = calculateScore(lead);
    saveScore(score);
    // Update lead with calculated score
    lead.score = score.scoreValue;
    saveLead(lead);
  });
  
  // Create demo conversations for leads with AI active
  demoLeads.filter(l => l.aiStatus !== 'not_activated' && l.aiStatus !== 'archived').forEach(lead => {
    createWhatsAppConversation(lead.id, lead.clientId);
    
    // Add some demo messages
    const messages: WhatsAppMessage[] = [
      {
        id: generateId('msg'),
        leadId: lead.id,
        clientId: lead.clientId,
        sender: 'ai',
        content: `Olá ${lead.name.split(' ')[0]}! Sou a assistente virtual da TechScale Solutions. Vi que você demonstrou interesse em nossos serviços. Como posso ajudá-lo hoje?`,
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        read: true,
      },
    ];
    
    if (lead.aiStatus === 'in_conversation' || lead.aiStatus === 'scheduled') {
      messages.push({
        id: generateId('msg'),
        leadId: lead.id,
        clientId: lead.clientId,
        sender: 'lead',
        content: 'Olá! Gostaria de saber mais sobre os planos disponíveis.',
        timestamp: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toISOString(),
        read: true,
      });
      messages.push({
        id: generateId('msg'),
        leadId: lead.id,
        clientId: lead.clientId,
        sender: 'ai',
        content: 'Claro! Temos três planos principais: Essencial, Growth e Pro. Cada um oferece funcionalidades diferentes. Qual seria o tamanho da sua operação atual?',
        timestamp: new Date(Date.now() - Math.random() * 6 * 60 * 60 * 1000).toISOString(),
        read: lead.aiStatus === 'scheduled',
      });
    }
    
    messages.forEach(addWhatsAppMessage);
    
    // Create activation record
    const activation: AIActivation = {
      id: generateId('activation'),
      leadId: lead.id,
      clientId: lead.clientId,
      activatedBy: 'user_001',
      activatedByName: 'Carlos Mendes',
      activatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      poolConsumed: true,
      conversationStatus: lead.aiStatus === 'scheduled' ? 'completed' : 
                          lead.aiStatus === 'archived' ? 'completed' : 'active',
    };
    saveAIActivation(activation);
  });
  
  // Demo Campaigns
  const demoCampaigns: Campaign[] = [
    {
      id: 'camp_001',
      clientId: 'client_001',
      name: 'Black Friday 2025',
      channel: 'Meta Ads',
      status: 'active',
      budget: 15000,
      spent: 8420,
      leads: 234,
      conversions: 47,
      revenue: 94000,
      startDate: '2025-11-01',
    },
    {
      id: 'camp_002',
      clientId: 'client_001',
      name: 'Captação B2B',
      channel: 'Google Ads',
      status: 'active',
      budget: 12000,
      spent: 6800,
      leads: 156,
      conversions: 28,
      revenue: 56000,
      startDate: '2025-10-15',
    },
    {
      id: 'camp_003',
      clientId: 'client_001',
      name: 'Webinar Growth',
      channel: 'LinkedIn',
      status: 'completed',
      budget: 5000,
      spent: 5000,
      leads: 89,
      conversions: 12,
      revenue: 24000,
      startDate: '2025-09-01',
      endDate: '2025-09-30',
    },
  ];
  demoCampaigns.forEach(saveCampaign);
}

// Generate unique ID
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
