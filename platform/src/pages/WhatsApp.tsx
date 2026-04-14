import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LeadAIStatusBadge, LeadAIStatusDot } from "@/components/LeadAIStatusBadge";
import { ScoreBadge } from "@/components/ScoreBadge";
import { AITypeIcon } from "@/components/AITypeIcon";
import {
  getSession,
  getLeads,
  getLead,
  getUsers,
  getClient,
  getWhatsAppConversations,
  getWhatsAppMessages,
  addWhatsAppMessage,
  markMessagesAsRead,
  simulateAIResponse,
  pauseAIForLead,
  transferToHuman,
  finishConversation,
  generateId,
  initializeDemoData,
  getLeadAIActivations,
  getActiveConversationalAI,
  getActiveConversation,
  clearActiveConversation,
  type Lead,
  type WhatsAppConversation,
  type WhatsAppMessage,
  type Client,
  type User,
} from "@/lib/storage";
import { AI_TYPES, type LeadAIActivation } from "@/lib/aiTypes";
import { 
  MessageCircle, 
  Send, 
  Pause,
  UserCheck,
  CheckCircle2,
  Phone,
  Mail,
  Building,
  Calendar,
  Target,
  Zap,
  Search,
  MoreVertical,
  Bot,
  User as UserIcon,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function WhatsApp() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeAI, setActiveAI] = useState<LeadAIActivation | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [client, setClient] = useState<Client | undefined>(undefined);
  const [user, setUser] = useState<User | undefined>(undefined);
  const [hasProcessedActiveConversation, setHasProcessedActiveConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadData = () => {
    initializeDemoData();
    
    const session = getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const clientUsers = getUsers(session.clientId);
    const userData = clientUsers.find(u => u.role === 'gestor') || clientUsers[0];
    const clientData = getClient(session.clientId);
    
    setUser(userData);
    setClient(clientData);
    
    const allConversations = getWhatsAppConversations(session.clientId);
    setConversations(allConversations);
    
    return allConversations;
  };

  // Initial load + check activeConversation (ONCE)
  useEffect(() => {
    const allConversations = loadData();
    
    // Check for activeConversation pointer (from Leads page activation) - ONLY ONCE
    if (!hasProcessedActiveConversation) {
      const pendingConversation = getActiveConversation();
      
      if (pendingConversation && allConversations) {
        // Find the conversation for this lead
        const targetConversation = allConversations.find(
          conv => conv.leadId === pendingConversation.leadId
        );
        
        if (targetConversation) {
          handleSelectConversation(targetConversation);
        }
        
        // Clear the pointer to prevent infinite loops - ATOMIC
        clearActiveConversation();
      } else if (allConversations && allConversations.length > 0 && !selectedConversation) {
        // Fallback: auto-select first conversation
        handleSelectConversation(allConversations[0]);
      }
      
      setHasProcessedActiveConversation(true);
    }
  }, [navigate]); // Only run on mount

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSelectConversation = (conversation: WhatsAppConversation) => {
    setSelectedConversation(conversation);
    const lead = getLead(conversation.leadId);
    setSelectedLead(lead || null);
    
    const msgs = getWhatsAppMessages(conversation.leadId);
    setMessages(msgs);
    
    // Get active conversational AI for this lead
    const activeConversationalAI = getActiveConversationalAI(conversation.leadId);
    setActiveAI(activeConversationalAI || null);
    
    // Mark messages as read
    markMessagesAsRead(conversation.leadId);
    loadData();
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation || !selectedLead) return;

    const message: WhatsAppMessage = {
      id: generateId("msg"),
      leadId: selectedLead.id,
      clientId: selectedLead.clientId,
      sender: "lead",
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      read: true,
    };

    addWhatsAppMessage(message);
    setMessages(prev => [...prev, message]);
    setNewMessage("");

    // Simulate AI response if conversation is active
    if (selectedConversation.status === 'active') {
      simulateAIResponse(selectedLead.id, newMessage);
      
      // Reload messages after delay to show AI response
      setTimeout(() => {
        const msgs = getWhatsAppMessages(selectedLead.id);
        setMessages(msgs);
      }, 3000);
    }
  };

  const handlePauseAI = () => {
    if (!selectedLead) return;
    
    pauseAIForLead(selectedLead.id);
    toast({
      title: "IA Pausada",
      description: "A IA foi pausada para este lead.",
    });
    loadData();
  };

  const handleTransferToHuman = () => {
    if (!selectedLead) return;
    
    transferToHuman(selectedLead.id, user?.id);
    toast({
      title: "Conversa Transferida",
      description: "A conversa foi transferida para atendimento humano.",
    });
    loadData();
    
    // Reload messages to show system message
    const msgs = getWhatsAppMessages(selectedLead.id);
    setMessages(msgs);
  };

  const handleFinishConversation = () => {
    if (!selectedLead) return;
    
    finishConversation(selectedLead.id);
    toast({
      title: "Conversa Finalizada",
      description: "A conversa foi arquivada com sucesso.",
    });
    loadData();
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv => {
    if (!search) return true;
    const lead = getLead(conv.leadId);
    if (!lead) return false;
    const searchLower = search.toLowerCase();
    return lead.name.toLowerCase().includes(searchLower) ||
           lead.email.toLowerCase().includes(searchLower) ||
           lead.company?.toLowerCase().includes(searchLower);
  });

  // Only show active conversations (leads with AI active)
  const activeConversations = filteredConversations.filter(conv => {
    const lead = getLead(conv.leadId);
    return lead && lead.aiStatus !== 'not_activated' && lead.aiStatus !== 'archived';
  });

  const isReadOnly = selectedConversation?.status === 'completed' || 
                     selectedConversation?.status === 'paused' ||
                     selectedLead?.aiStatus === 'archived';

  // Get active AIs for a lead
  const getLeadActiveAIs = (leadId: string) => {
    return getLeadAIActivations(leadId).filter(a => 
      a.status === 'active' && AI_TYPES[a.aiTypeId].conversational
    );
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Column - Conversations List */}
        <div className="w-80 border-r border-border flex flex-col bg-card/50">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">WhatsApp</h2>
              <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {activeConversations.length} ativos
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {activeConversations.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma conversa ativa
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ative a IA em um lead para iniciar
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => navigate("/leads")}
                  >
                    Ir para Leads
                  </Button>
                </div>
              ) : (
                activeConversations.map((conv) => {
                  const lead = getLead(conv.leadId);
                  if (!lead) return null;
                  
                  const isSelected = selectedConversation?.leadId === conv.leadId;
                  const lastMessageTime = new Date(conv.lastMessageAt);
                  const leadActiveAIs = getLeadActiveAIs(conv.leadId);
                  
                  return (
                    <div
                      key={conv.leadId}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer transition-all",
                        isSelected 
                          ? "bg-primary/10 border border-primary/30" 
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => handleSelectConversation(conv)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {lead.name.charAt(0)}
                            </span>
                          </div>
                          <LeadAIStatusDot 
                            status={lead.aiStatus} 
                            className="absolute -bottom-0.5 -right-0.5 ring-2 ring-background"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-foreground truncate text-sm">
                              {lead.name}
                            </p>
                            <span className="text-[10px] text-muted-foreground flex-shrink-0">
                              {lastMessageTime.toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {conv.lastMessage || "Aguardando mensagem..."}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            {/* Show active AIs */}
                            {leadActiveAIs.length > 0 ? (
                              <div className="flex items-center gap-1">
                                {leadActiveAIs.slice(0, 2).map((activation) => {
                                  const aiType = AI_TYPES[activation.aiTypeId];
                                  return (
                                    <div
                                      key={activation.id}
                                      className={cn(
                                        "p-1 rounded bg-primary/10",
                                        aiType.color
                                      )}
                                      title={aiType.name}
                                    >
                                      <AITypeIcon aiTypeId={activation.aiTypeId} size="sm" />
                                    </div>
                                  );
                                })}
                                {leadActiveAIs.length > 2 && (
                                  <span className="text-[10px] text-muted-foreground">
                                    +{leadActiveAIs.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <LeadAIStatusBadge status={lead.aiStatus} size="sm" showLabel={false} />
                            )}
                            {conv.unreadCount > 0 && (
                              <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Center Column - Conversation */}
        <div className="flex-1 flex flex-col bg-background">
          {selectedLead && selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="h-16 border-b border-border flex items-center justify-between px-4 bg-card/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {selectedLead.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{selectedLead.name}</p>
                    <div className="flex items-center gap-2">
                      {activeAI ? (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10">
                          <span className="text-primary text-xs">🟢</span>
                          <AITypeIcon aiTypeId={activeAI.aiTypeId} size="sm" className={AI_TYPES[activeAI.aiTypeId].color} />
                          <span className={cn("text-xs font-medium", AI_TYPES[activeAI.aiTypeId].color)}>
                            IA ativa: {AI_TYPES[activeAI.aiTypeId].name.replace('IA ', '')}
                          </span>
                        </div>
                      ) : (
                        <LeadAIStatusBadge status={selectedLead.aiStatus} size="sm" />
                      )}
                    </div>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border-border">
                    <DropdownMenuItem 
                      onClick={handlePauseAI}
                      disabled={selectedConversation.status !== 'active'}
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pausar IA
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleTransferToHuman}
                      disabled={selectedConversation.status === 'transferred'}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Encaminhar para Humano
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleFinishConversation}
                      className="text-destructive focus:text-destructive"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Finalizar Conversa
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/leads")}>
                      <Target className="h-4 w-4 mr-2" />
                      Gerenciar IAs do Lead
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 max-w-3xl mx-auto">
                  {messages.map((msg) => {
                    const isAI = msg.sender === 'ai';
                    const isLead = msg.sender === 'lead';
                    const msgTime = new Date(msg.timestamp);
                    
                    // Parse AI type from message if it contains the AI identifier
                    const aiTypeMatch = isAI ? msg.content.match(/^🤖\s*(.+?)\n/) : null;
                    const aiTypeName = aiTypeMatch ? aiTypeMatch[1] : null;
                    const displayActiveAI = activeAI ? AI_TYPES[activeAI.aiTypeId] : null;
                    
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-3",
                          isLead ? "justify-end" : "justify-start"
                        )}
                      >
                        {isAI && (
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            {displayActiveAI ? (
                              <AITypeIcon 
                                aiTypeId={activeAI!.aiTypeId} 
                                size="sm" 
                                className={displayActiveAI.color}
                              />
                            ) : (
                              <Bot className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        )}
                        
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-3",
                            isAI 
                              ? "bg-card border border-border rounded-tl-md" 
                              : "bg-primary text-primary-foreground rounded-tr-md"
                          )}
                        >
                          {isAI && (
                            <div className="flex items-center gap-1.5 mb-1.5">
                              {displayActiveAI ? (
                                <>
                                  <AITypeIcon 
                                    aiTypeId={activeAI!.aiTypeId} 
                                    size="sm" 
                                    className={displayActiveAI.color}
                                  />
                                  <span className={cn("text-xs font-medium", displayActiveAI.color)}>
                                    {displayActiveAI.name}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Zap className="h-3 w-3 text-primary" />
                                  <span className="text-xs font-medium text-primary">I.ARA AI</span>
                                </>
                              )}
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap">
                            {/* Remove the AI header from content if present */}
                            {aiTypeName ? msg.content.replace(/^🤖\s*.+?\n\n/, '') : msg.content}
                          </p>
                          <p className={cn(
                            "text-[10px] mt-1.5",
                            isAI ? "text-muted-foreground" : "text-primary-foreground/70"
                          )}>
                            {msgTime.toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                        
                        {isLead && (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t border-border p-4 bg-card/50">
                {isReadOnly ? (
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground">
                      Esta conversa está em modo leitura.
                      {selectedConversation.status === 'completed' && " A conversa foi finalizada."}
                      {selectedConversation.status === 'paused' && " A IA está pausada."}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => navigate("/leads")}
                    >
                      Gerenciar IAs do Lead
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 max-w-3xl mx-auto">
                    <Input
                      placeholder="Simular mensagem do lead..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button
                      variant="iara"
                      size="icon"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Selecione uma conversa
                </h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Escolha uma conversa na lista à esquerda para visualizar as mensagens e interagir com a IA.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Lead Details */}
        {selectedLead && (
          <div className="hidden xl:block w-80 border-l border-border bg-card/50 p-4 overflow-y-auto">
            <h3 className="font-semibold text-foreground mb-4">Detalhes do Lead</h3>
            
            {/* Lead Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-lg font-medium text-primary">
                    {selectedLead.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{selectedLead.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedLead.company}</p>
                </div>
              </div>

              {/* Active AIs */}
              {selectedLead && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    IAs Ativas
                  </p>
                  {getLeadActiveAIs(selectedLead.id).length > 0 ? (
                    <div className="space-y-2">
                      {getLeadActiveAIs(selectedLead.id).map((activation) => {
                        const aiType = AI_TYPES[activation.aiTypeId];
                        return (
                          <div
                            key={activation.id}
                            className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20"
                          >
                            <div className="p-1.5 rounded bg-primary/20">
                              <AITypeIcon aiTypeId={activation.aiTypeId} size="sm" className={aiType.color} />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-foreground">{aiType.name}</p>
                              <p className="text-[10px] text-muted-foreground">Ativa</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Nenhuma IA conversacional ativa</p>
                  )}
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Contato
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground truncate">{selectedLead.email}</span>
                  </div>
                  {selectedLead.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{selectedLead.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </p>
                <div className="flex items-center gap-2">
                  <LeadAIStatusBadge status={selectedLead.aiStatus} />
                </div>
              </div>

              {/* Score */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Score
                </p>
                <ScoreBadge score={selectedLead.score} size="lg" />
              </div>

              {/* Last interaction */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Última Interação
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(selectedLead.lastInteraction).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => navigate("/leads")}
              >
                <Target className="h-4 w-4" />
                Gerenciar IAs do Lead
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
