import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Upload, X } from "lucide-react";

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

interface SocialMedia {
  platform: string;
  username: string;
}

interface PriceEntry {
  platform: string;
  content_type: string;
  price: string;
}

const CreateListing = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [contentLanguage, setContentLanguage] = useState("English");
  const [socialMedia, setSocialMedia] = useState<SocialMedia[]>([{ platform: "", username: "" }]);
  const [prices, setPrices] = useState<PriceEntry[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
    });
  }, [navigate]);

  // Auto-generate price entries based on selected platforms
  useEffect(() => {
    const uniquePlatforms = [...new Set(socialMedia.map((s) => s.platform).filter(Boolean))];
    const newPrices: PriceEntry[] = [];
    uniquePlatforms.forEach((platform) => {
      const types = CONTENT_TYPES[platform] || [];
      types.forEach((ct) => {
        const existing = prices.find((p) => p.platform === platform && p.content_type === ct);
        newPrices.push({ platform, content_type: ct, price: existing?.price || "" });
      });
    });
    setPrices(newPrices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socialMedia.map((s) => s.platform).join(",")]);

  const addSocialMedia = () => setSocialMedia([...socialMedia, { platform: "", username: "" }]);
  const removeSocialMedia = (idx: number) => setSocialMedia(socialMedia.filter((_, i) => i !== idx));
  const updateSocialMedia = (idx: number, field: keyof SocialMedia, value: string) => {
    const updated = [...socialMedia];
    updated[idx] = { ...updated[idx], [field]: value };
    setSocialMedia(updated);
  };

  const updatePrice = (idx: number, value: string) => {
    const updated = [...prices];
    updated[idx] = { ...updated[idx], price: value };
    setPrices(updated);
  };

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
    setImagePreviews(imagePreviews.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const validSocial = socialMedia.filter((s) => s.platform && s.username);
    if (validSocial.length === 0) {
      toast({ title: "Add at least one social media account", variant: "destructive" });
      return;
    }
    const validPrices = prices.filter((p) => p.price && Number(p.price) > 0);
    if (validPrices.length === 0) {
      toast({ title: "Set at least one price", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Create listing
      const { data: listing, error: listingErr } = await supabase
        .from("listings")
        .insert({ user_id: user.id, description, content_language: contentLanguage } as any)
        .select()
        .single();
      if (listingErr) throw listingErr;

      const listingId = (listing as any).id;

      // Insert social media
      await supabase.from("listing_social_media").insert(
        validSocial.map((s) => ({ listing_id: listingId, platform: s.platform, username: s.username })) as any
      );

      // Insert prices
      await supabase.from("listing_prices").insert(
        validPrices.map((p) => ({ listing_id: listingId, platform: p.platform, content_type: p.content_type, price: Number(p.price) })) as any
      );

      // Upload images
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const path = `${user.id}/${listingId}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage.from("listing-images").upload(path, file);
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("listing-images").getPublicUrl(path);
          await supabase.from("listing_images").insert({ listing_id: listingId, image_url: urlData.publicUrl, position: i } as any);
        }
      }

      toast({ title: "Listing published!" });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: err.message || "Failed to create listing", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-20">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Create Listing</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Social Media */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Social Media Accounts</h2>
            {socialMedia.map((sm, idx) => (
              <div key={idx} className="flex gap-3 items-end">
                <div className="flex-1 space-y-1">
                  <Label>Platform</Label>
                  <Select value={sm.platform} onValueChange={(v) => updateSocialMedia(idx, "platform", v)}>
                    <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-1">
                  <Label>Username</Label>
                  <Input value={sm.username} onChange={(e) => updateSocialMedia(idx, "username", e.target.value)} placeholder="@username" />
                </div>
                {socialMedia.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeSocialMedia(idx)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addSocialMedia} className="gap-2">
              <Plus className="w-4 h-4" /> Add Social Media
            </Button>
          </section>

          {/* Description */}
          <section className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell brands about yourself and your content..." rows={4} required />
          </section>

          {/* Language */}
          <section className="space-y-2">
            <Label>Content Language</Label>
            <Select value={contentLanguage} onValueChange={setContentLanguage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          {/* Images */}
          <section className="space-y-3">
            <Label>Images</Label>
            <div className="flex flex-wrap gap-3">
              {imagePreviews.map((src, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                <Upload className="w-5 h-5 text-muted-foreground" />
                <input type="file" accept="image/*" multiple onChange={handleImageAdd} className="hidden" />
              </label>
            </div>
          </section>

          {/* Pricing */}
          {prices.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Pricing</h2>
              <div className="space-y-3">
                {prices.map((p, idx) => (
                  <div key={`${p.platform}-${p.content_type}`} className="flex items-center gap-3">
                    <span className="text-sm font-medium min-w-[100px]">{p.platform}</span>
                    <span className="text-sm text-muted-foreground min-w-[160px]">{p.content_type}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input type="number" min="0" step="0.01" value={p.price} onChange={(e) => updatePrice(idx, e.target.value)} placeholder="0.00" className="w-28" required />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <Button type="submit" className="w-full gradient-brand text-primary-foreground" disabled={loading}>
            {loading ? "Publishing..." : "Publish Listing"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateListing;
