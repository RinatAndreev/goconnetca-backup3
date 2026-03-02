import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Briefcase, CreditCard, Upload, CheckCircle, AlertCircle, ExternalLink, Clock, DollarSign, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/sections/Header";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "");

interface Project {
  id: string; listing_id: string; brand_user_id: string; influencer_user_id: string;
  selected_offers: any[]; description: string; offered_amount: number;
  status: string; payment_status: string; stripe_payment_intent_id?: string;
  stripe_amount_cents?: number; deliverable_url?: string; deliverable_note?: string;
  completed_at?: string; created_at: string; updated_at: string;
  brand_profile?: { first_name: string; last_name: string; username: string };
  influencer_profile?: { first_name: string; last_name: string; username: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  pending:             { label: "Pending",             color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",  description: "Offer sent, awaiting influencer response" },
  waiting_for_payment: { label: "Awaiting Payment",    color: "bg-orange-500/10 text-orange-600 border-orange-500/30", description: "Accepted! Brand needs to fund the project" },
  active:              { label: "Active",               color: "bg-blue-500/10 text-blue-600 border-blue-500/30",       description: "Funds held in escrow, work in progress" },
  in_review:           { label: "In Review",            color: "bg-purple-500/10 text-purple-600 border-purple-500/30", description: "Influencer submitted work, awaiting brand approval" },
  completed:           { label: "Completed",            color: "bg-green-500/10 text-green-600 border-green-500/30",    description: "Work approved, funds released" },
  disputed:            { label: "Disputed",             color: "bg-red-500/10 text-red-600 border-red-500/30",          description: "Under review by platform" },
  canceled:            { label: "Canceled",             color: "bg-muted text-muted-foreground border-border",          description: "Project was canceled" },
  accepted:            { label: "Accepted (Legacy)",    color: "bg-blue-500/10 text-blue-600 border-blue-500/30",       description: "Legacy: accepted" },
  ongoing:             { label: "Ongoing (Legacy)",     color: "bg-primary/10 text-primary border-primary/20",          description: "Legacy: ongoing" },
};

// ── Stripe Checkout Form ───────────────────────────────────────────────────────
const CheckoutForm = ({ projectId, amountCents, onSuccess, onCancel }: {
  projectId: string; amountCents: number; onSuccess: () => void; onCancel: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    const { error } = await stripe.confirmPayment({ elements, redirect: "if_required" });
    if (error) { toast({ title: `Payment failed: ${error.message}`, variant: "destructive" }); setPaying(false); }
    else { toast({ title: "Payment successful! Project is now active." }); onSuccess(); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 rounded-lg bg-muted/50 border border-border text-sm space-y-1">
        <div className="flex justify-between"><span className="text-muted-foreground">Project amount</span><span className="font-medium">${(amountCents / 100).toFixed(2)}</span></div>
        <div className="flex justify-between text-xs text-muted-foreground"><span>Platform fee (10%)</span><span>${(amountCents * 0.1 / 100).toFixed(2)}</span></div>
        <div className="flex justify-between font-semibold border-t border-border pt-1"><span>Total charged</span><span>${(amountCents / 100).toFixed(2)}</span></div>
        <p className="text-xs text-muted-foreground pt-1">Funds are held in escrow until you approve the work.</p>
      </div>
      <PaymentElement />
      <div className="flex gap-3">
        <Button type="submit" disabled={!stripe || paying} className="flex-1 gap-2 gradient-brand text-primary-foreground">
          <CreditCard className="w-4 h-4" />{paying ? "Processing..." : `Pay $${(amountCents / 100).toFixed(2)}`}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
      <p className="text-xs text-center text-muted-foreground">🔒 Test mode — use card <strong>4242 4242 4242 4242</strong>, any future date, any CVC</p>
    </form>
  );
};

// ── Project Card ───────────────────────────────────────────────────────────────
const ProjectCard = ({ project, userId, accountType, onRefresh }: {
  project: Project; userId: string; accountType: string | null; onRefresh: () => void;
}) => {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [deliverableNote, setDeliverableNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const isBrand = accountType === "brand";
  const isInfluencer = accountType === "influencer";
  const sc = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.pending;

  const handleOpenPayment = async () => {
    setLoadingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment-intent", { body: { project_id: project.id } });
      if (error) throw error;
      setClientSecret(data.client_secret);
      setPaymentModalOpen(true);
    } catch (err: any) {
      toast({ title: err.message || "Failed to create payment intent", variant: "destructive" });
    } finally { setLoadingPayment(false); }
  };

  const handleSubmitDeliverable = async () => {
    if (!deliverableUrl.trim()) { toast({ title: "Please provide a URL", variant: "destructive" }); return; }
    setSubmitting(true);
    const { error } = await supabase.from("projects").update({ status: "in_review", deliverable_url: deliverableUrl.trim(), deliverable_note: deliverableNote.trim() || null, updated_at: new Date().toISOString() } as any).eq("id", project.id);
    if (error) toast({ title: "Failed to submit", variant: "destructive" });
    else { toast({ title: "Work submitted! Waiting for brand approval." }); setSubmitModalOpen(false); onRefresh(); }
    setSubmitting(false);
  };

  const handleApprove = async () => {
    if (!confirm("Approve this work and release funds to the influencer?")) return;
    const { error } = await supabase.from("projects").update({ status: "completed", payment_status: "paid", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any).eq("id", project.id);
    if (error) toast({ title: "Failed to approve", variant: "destructive" });
    else { toast({ title: "Work approved! Funds released. 🎉" }); onRefresh(); }
  };

  const handleRequestRevision = async () => {
    await supabase.from("projects").update({ status: "active", updated_at: new Date().toISOString() } as any).eq("id", project.id);
    toast({ title: "Revision requested." }); onRefresh();
  };

  const handleDispute = async () => {
    if (!confirm("Raise a dispute?")) return;
    await supabase.from("projects").update({ status: "disputed", updated_at: new Date().toISOString() } as any).eq("id", project.id);
    toast({ title: "Dispute raised." }); onRefresh();
  };

  const handleCancel = async () => {
    if (!confirm("Cancel this project?")) return;
    await supabase.from("projects").update({ status: "canceled", updated_at: new Date().toISOString() } as any).eq("id", project.id);
    toast({ title: "Project canceled." }); onRefresh();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl">
              {isBrand ? `${project.influencer_profile?.first_name} ${project.influencer_profile?.last_name}` : `${project.brand_profile?.first_name} ${project.brand_profile?.last_name}`}
            </CardTitle>
            <p className="text-sm text-muted-foreground">@{isBrand ? project.influencer_profile?.username : project.brand_profile?.username}</p>
            <p className="text-xs text-muted-foreground">{sc.description}</p>
          </div>
          <Badge className={`${sc.color} border whitespace-nowrap`}>{sc.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">{project.selected_offers.map((o: any, i: number) => <Badge key={i} variant="outline">{o.platform} — {o.content_type}</Badge>)}</div>
        <p className="text-sm text-muted-foreground">{project.description}</p>
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-600" />
          <span className="text-2xl font-bold text-green-600">${Number(project.offered_amount).toFixed(2)}</span>
          {project.payment_status === "paid" && <Badge className="bg-green-500/10 text-green-600 border-green-500/30 border ml-1">Paid ✓</Badge>}
        </div>
        {project.deliverable_url && (
          <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-1">
            <p className="text-sm font-semibold flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> Submitted Work</p>
            <a href={project.deliverable_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">{project.deliverable_url} <ExternalLink className="w-3 h-3" /></a>
            {project.deliverable_note && <p className="text-xs text-muted-foreground">{project.deliverable_note}</p>}
          </div>
        )}
        {project.completed_at && <p className="text-xs text-muted-foreground">Completed {new Date(project.completed_at).toLocaleDateString()}</p>}

        <div className="pt-2 border-t border-border space-y-2">
          {isInfluencer && project.status === "pending" && project.influencer_user_id === userId && (
            <div className="flex gap-2">
              <Button className="flex-1" onClick={async () => { await supabase.from("projects").update({ status: "waiting_for_payment", updated_at: new Date().toISOString() } as any).eq("id", project.id); toast({ title: "Accepted! Brand will now fund the project." }); onRefresh(); }}>Accept Offer</Button>
              <Button variant="outline" className="flex-1" onClick={handleCancel}>Decline</Button>
            </div>
          )}
          {isBrand && project.status === "waiting_for_payment" && project.brand_user_id === userId && (
            <Button className="w-full gap-2 gradient-brand text-primary-foreground" onClick={handleOpenPayment} disabled={loadingPayment}>
              <CreditCard className="w-4 h-4" />{loadingPayment ? "Loading..." : `Fund Project — $${Number(project.offered_amount).toFixed(2)}`}
            </Button>
          )}
          {isInfluencer && project.status === "active" && project.influencer_user_id === userId && (
            <Button className="w-full gap-2" onClick={() => setSubmitModalOpen(true)}><Upload className="w-4 h-4" /> Submit Deliverables</Button>
          )}
          {isBrand && project.status === "in_review" && project.brand_user_id === userId && (
            <div className="space-y-2">
              <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={handleApprove}><CheckCircle className="w-4 h-4" /> Approve & Release Funds</Button>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleRequestRevision}>Request Revision</Button>
                <Button variant="outline" className="flex-1 text-red-600 hover:text-red-700" onClick={handleDispute}><AlertCircle className="w-3.5 h-3.5 mr-1" /> Dispute</Button>
              </div>
            </div>
          )}
          {["active", "in_review"].includes(project.status) && (
            <div className="flex justify-end"><Button variant="ghost" size="sm" className="text-muted-foreground text-xs" onClick={handleDispute}>Report issue</Button></div>
          )}
          {["pending", "waiting_for_payment"].includes(project.status) && (
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground text-xs" onClick={handleCancel}>Cancel project</Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Created {new Date(project.created_at).toLocaleDateString()} · Updated {new Date(project.updated_at).toLocaleDateString()}</p>
      </CardContent>

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={(open) => { if (!open) { setPaymentModalOpen(false); setClientSecret(null); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Fund Project</DialogTitle></DialogHeader>
          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
              <CheckoutForm projectId={project.id} amountCents={project.stripe_amount_cents ?? Math.round(Number(project.offered_amount) * 100)}
                onSuccess={() => { setPaymentModalOpen(false); setClientSecret(null); setTimeout(onRefresh, 2000); }}
                onCancel={() => { setPaymentModalOpen(false); setClientSecret(null); }} />
            </Elements>
          )}
        </DialogContent>
      </Dialog>

      {/* Submit Deliverable Modal */}
      <Dialog open={submitModalOpen} onOpenChange={setSubmitModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Upload className="w-5 h-5 text-primary" /> Submit Your Work</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Link to your work *</Label>
              <Input value={deliverableUrl} onChange={(e) => setDeliverableUrl(e.target.value)} placeholder="https://instagram.com/p/your-post-id" />
              <p className="text-xs text-muted-foreground">Instagram post, TikTok, YouTube, Drive link, etc.</p>
            </div>
            <div className="space-y-2">
              <Label>Note to brand (optional)</Label>
              <Textarea value={deliverableNote} onChange={(e) => setDeliverableNote(e.target.value)} placeholder="Any notes..." rows={3} />
            </div>
            <Button onClick={handleSubmitDeliverable} disabled={submitting} className="w-full gap-2">
              <Upload className="w-4 h-4" />{submitting ? "Submitting..." : "Submit for Review"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// ── Main Projects Page ─────────────────────────────────────────────────────────
type SortKey = "updated_at" | "created_at";
type SortDir = "desc" | "asc";

const Projects = () => {
  const { user, ready } = useAuth();
  const [accountType, setAccountType] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!user) { navigate("/login"); return; }
    const init = async () => {
      const { data: profile } = await supabase.from("profiles").select("account_type").eq("user_id", user.id).single();
      setAccountType((profile as any)?.account_type ?? null);
      await fetchProjects(user.id);
    };
    init();
  }, [user, ready, navigate]);

  const fetchProjects = async (userId: string) => {
    setLoading(true);
    const { data } = await supabase.from("projects").select("*").or(`brand_user_id.eq.${userId},influencer_user_id.eq.${userId}`).order("updated_at", { ascending: false });
    if (!data || !data.length) { setProjects([]); setLoading(false); return; }
    const allIds = [...new Set([...data.map((p: any) => p.brand_user_id), ...data.map((p: any) => p.influencer_user_id)])];
    const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name, username").in("user_id", allIds);
    const pm = new Map(profiles?.map((p: any) => [p.user_id, p]) ?? []);
    setProjects(data.map((p: any) => ({ ...p, brand_profile: pm.get(p.brand_user_id), influencer_profile: pm.get(p.influencer_user_id) })));
    setLoading(false);
  };

  const TAB_FILTERS: Record<string, (p: Project) => boolean> = {
    all:       () => true,
    pending:   (p) => p.status === "pending",
    payment:   (p) => p.status === "waiting_for_payment",
    active:    (p) => ["active", "in_review", "accepted", "ongoing"].includes(p.status),
    completed: (p) => p.status === "completed",
    issues:    (p) => ["disputed", "canceled"].includes(p.status),
  };

  const TAB_LABELS: Record<string, string> = { all: "All", pending: "Pending", payment: "Needs Payment", active: "Active", completed: "Completed", issues: "Issues" };

  const sortedProjects = (list: Project[]) =>
    [...list].sort((a, b) => {
      const av = new Date(a[sortKey] ?? a.created_at).getTime();
      const bv = new Date(b[sortKey] ?? b.created_at).getTime();
      return sortDir === "desc" ? bv - av : av - bv;
    });

  const refresh = user ? () => fetchProjects(user.id) : () => {};

  if (loading) return <div className="min-h-screen bg-background"><Header /><div className="flex items-center justify-center h-screen"><p className="text-muted-foreground">Loading...</p></div></div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-10 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-primary" />
            <h2 className="text-3xl font-bold">Projects</h2>
          </div>
          {/* Sort controls */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="w-44 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_at">Latest Status Change</SelectItem>
                <SelectItem value="created_at">Date Created</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-8 px-3 text-sm" onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}>
              {sortDir === "desc" ? "Newest first" : "Oldest first"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            {Object.entries(TAB_LABELS).map(([key, label]) => {
              const count = projects.filter(TAB_FILTERS[key]).length;
              return (
                <TabsTrigger key={key} value={key} className="gap-1.5">
                  {label}
                  {count > 0 && <span className="bg-primary/20 text-primary rounded-full px-1.5 py-px text-xs font-medium">{count}</span>}
                </TabsTrigger>
              );
            })}
          </TabsList>
          {Object.keys(TAB_LABELS).map((tab) => (
            <TabsContent key={tab} value={tab}>
              {sortedProjects(projects.filter(TAB_FILTERS[tab])).length === 0 ? (
                <Card className="p-12 text-center"><Clock className="w-10 h-10 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">No projects here.</p></Card>
              ) : (
                <div className="grid gap-5">
                  {sortedProjects(projects.filter(TAB_FILTERS[tab])).map((p) => (
                    <ProjectCard key={p.id} project={p} userId={user?.id ?? ""} accountType={accountType} onRefresh={refresh} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Projects;