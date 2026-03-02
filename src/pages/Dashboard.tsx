import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Briefcase, CheckCircle, XCircle, Clock, TrendingUp, AlertCircle, CreditCard } from "lucide-react";
import Header from "@/components/sections/Header";

interface StatCardProps { title: string; value: string | number; subtitle?: string; icon: React.ReactNode; accent?: string; }
const StatCard = ({ title, value, subtitle, icon, accent = "text-primary" }: StatCardProps) => (
  <Card><CardContent className="pt-6">
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={`text-3xl font-bold ${accent}`}>{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="p-2 rounded-lg bg-muted">{icon}</div>
    </div>
  </CardContent></Card>
);

// All statuses -> human label + color
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:             { label: "Pending",           color: "text-yellow-600 bg-yellow-500/10" },
  waiting_for_payment: { label: "Awaiting Payment",  color: "text-orange-600 bg-orange-500/10" },
  active:              { label: "Active",             color: "text-blue-600 bg-blue-500/10" },
  in_review:           { label: "In Review",          color: "text-purple-600 bg-purple-500/10" },
  completed:           { label: "Completed",          color: "text-green-600 bg-green-500/10" },
  disputed:            { label: "Disputed",           color: "text-red-600 bg-red-500/10" },
  canceled:            { label: "Canceled",           color: "text-muted-foreground bg-muted" },
  // Legacy
  accepted:            { label: "Accepted",           color: "text-blue-600 bg-blue-500/10" },
  ongoing:             { label: "Ongoing",            color: "text-blue-600 bg-primary/10" },
};

const getStatusDisplay = (status: string) => STATUS_LABELS[status] ?? { label: status, color: "text-muted-foreground bg-muted" };

const InfluencerDashboard = ({ projects, navigate }: { projects: any[]; navigate: any }) => {
  const ACTIVE_STATUSES = ["active", "in_review", "waiting_for_payment", "accepted", "ongoing"];
  const total = projects.length;
  const completed = projects.filter(p => p.status === "completed").length;
  const canceled = projects.filter(p => p.status === "canceled").length;
  const pending = projects.filter(p => p.status === "pending").length;
  const active = projects.filter(p => ACTIVE_STATUSES.includes(p.status)).length;
  const inReview = projects.filter(p => p.status === "in_review").length;
  const awaitingPayment = projects.filter(p => p.status === "waiting_for_payment").length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const totalEarned = projects.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.offered_amount || 0), 0);
  const avgEarned = completed > 0 ? totalEarned / completed : 0;
  const recentProjects = [...projects].sort((a, b) => new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime()).slice(0, 5);

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Earned" value={`$${totalEarned.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} subtitle="From completed projects" icon={<DollarSign className="w-5 h-5 text-green-600" />} accent="text-green-600" />
        <StatCard title="Avg. Per Project" value={`$${avgEarned.toFixed(2)}`} subtitle="Completed projects" icon={<TrendingUp className="w-5 h-5 text-primary" />} />
        <StatCard title="Total Campaigns" value={total} subtitle={`${completed} completed`} icon={<Briefcase className="w-5 h-5 text-primary" />} />
        <StatCard title="Completion Rate" value={`${completionRate}%`} subtitle={`${completed} of ${total}`} icon={<CheckCircle className="w-5 h-5 text-green-500" />} accent={completionRate >= 70 ? "text-green-500" : completionRate >= 40 ? "text-yellow-500" : "text-red-500"} />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard title="Pending Offers" value={pending} subtitle="Awaiting your response" icon={<Clock className="w-5 h-5 text-yellow-500" />} accent="text-yellow-500" />
        <StatCard title="Awaiting Payment" value={awaitingPayment} subtitle="Brand needs to pay" icon={<CreditCard className="w-5 h-5 text-orange-500" />} accent="text-orange-500" />
        <StatCard title="Active Work" value={active} subtitle="In progress" icon={<TrendingUp className="w-5 h-5 text-blue-500" />} accent="text-blue-500" />
        <StatCard title="In Review" value={inReview} subtitle="Awaiting brand approval" icon={<AlertCircle className="w-5 h-5 text-purple-500" />} accent="text-purple-500" />
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Recent Projects</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>View all</Button>
        </CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-muted-foreground text-sm">No projects yet.</p>
              <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>Go to Profile</Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentProjects.map((project) => {
                const { label, color } = getStatusDisplay(project.status);
                return (
                  <div key={project.id} className="flex items-center justify-between py-3">
                    <div className="space-y-0.5 flex-1 min-w-0 mr-3">
                      <p className="font-medium text-sm truncate">{project.description?.slice(0, 60)}{project.description?.length > 60 ? "…" : ""}</p>
                      <p className="text-xs text-muted-foreground">{new Date(project.updated_at ?? project.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-semibold text-sm text-green-600">+${Number(project.offered_amount).toFixed(2)}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

const BrandDashboard = ({ projects, navigate }: { projects: any[]; navigate: any }) => {
  const ACTIVE_STATUSES = ["active", "in_review", "waiting_for_payment", "accepted", "ongoing"];
  const total = projects.length;
  const completed = projects.filter(p => p.status === "completed").length;
  const pending = projects.filter(p => p.status === "pending").length;
  const active = projects.filter(p => ACTIVE_STATUSES.includes(p.status)).length;
  const awaitingPayment = projects.filter(p => p.status === "waiting_for_payment").length;
  const inReview = projects.filter(p => p.status === "in_review").length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const totalSpent = projects.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.offered_amount || 0), 0);
  const totalCommitted = projects.filter(p => ACTIVE_STATUSES.includes(p.status)).reduce((sum, p) => sum + Number(p.offered_amount || 0), 0);
  const recentProjects = [...projects].sort((a, b) => new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime()).slice(0, 5);

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Ad Spend" value={`$${totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} subtitle="Paid to influencers" icon={<DollarSign className="w-5 h-5 text-primary" />} accent="text-primary" />
        <StatCard title="Committed Budget" value={`$${totalCommitted.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} subtitle="In active projects" icon={<TrendingUp className="w-5 h-5 text-blue-500" />} accent="text-blue-500" />
        <StatCard title="Campaigns Run" value={total} subtitle={`${completed} completed`} icon={<Briefcase className="w-5 h-5 text-primary" />} />
        <StatCard title="Success Rate" value={`${completionRate}%`} subtitle={`${completed} of ${total} completed`} icon={<CheckCircle className="w-5 h-5 text-green-500" />} accent={completionRate >= 70 ? "text-green-500" : completionRate >= 40 ? "text-yellow-500" : "text-red-500"} />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard title="Pending Responses" value={pending} subtitle="Awaiting influencer" icon={<Clock className="w-5 h-5 text-yellow-500" />} accent="text-yellow-500" />
        <StatCard title="Needs Payment" value={awaitingPayment} subtitle="Fund to activate" icon={<CreditCard className="w-5 h-5 text-orange-500" />} accent="text-orange-500" />
        <StatCard title="Active Campaigns" value={active} subtitle="Work in progress" icon={<TrendingUp className="w-5 h-5 text-blue-500" />} accent="text-blue-500" />
        <StatCard title="In Review" value={inReview} subtitle="Awaiting your approval" icon={<AlertCircle className="w-5 h-5 text-purple-500" />} accent="text-purple-500" />
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Recent Campaigns</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>View all</Button>
        </CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-muted-foreground text-sm">No campaigns yet.</p>
              <Button variant="outline" size="sm" onClick={() => navigate("/browse")}>Browse Influencers</Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentProjects.map((project) => {
                const { label, color } = getStatusDisplay(project.status);
                return (
                  <div key={project.id} className="flex items-center justify-between py-3">
                    <div className="space-y-0.5 flex-1 min-w-0 mr-3">
                      <p className="font-medium text-sm truncate">{project.description?.slice(0, 60)}{project.description?.length > 60 ? "…" : ""}</p>
                      <p className="text-xs text-muted-foreground">{new Date(project.updated_at ?? project.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-semibold text-sm text-primary">-${Number(project.offered_amount).toFixed(2)}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

const Dashboard = () => {
  const { user, ready } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!user) { navigate("/login"); return; }
    const fetchData = async () => {
      const { data: profileData } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      setProfile(profileData);
      const { data: projectsData } = await supabase.from("projects").select("*").or(`brand_user_id.eq.${user.id},influencer_user_id.eq.${user.id}`);
      setProjects(projectsData || []);
      setLoading(false);
    };
    fetchData();
  }, [user, ready, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  const isBrand = profile?.account_type === "brand";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-10 max-w-6xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Welcome back, {profile?.first_name}!</h2>
          <p className="text-muted-foreground mt-1 capitalize">
            {isBrand ? `${profile?.brand_name || "Brand"} · ` : ""}{profile?.account_type} account · @{profile?.username}
          </p>
        </div>
        {isBrand ? <BrandDashboard projects={projects} navigate={navigate} /> : <InfluencerDashboard projects={projects} navigate={navigate} />}
      </div>
    </div>
  );
};

export default Dashboard;