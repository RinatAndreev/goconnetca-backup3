import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Send, User, Briefcase, CheckCircle, XCircle,
  Clock, Filter, DollarSign, CreditCard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/sections/Header";

interface ChatMessage {
  id: string;
  from_user_id: string;
  to_user_id: string;
  content: string | null;
  message_type: "text" | "offer";
  project_id: string | null;
  listing_id: string | null;
  is_read: boolean;
  created_at: string;
  project: { id: string; status: string; description: string; offered_amount: number; selected_offers: any[] } | null;
}

interface Conversation {
  other_user_id: string;
  other_user_name: string;
  other_user_username: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  has_offer: boolean;
}

const OFFER_STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:             { label: "Pending Approval",  color: "text-yellow-600 bg-yellow-50 border-yellow-200",  icon: <Clock className="w-3.5 h-3.5" /> },
  waiting_for_payment: { label: "Awaiting Payment",  color: "text-orange-600 bg-orange-50 border-orange-200", icon: <CreditCard className="w-3.5 h-3.5" /> },
  active:              { label: "Active",             color: "text-blue-600 bg-blue-50 border-blue-200",       icon: <Briefcase className="w-3.5 h-3.5" /> },
  in_review:           { label: "In Review",          color: "text-purple-600 bg-purple-50 border-purple-200", icon: <Clock className="w-3.5 h-3.5" /> },
  completed:           { label: "Completed",          color: "text-green-700 bg-green-50 border-green-200",    icon: <CheckCircle className="w-3.5 h-3.5" /> },
  disputed:            { label: "Disputed",           color: "text-red-600 bg-red-50 border-red-200",          icon: <XCircle className="w-3.5 h-3.5" /> },
  canceled:            { label: "Declined",           color: "text-red-600 bg-red-50 border-red-200",          icon: <XCircle className="w-3.5 h-3.5" /> },
  accepted:            { label: "Accepted",           color: "text-green-600 bg-green-50 border-green-200",    icon: <CheckCircle className="w-3.5 h-3.5" /> },
  ongoing:             { label: "Ongoing",            color: "text-blue-600 bg-blue-50 border-blue-200",       icon: <Briefcase className="w-3.5 h-3.5" /> },
};

const OfferCard = ({ msg, currentUserId, onAccept, onDecline }: {
  msg: ChatMessage; currentUserId: string;
  onAccept: (id: string) => void; onDecline: (id: string) => void;
}) => {
  const project = msg.project;
  if (!project) return null;
  const isSender = msg.from_user_id === currentUserId;
  const sc = OFFER_STATUS[project.status] ?? OFFER_STATUS.pending;

  return (
    <div className={`flex ${isSender ? "justify-end" : "justify-start"} my-2`}>
      <div className="w-80 rounded-xl border-2 border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
          <Briefcase className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Campaign Offer</span>
          <span className={`ml-auto flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${sc.color}`}>
            {sc.icon} {sc.label}
          </span>
        </div>
        <div className="px-4 py-3 space-y-2">
          {project.selected_offers?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.selected_offers.map((o: any, i: number) => (
                <Badge key={i} variant="outline" className="text-xs">{o.platform} – {o.content_type}</Badge>
              ))}
            </div>
          )}
          <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>
          <div className="flex items-center gap-1.5 pt-1">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-lg font-bold text-green-600">${Number(project.offered_amount).toFixed(2)}</span>
          </div>
          {project.status === "waiting_for_payment" && (
            <p className="text-xs text-orange-600 font-medium">
              {isSender ? "Accepted! Go to Projects to fund this campaign." : "Go to Projects to complete payment."}
            </p>
          )}
          {project.status === "active" && <p className="text-xs text-blue-600">Work in progress.</p>}
          {project.status === "in_review" && <p className="text-xs text-purple-600">Deliverable submitted, awaiting review.</p>}
          {project.status === "completed" && <p className="text-xs text-green-700">Project completed. Funds released.</p>}
        </div>
        {!isSender && project.status === "pending" && (
          <div className="flex border-t border-border">
            <button onClick={() => onDecline(project.id)} className="flex-1 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border-r border-border">Decline</button>
            <button onClick={() => onAccept(project.id)} className="flex-1 py-2.5 text-sm font-medium text-green-600 hover:bg-green-50 transition-colors">Accept ✓</button>
          </div>
        )}
      </div>
    </div>
  );
};

const Messages = () => {
  const [user, setUser] = useState<any>(null);
  const [accountType, setAccountType] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showOffersOnly, setShowOffersOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [listingPrices, setListingPrices] = useState<any[]>([]);
  const [listingIdForOffer, setListingIdForOffer] = useState<string | null>(null);
  const [offerSelectedItems, setOfferSelectedItems] = useState<any[]>([]);
  const [offerDescription, setOfferDescription] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [sendingOffer, setSendingOffer] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedConvRef = useRef<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      setUser(user);
      const { data: profile } = await supabase.from("profiles").select("account_type").eq("user_id", user.id).single();
      setAccountType((profile as any)?.account_type ?? null);
      await fetchConversations(user.id);
      setLoading(false);
      const withUserId = searchParams.get("with");
      const openOffer = searchParams.get("offer") === "1";
      const listingParam = searchParams.get("listing");
      if (withUserId) {
        setSelectedConversation(withUserId);
        selectedConvRef.current = withUserId;
        await fetchMessages(user.id, withUserId);
        if (openOffer) await openOfferModalForUser(withUserId, listingParam ?? undefined);
      }
    };
    init();
  }, []);

  // Real-time: new messages + project updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("messages-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `to_user_id=eq.${user.id}` },
        async (payload) => {
          const msg = payload.new as any;
          await fetchConversations(user.id);
          if (selectedConvRef.current === msg.from_user_id) {
            await fetchMessages(user.id, msg.from_user_id);
          } else {
            const { data: sp } = await supabase.from("profiles").select("first_name, last_name").eq("user_id", msg.from_user_id).single();
            const name = sp ? `${(sp as any).first_name} ${(sp as any).last_name}` : "Someone";
            toast({
              title: msg.message_type === "offer" ? `📋 New offer from ${name}` : `💬 New message from ${name}`,
              description: msg.message_type === "offer" ? "You received a campaign offer" : msg.content?.slice(0, 60),
            });
          }
        }
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "projects" },
        async () => {
          if (user && selectedConvRef.current) await fetchMessages(user.id, selectedConvRef.current);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Keep ref in sync with state for use inside event handlers
  useEffect(() => { selectedConvRef.current = selectedConversation; }, [selectedConversation]);

  useEffect(() => {
    setFilteredConversations(showOffersOnly ? conversations.filter(c => c.has_offer) : conversations);
  }, [conversations, showOffersOnly]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const fetchConversations = async (userId: string) => {
    const { data: msgs } = await supabase.from("messages").select("from_user_id, to_user_id, content, message_type, is_read, created_at")
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`).order("created_at", { ascending: false });
    if (!msgs) return;
    const partnersMap = new Map<string, any>();
    for (const m of msgs as any[]) {
      const otherId = m.from_user_id === userId ? m.to_user_id : m.from_user_id;
      if (!partnersMap.has(otherId)) partnersMap.set(otherId, { lastMsg: m, unread: 0, hasOffer: false });
      const entry = partnersMap.get(otherId)!;
      if (!m.is_read && m.to_user_id === userId) entry.unread++;
      if (m.message_type === "offer") entry.hasOffer = true;
    }
    const partnerIds = [...partnersMap.keys()];
    if (!partnerIds.length) return;
    const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name, username").in("user_id", partnerIds);
    const pm = new Map(profiles?.map((p: any) => [p.user_id, p]) ?? []);
    const convos: Conversation[] = partnerIds.map(id => {
      const p = pm.get(id) as any;
      const entry = partnersMap.get(id)!;
      return {
        other_user_id: id,
        other_user_name: p ? `${p.first_name} ${p.last_name}` : "Unknown",
        other_user_username: p?.username ?? "",
        last_message: entry.lastMsg.message_type === "offer" ? "📋 Offer" : (entry.lastMsg.content ?? ""),
        last_message_time: entry.lastMsg.created_at,
        unread_count: entry.unread,
        has_offer: entry.hasOffer,
      };
    }).sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());
    setConversations(convos);
  };

  const fetchMessages = async (userId: string, otherId: string) => {
    const { data: rawMsgs } = await supabase.from("messages").select("*")
      .or(`and(from_user_id.eq.${userId},to_user_id.eq.${otherId}),and(from_user_id.eq.${otherId},to_user_id.eq.${userId})`)
      .order("created_at", { ascending: true });
    if (!rawMsgs) return;
    const unread = rawMsgs.filter((m: any) => m.to_user_id === userId && !m.is_read);
    if (unread.length > 0) await supabase.from("messages").update({ is_read: true } as any).in("id", unread.map((m: any) => m.id));
    const projectIds = rawMsgs.filter((m: any) => m.project_id).map((m: any) => m.project_id);
    let projectMap = new Map<string, any>();
    if (projectIds.length > 0) {
      const { data: projects } = await supabase.from("projects").select("id, status, description, offered_amount, selected_offers").in("id", projectIds);
      projectMap = new Map(projects?.map((p: any) => [p.id, p]) ?? []);
    }
    setMessages(rawMsgs.map((m: any) => ({ ...m, project: m.project_id ? (projectMap.get(m.project_id) ?? null) : null })));
  };

  const openOfferModalForUser = async (influencerUserId: string, overrideListingId?: string) => {
    let listingId = overrideListingId ?? null;
    if (!listingId) {
      const { data: listing } = await supabase.from("listings").select("id").eq("user_id", influencerUserId).eq("status", "active").maybeSingle();
      listingId = listing?.id ?? null;
    }
    let prices: any[] = [];
    if (listingId) {
      setListingIdForOffer(listingId);
      const { data } = await supabase.from("listing_prices").select("*").eq("listing_id", listingId);
      prices = data ?? [];
    }
    setListingPrices(prices);
    setOfferSelectedItems([]); setOfferDescription(""); setOfferAmount("");
    setOfferModalOpen(true);
  };

  const openOfferModal = () => { if (selectedConversation) openOfferModalForUser(selectedConversation); };

  const toggleOfferItem = (item: any) => {
    const exists = offerSelectedItems.find(o => o.platform === item.platform && o.content_type === item.content_type);
    if (exists) setOfferSelectedItems(prev => prev.filter(o => !(o.platform === item.platform && o.content_type === item.content_type)));
    else setOfferSelectedItems(prev => [...prev, item]);
  };

  const sendMessage = async () => {
    if (!user || !selectedConversation || !newMessage.trim()) return;
    await supabase.from("messages").insert({ from_user_id: user.id, to_user_id: selectedConversation, content: newMessage.trim(), message_type: "text" } as any);
    setNewMessage("");
    await fetchMessages(user.id, selectedConversation);
    await fetchConversations(user.id);
  };

  const sendOffer = async () => {
    if (!user || !selectedConversation) return;
    if (!offerSelectedItems.length || !offerDescription.trim() || !offerAmount) { toast({ title: "Please fill in all offer fields", variant: "destructive" }); return; }
    if (!listingIdForOffer) { toast({ title: "This influencer doesn't have an active listing", variant: "destructive" }); return; }
    setSendingOffer(true);
    try {
      const { data: project, error: projErr } = await supabase.from("projects").insert({
        listing_id: listingIdForOffer, brand_user_id: user.id, influencer_user_id: selectedConversation,
        selected_offers: offerSelectedItems, description: offerDescription.trim(),
        offered_amount: Number(offerAmount), status: "pending",
      } as any).select().single();
      if (projErr || !project) throw projErr;
      await supabase.from("messages").insert({ from_user_id: user.id, to_user_id: selectedConversation, content: null, message_type: "offer", project_id: (project as any).id, listing_id: listingIdForOffer } as any);
      setOfferModalOpen(false);
      await fetchMessages(user.id, selectedConversation);
      await fetchConversations(user.id);
      toast({ title: "Offer sent!" });
    } catch { toast({ title: "Failed to send offer", variant: "destructive" }); }
    finally { setSendingOffer(false); }
  };

  const handleAcceptOffer = async (projectId: string) => {
    await supabase.from("projects").update({ status: "waiting_for_payment", updated_at: new Date().toISOString() } as any).eq("id", projectId);
    toast({ title: "Offer accepted! Brand needs to fund the project 💰" });
    if (user && selectedConversation) await fetchMessages(user.id, selectedConversation);
  };

  const handleDeclineOffer = async (projectId: string) => {
    await supabase.from("projects").update({ status: "canceled", updated_at: new Date().toISOString() } as any).eq("id", projectId);
    toast({ title: "Offer declined" });
    if (user && selectedConversation) await fetchMessages(user.id, selectedConversation);
  };

  const selectConversation = async (otherId: string) => {
    setSelectedConversation(otherId);
    selectedConvRef.current = otherId;
    if (user) await fetchMessages(user.id, otherId);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading messages...</p></div>;

  const isBrand = accountType === "brand";
  const selectedConvInfo = conversations.find(c => c.other_user_id === selectedConversation);

  return (
    <div className="bg-background flex flex-col" style={{ height: "100vh" }}>
      <Header />
      <div className="flex flex-col flex-1 min-h-0" style={{ marginTop: "64px", height: "calc(100vh - 64px)" }}>
        <div className="px-4 py-3 border-b border-border flex-shrink-0">
          <h2 className="text-xl font-bold">Messages</h2>
        </div>

        {conversations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <p className="text-muted-foreground mb-4">No messages yet. Start a conversation from a listing!</p>
              <Button onClick={() => navigate("/browse")}>Browse Listings</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 min-h-0">
            {/* Sidebar */}
            <div className="w-72 flex-shrink-0 flex flex-col border-r border-border">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border flex-shrink-0">
                <Checkbox id="offersOnly" checked={showOffersOnly} onCheckedChange={(v) => setShowOffersOnly(!!v)} />
                <label htmlFor="offersOnly" className="text-sm text-muted-foreground cursor-pointer flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> With offers only
                </label>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center p-6">No conversations match the filter</p>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredConversations.map((conv) => (
                      <button key={conv.other_user_id} onClick={() => selectConversation(conv.other_user_id)}
                        className={`w-full p-3 text-left hover:bg-muted/50 transition-colors ${selectedConversation === conv.other_user_id ? "bg-muted" : ""}`}>
                        <div className="flex items-start gap-2.5">
                          <Avatar className="w-9 h-9 flex-shrink-0"><AvatarFallback className="text-xs"><User className="w-4 h-4" /></AvatarFallback></Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-semibold text-sm truncate">{conv.other_user_name}</p>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {conv.has_offer && <span title="Has offer" className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center"><Briefcase className="w-2.5 h-2.5 text-primary" /></span>}
                                {conv.unread_count > 0 && <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">{conv.unread_count}</span>}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">@{conv.other_user_username}</p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              {!selectedConversation ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">Select a conversation to start messaging</div>
              ) : (
                <>
                  <div className="border-b border-border px-4 py-3 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8"><AvatarFallback><User className="w-4 h-4" /></AvatarFallback></Avatar>
                      <div>
                        <p className="font-semibold text-sm">{selectedConvInfo?.other_user_name}</p>
                        <p className="text-xs text-muted-foreground">@{selectedConvInfo?.other_user_username}</p>
                      </div>
                    </div>
                    {isBrand && <Button size="sm" variant="outline" onClick={openOfferModal} className="gap-2"><Briefcase className="w-3.5 h-3.5" /> Send Offer</Button>}
                  </div>
                  {/* THIS div scrolls, not the page */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
                    {messages.map((msg) => {
                      if (msg.message_type === "offer") return <OfferCard key={msg.id} msg={msg} currentUserId={user?.id} onAccept={handleAcceptOffer} onDecline={handleDeclineOffer} />;
                      const isMine = msg.from_user_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isMine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"}`}>
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-xs mt-1 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="border-t border-border px-4 py-3 flex gap-2 flex-shrink-0">
                    <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..."
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} className="flex-1" />
                    <Button size="icon" onClick={sendMessage} disabled={!newMessage.trim()}><Send className="w-4 h-4" /></Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Offer Modal */}
      <Dialog open={offerModalOpen} onOpenChange={setOfferModalOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary" /> Send Offer</DialogTitle>
          </DialogHeader>
          {listingPrices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No pricing found for this influencer's listing.</p>
          ) : (
            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              <div className="space-y-2">
                <Label>Select Ad Types</Label>
                <div className="space-y-2 max-h-44 overflow-y-auto border border-border rounded-lg p-2">
                  {listingPrices.map((price: any) => {
                    const isSelected = offerSelectedItems.some(o => o.platform === price.platform && o.content_type === price.content_type);
                    return (
                      <label key={price.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleOfferItem(price)} />
                        <span className="flex-1 text-sm">{price.platform} — {price.content_type}</span>
                        <span className="text-sm font-semibold text-green-600">${Number(price.price).toFixed(2)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Campaign Description</Label>
                <Textarea value={offerDescription} onChange={(e) => setOfferDescription(e.target.value)} placeholder="Describe the campaign..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Offer Amount ($)</Label>
                <Input type="number" min="0" step="0.01" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} placeholder="500.00" />
              </div>
              <div className="flex gap-2 pb-2">
                <Button onClick={sendOffer} disabled={sendingOffer} className="flex-1 gradient-brand text-primary-foreground">{sendingOffer ? "Sending..." : "Send Offer"}</Button>
                <Button variant="outline" onClick={() => setOfferModalOpen(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Messages;