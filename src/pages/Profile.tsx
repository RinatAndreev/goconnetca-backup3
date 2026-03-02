import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  User, Mail, Globe, Instagram, Pencil, Save, X, ArrowLeft,
  FileText, MessageSquare, Briefcase, Settings, Plus, Trash2, Upload, ExternalLink, LayoutDashboard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/sections/Header";

const PLATFORMS = ["YouTube", "TikTok", "Instagram", "Pinterest", "X", "LinkedIn"];
const CONTENT_TYPES: Record<string, string[]> = {
  YouTube: ["Full Promo Video", "30-60s Promo in Video"],
  TikTok: ["Video"],
  Instagram: ["Post", "Story", "Reel"],
  Pinterest: ["Pin"],
  X: ["Post", "Thread"],
  LinkedIn: ["Post", "Article"],
};
const LANGUAGES = ["English", "Spanish", "French", "German", "Portuguese", "Russian", "Japanese", "Korean", "Chinese", "Arabic", "Hindi", "Other"];

type Tab = "listing" | "messages" | "projects" | "settings";

function getSocialUrl(platform: string, username: string): string {
  const clean = username.replace(/^@/, "");
  switch (platform) {
    case "Instagram": return `https://instagram.com/${clean}`;
    case "TikTok":    return `https://tiktok.com/@${clean}`;
    case "YouTube":   return `https://youtube.com/@${clean}`;
    case "X":         return `https://x.com/${clean}`;
    case "LinkedIn":  return `https://linkedin.com/in/${clean}`;
    case "Pinterest": return `https://pinterest.com/${clean}`;
    default:          return `https://${platform.toLowerCase()}.com/${clean}`;
  }
}

// ─── My Listing Tab ────────────────────────────────────────────────────────────
const MyListingTab = ({ userId }: { userId: string }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // editable fields
  const [description, setDescription] = useState("");
  const [contentLanguage, setContentLanguage] = useState("English");
  const [socialMedia, setSocialMedia] = useState<{ id?: string; platform: string; username: string }[]>([]);
  const [prices, setPrices] = useState<{ id?: string; platform: string; content_type: string; price: string }[]>([]);
  const [images, setImages] = useState<{ id: string; image_url: string; position: number }[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  useEffect(() => { fetchListing(); }, [userId]);

  const fetchListing = async () => {
    setLoading(true);
    const { data } = await supabase.from("listings").select("*").eq("user_id", userId).eq("status", "active").maybeSingle();
    if (!data) { setLoading(false); return; }
    setListing(data);
    setDescription(data.description);
    setContentLanguage(data.content_language);

    const [smRes, prRes, imgRes] = await Promise.all([
      supabase.from("listing_social_media").select("*").eq("listing_id", data.id),
      supabase.from("listing_prices").select("*").eq("listing_id", data.id),
      supabase.from("listing_images").select("*").eq("listing_id", data.id).order("position"),
    ]);
    setSocialMedia((smRes.data || []).map((s: any) => ({ id: s.id, platform: s.platform, username: s.username })));
    setPrices((prRes.data || []).map((p: any) => ({ id: p.id, platform: p.platform, content_type: p.content_type, price: String(p.price) })));
    setImages(imgRes.data || []);
    setLoading(false);
  };

  const updateSocialMedia = (idx: number, field: string, value: string) => {
    setSocialMedia((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      // if platform changed, reset content types for prices from this platform
      return updated;
    });
    // regenerate prices when platform changes
    if (field === "platform") {
      setPrices((prev) => {
        const existing = prev.filter((p) => p.platform !== socialMedia[idx]?.platform);
        const types = CONTENT_TYPES[value] || [];
        const newPrices = types.map((ct) => ({ platform: value, content_type: ct, price: "0" }));
        return [...existing, ...newPrices];
      });
    }
  };

  const addSocialMedia = () => setSocialMedia((prev) => [...prev, { platform: "", username: "" }]);
  const removeSocialMedia = (idx: number) => {
    const removed = socialMedia[idx];
    setSocialMedia((prev) => prev.filter((_, i) => i !== idx));
    if (removed.platform) setPrices((prev) => prev.filter((p) => p.platform !== removed.platform));
  };

  const updatePrice = (idx: number, value: string) => setPrices((prev) => { const u = [...prev]; u[idx] = { ...u[idx], price: value }; return u; });

  const handleNewImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewImages((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setNewImagePreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeExistingImage = async (imgId: string) => {
    await supabase.from("listing_images").delete().eq("id", imgId);
    setImages((prev) => prev.filter((i) => i.id !== imgId));
  };

  const removeNewImage = (idx: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== idx));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!listing) return;
    setSaving(true);
    try {
      // Update listing
      await supabase.from("listings").update({ description, content_language: contentLanguage } as any).eq("id", listing.id);

      // Rebuild social media
      await supabase.from("listing_social_media").delete().eq("listing_id", listing.id);
      const validSocial = socialMedia.filter((s) => s.platform && s.username);
      if (validSocial.length > 0) {
        await supabase.from("listing_social_media").insert(validSocial.map((s) => ({ listing_id: listing.id, platform: s.platform, username: s.username })) as any);
      }

      // Rebuild prices
      await supabase.from("listing_prices").delete().eq("listing_id", listing.id);
      const validPrices = prices.filter((p) => p.platform && p.content_type && Number(p.price) >= 0);
      if (validPrices.length > 0) {
        await supabase.from("listing_prices").insert(validPrices.map((p) => ({ listing_id: listing.id, platform: p.platform, content_type: p.content_type, price: Number(p.price) })) as any);
      }

      // Upload new images
      let pos = images.length;
      for (const file of newImages) {
        const path = `${userId}/${listing.id}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage.from("listing-images").upload(path, file);
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("listing-images").getPublicUrl(path);
          await supabase.from("listing_images").insert({ listing_id: listing.id, image_url: urlData.publicUrl, position: pos++ } as any);
        }
      }

      toast({ title: "Listing updated!" });
      setEditing(false);
      setNewImages([]);
      setNewImagePreviews([]);
      fetchListing();
    } catch {
      toast({ title: "Failed to update listing", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteListing = async () => {
  if (!listing) return;
  if (!confirm("Delete your listing permanently? This cannot be undone.")) return;

  try {
    // 1. Delete images from Supabase Storage
    if (images.length > 0) {
      // Extract storage paths from public URLs
      // URL format: https://<project>.supabase.co/storage/v1/object/public/listing-images/USER_ID/...
      const storagePaths = images
        .map((img) => {
          try {
            const url = new URL(img.image_url);
            // Path after "/listing-images/" is the storage key
            const match = url.pathname.match(/\/listing-images\/(.+)$/);
            return match ? match[1] : null;
          } catch {
            return null;
          }
        })
        .filter(Boolean) as string[];

      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("listing-images")
          .remove(storagePaths);
        if (storageError) {
          console.warn("Failed to delete some storage files:", storageError.message);
          // Don't block deletion — continue anyway
        }
      }
    }

    // 2. Hard-delete the listing row
    // Because listing_social_media, listing_prices, listing_images all have
    // ON DELETE CASCADE, this single delete removes everything from all 4 tables.
    const { error: dbError } = await supabase
      .from("listings")
      .delete()
      .eq("id", listing.id);

    if (dbError) throw dbError;

    toast({ title: "Listing deleted completely." });
    setListing(null);
    setImages([]);
    setSocialMedia([{ platform: "", username: "" }]);
    setPrices([]);
  } catch (err: any) {
    toast({ title: `Failed to delete listing: ${err.message}`, variant: "destructive" });
  }
};

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  if (!listing) {
    return (
      <div className="text-center py-16 space-y-4">
        <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">You don't have an active listing yet.</p>
        <Button onClick={() => navigate("/create-listing")} className="gap-2 gradient-brand text-primary-foreground">
          <Plus className="w-4 h-4" /> Create Listing
        </Button>
      </div>
    );
  }

  if (!editing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">My Listing</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-2"><Pencil className="w-4 h-4" /> Edit</Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteListing}>Delete</Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-foreground">{listing.description}</p>
            <Badge variant="secondary">{listing.content_language}</Badge>

            {images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img) => (
                  <img key={img.id} src={img.image_url} alt="" className="w-24 h-24 rounded-lg object-cover" />
                ))}
              </div>
            )}

            <div className="space-y-1">
              <p className="text-sm font-semibold">Social Media</p>
              <div className="flex flex-wrap gap-1.5">
                {socialMedia.map((s, i) => (
                  <a key={i} href={getSocialUrl(s.platform, s.username)} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-border text-xs font-medium hover:bg-accent hover:border-primary transition-colors">
                    {s.platform}: {s.username} <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold">Pricing</p>
              {prices.map((p, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{p.platform} — {p.content_type}</span>
                  <span className="font-medium">${Number(p.price).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Edit Listing</h2>
        <Button variant="ghost" size="sm" onClick={() => { setEditing(false); fetchListing(); }} className="gap-2"><X className="w-4 h-4" /> Cancel</Button>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
      </div>

      {/* Language */}
      <div className="space-y-2">
        <Label>Content Language</Label>
        <Select value={contentLanguage} onValueChange={setContentLanguage}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Social Media */}
      <div className="space-y-3">
        <Label>Social Media Accounts</Label>
        {socialMedia.map((sm, idx) => (
          <div key={idx} className="flex gap-3 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Platform</Label>
              <Select value={sm.platform} onValueChange={(v) => updateSocialMedia(idx, "platform", v)}>
                <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
                <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Username</Label>
              <Input value={sm.username} onChange={(e) => updateSocialMedia(idx, "username", e.target.value)} placeholder="@username" />
            </div>
            {socialMedia.length > 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => removeSocialMedia(idx)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addSocialMedia} className="gap-2"><Plus className="w-4 h-4" /> Add Social Media</Button>
      </div>

      {/* Pricing */}
      {prices.length > 0 && (
        <div className="space-y-3">
          <Label>Pricing</Label>
          {prices.map((p, idx) => (
            <div key={`${p.platform}-${p.content_type}`} className="flex items-center gap-3">
              <span className="text-sm font-medium min-w-[100px]">{p.platform}</span>
              <span className="text-sm text-muted-foreground min-w-[160px]">{p.content_type}</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">$</span>
                <Input type="number" min="0" step="0.01" value={p.price} onChange={(e) => updatePrice(idx, e.target.value)} className="w-28" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Images */}
      <div className="space-y-3">
        <Label>Images</Label>
        <div className="flex flex-wrap gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
              <img src={img.image_url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeExistingImage(img.id)} className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {newImagePreviews.map((src, idx) => (
            <div key={`new-${idx}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border border-dashed">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeNewImage(idx)} className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <label className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
            <Upload className="w-5 h-5 text-muted-foreground" />
            <input type="file" accept="image/*" multiple onChange={handleNewImages} className="hidden" />
          </label>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2 gradient-brand text-primary-foreground">
        <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
};

// ─── Settings Tab ──────────────────────────────────────────────────────────────
const SettingsTab = ({ profile, onUpdate }: { profile: any; onUpdate: (p: any) => void }) => {
  const { toast } = useToast();
  const [form, setForm] = useState<any>(profile || {});
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => { setForm(profile || {}); }, [profile]);

  const handleChange = (field: string, value: string) => setForm((prev: any) => ({ ...prev, [field]: value }));

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      first_name: form.first_name,
      last_name: form.last_name,
      username: form.username,
      instagram_username: form.instagram_username,
      brand_name: form.brand_name,
      brand_website_or_instagram: form.brand_website_or_instagram,
    }).eq("user_id", profile.user_id);
    setSaving(false);
    if (error) { toast({ title: "Error saving profile", description: error.message, variant: "destructive" }); return; }
    onUpdate({ ...profile, ...form });
    toast({ title: "Profile updated!" });
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    if (newPassword.length < 6) { toast({ title: "Password must be at least 6 characters", variant: "destructive" }); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { toast({ title: "Failed to change password", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Password changed successfully!" });
    setNewPassword(""); setConfirmPassword(""); setChangingPassword(false);
  };

  const isInfluencer = profile?.account_type === "influencer";

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader><CardTitle>Account Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input value={form.first_name || ""} onChange={(e) => handleChange("first_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input value={form.last_name || ""} onChange={(e) => handleChange("last_name", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Username</Label>
            <Input value={form.username || ""} onChange={(e) => handleChange("username", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={form.email || ""} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">Email cannot be changed here. Contact support if needed.</p>
          </div>
          {isInfluencer ? (
            <div className="space-y-2">
              <Label>Instagram Username</Label>
              <Input value={form.instagram_username || ""} onChange={(e) => handleChange("instagram_username", e.target.value)} placeholder="@yourhandle" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Brand Name</Label>
                <Input value={form.brand_name || ""} onChange={(e) => handleChange("brand_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Website / Instagram</Label>
                <Input value={form.brand_website_or_instagram || ""} onChange={(e) => handleChange("brand_website_or_instagram", e.target.value)} placeholder="https://yourbrand.com" />
              </div>
            </>
          )}
          <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Security</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!changingPassword ? (
            <Button variant="outline" onClick={() => setChangingPassword(true)}>Change Password</Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleChangePassword} className="gap-2"><Save className="w-4 h-4" /> Update Password</Button>
                <Button variant="outline" onClick={() => { setChangingPassword(false); setNewPassword(""); setConfirmPassword(""); }}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader><CardTitle className="text-destructive">Danger Zone</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">These actions are irreversible. Please proceed with caution.</p>
          <Button variant="destructive" onClick={async () => {
            if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
            await supabase.auth.signOut();
          }}>
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Main Profile Page ─────────────────────────────────────────────────────────
const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("listing");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      setProfile(data);
      // Brands have no listing tab — default them to settings
      if (data?.account_type === "brand") setActiveTab("settings");
      setLoading(false);
    };
    fetchProfile();
  }, [navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

  const isInfluencer = profile?.account_type === "influencer";

  const navItems: { id: Tab; label: string; icon: React.ReactNode; href?: string }[] = [
    ...(isInfluencer ? [{ id: "listing" as Tab, label: "My Listing", icon: <FileText className="w-4 h-4" /> }] : []),
    { id: "messages", label: "Messages", icon: <MessageSquare className="w-4 h-4" />, href: "/messages" },
    { id: "projects", label: "Projects", icon: <Briefcase className="w-4 h-4" />, href: "/projects" },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
    { id: "dashboard" as Tab, label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, href: "/dashboard" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-10 max-w-5xl">
        {/* Profile header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full gradient-brand flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{profile?.first_name} {profile?.last_name}</h2>
            <p className="text-muted-foreground">@{profile?.username} · <span className="capitalize">{profile?.account_type}</span></p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar nav */}
          <aside className="w-48 flex-shrink-0">
            <nav className="space-y-1 sticky top-6">
              {navItems.map((item) => (
                item.href ? (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.href!)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors text-left"
                  >
                    {item.icon} {item.label}
                  </button>
                ) : (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                      activeTab === item.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {item.icon} {item.label}
                  </button>
                )
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {activeTab === "listing" && <MyListingTab userId={profile?.user_id} />}
            {activeTab === "settings" && <SettingsTab profile={profile} onUpdate={setProfile} />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Profile;