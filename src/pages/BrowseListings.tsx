import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MessageSquare, Briefcase, SlidersHorizontal, X, ExternalLink } from "lucide-react";
import Header from "@/components/sections/Header";
import { useToast } from "@/hooks/use-toast";

const PLATFORMS = ["All", "YouTube", "TikTok", "Instagram", "Pinterest", "X", "LinkedIn"];
const LANGUAGES = ["All", "English", "Spanish", "French", "German", "Portuguese", "Russian", "Japanese", "Korean", "Chinese", "Arabic", "Hindi", "Other"];
const CONTENT_TYPES = ["All", "Full Promo Video", "30-60s Promo in Video", "Video", "Post", "Story", "Reel", "Pin", "Thread", "Article"];
const NICHES = ["All", "Fashion & Beauty", "Tech & Gaming", "Food & Cooking", "Travel", "Fitness & Health", "Lifestyle", "Finance", "Education", "Entertainment", "Sports", "Music", "Business", "Parenting", "Other"];
const SORT_OPTIONS = ["Newest", "Oldest", "Price: Low to High", "Price: High to Low"];

interface Listing {
  id: string;
  user_id: string;
  description: string;
  content_language: string;
  created_at: string;
  profile?: { first_name: string; last_name: string; username: string };
  social_media: { platform: string; username: string }[];
  prices: { platform: string; content_type: string; price: number }[];
  images: { image_url: string; position: number }[];
}

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

const BrowseListings = () => {
  const [user, setUser] = useState<any>(null);
  const [accountType, setAccountType] = useState<string | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [languageFilter, setLanguageFilter] = useState("All");
  const [contentTypeFilter, setContentTypeFilter] = useState("All");
  const [nicheFilter, setNicheFilter] = useState("All");
  const [maxPrice, setMaxPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [sortBy, setSortBy] = useState("Newest");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("account_type").eq("user_id", user.id).single();
        setAccountType((profile as any)?.account_type || null);
      }
    };
    fetchUser();
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    const { data: listingsData } = await supabase.from("listings").select("*").eq("status", "active").order("created_at", { ascending: false });
    if (!listingsData || listingsData.length === 0) { setListings([]); setLoading(false); return; }

    const listingIds = listingsData.map((l: any) => l.id);
    const userIds = listingsData.map((l: any) => l.user_id);

    const [socialRes, pricesRes, imagesRes, profilesRes] = await Promise.all([
      supabase.from("listing_social_media").select("*").in("listing_id", listingIds),
      supabase.from("listing_prices").select("*").in("listing_id", listingIds),
      supabase.from("listing_images").select("*").in("listing_id", listingIds),
      supabase.from("profiles").select("first_name, last_name, username, user_id").in("user_id", userIds),
    ]);

    const assembled: Listing[] = listingsData.map((l: any) => ({
      ...l,
      profile: (profilesRes.data || []).find((p: any) => p.user_id === l.user_id),
      social_media: (socialRes.data || []).filter((s: any) => s.listing_id === l.id),
      prices: (pricesRes.data || []).filter((p: any) => p.listing_id === l.id),
      images: (imagesRes.data || []).filter((img: any) => img.listing_id === l.id).sort((a: any, b: any) => a.position - b.position),
    }));

    setListings(assembled);
    setLoading(false);
  };

  const activeFilterCount = [searchQuery, platformFilter !== "All" ? platformFilter : "", languageFilter !== "All" ? languageFilter : "", contentTypeFilter !== "All" ? contentTypeFilter : "", nicheFilter !== "All" ? nicheFilter : "", minPrice, maxPrice, sortBy !== "Newest" ? sortBy : ""].filter(Boolean).length;
  const clearAllFilters = () => { setSearchQuery(""); setPlatformFilter("All"); setLanguageFilter("All"); setContentTypeFilter("All"); setNicheFilter("All"); setMinPrice(""); setMaxPrice(""); setSortBy("Newest"); };

  const filtered = listings.filter((l) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!`${l.profile?.first_name} ${l.profile?.last_name}`.toLowerCase().includes(q) && !l.profile?.username?.toLowerCase().includes(q) && !l.description.toLowerCase().includes(q)) return false;
    }
    if (platformFilter !== "All" && !l.social_media.some((s) => s.platform === platformFilter)) return false;
    if (languageFilter !== "All" && l.content_language !== languageFilter) return false;
    if (contentTypeFilter !== "All" && !l.prices.some((p) => p.content_type === contentTypeFilter)) return false;
    if (nicheFilter !== "All") {
      const nicheKeywords: Record<string, string[]> = {
        "Fashion & Beauty": ["fashion","beauty","style","makeup","skincare","outfit"],
        "Tech & Gaming": ["tech","technology","gaming","game","software","hardware","gadget"],
        "Food & Cooking": ["food","cook","recipe","restaurant","cuisine","baking","chef"],
        "Travel": ["travel","trip","destination","adventure","explore","vacation"],
        "Fitness & Health": ["fitness","health","workout","gym","nutrition","wellness"],
        "Lifestyle": ["lifestyle","life","daily","routine","vlog"],
        "Finance": ["finance","money","investing","crypto","budget","savings"],
        "Education": ["education","learn","tutorial","teach","course","tips"],
        "Entertainment": ["entertainment","fun","comedy","humor","viral"],
        "Sports": ["sports","football","basketball","soccer","athlete"],
        "Music": ["music","song","singer","artist","musician"],
        "Business": ["business","entrepreneur","startup","marketing","brand"],
        "Parenting": ["parent","mom","dad","baby","kids","family"],
      };
      if (!(nicheKeywords[nicheFilter] || []).some((kw) => l.description.toLowerCase().includes(kw))) return false;
    }
    if (minPrice || maxPrice) {
      const ps = l.prices.map((p) => p.price);
      if (!ps.length) return false;
      if (minPrice && Math.max(...ps) < Number(minPrice)) return false;
      if (maxPrice && Math.min(...ps) > Number(maxPrice)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "Newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === "Oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    const aMin = a.prices.length ? Math.min(...a.prices.map((p) => p.price)) : 0;
    const bMin = b.prices.length ? Math.min(...b.prices.map((p) => p.price)) : 0;
    return sortBy === "Price: Low to High" ? aMin - bMin : bMin - aMin;
  });

  // ── Navigation helpers ───────────────────────────────────────────────────────
  // Both "Message" and "Send Offer" navigate to the unified chat page.
  // The chat page deep-links via ?with=USER_ID and reads listing_id from message history.
  // For a first-time offer (no prior chat), we first create a placeholder message so
  // the conversation exists, then open the chat with ?offer=1 so the offer modal auto-opens.
  const handleMessage = async (listing: Listing) => {
    if (!user) { navigate("/login"); return; }
    // Ensure there's at least one message so the conversation appears in the inbox
    const { data: existing } = await supabase
      .from("messages")
      .select("id")
      .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${listing.user_id}),and(from_user_id.eq.${listing.user_id},to_user_id.eq.${user.id})`)
      .limit(1);

    if (!existing || existing.length === 0) {
      // Create a starter message so the thread exists
      await supabase.from("messages").insert({
        from_user_id: user.id,
        to_user_id: listing.user_id,
        listing_id: listing.id,
        content: `Hi! I saw your listing and wanted to get in touch.`,
        message_type: "text",
      } as any);
    }

    navigate(`/messages?with=${listing.user_id}`);
  };

  const handleSendOffer = async (listing: Listing) => {
    if (!user) { navigate("/login"); return; }

    // Ensure the conversation thread exists with the listing_id attached
    const { data: existing } = await supabase
      .from("messages")
      .select("id")
      .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${listing.user_id}),and(from_user_id.eq.${listing.user_id},to_user_id.eq.${user.id})`)
      .limit(1);

    if (!existing || existing.length === 0) {
      await supabase.from("messages").insert({
        from_user_id: user.id,
        to_user_id: listing.user_id,
        listing_id: listing.id,
        content: `Hi! I'm interested in working with you.`,
        message_type: "text",
      } as any);
    }

    // Navigate to chat and auto-open offer modal
    navigate(`/messages?with=${listing.user_id}&offer=1&listing=${listing.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-10 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Browse Listings</h1>
          <span className="text-sm text-muted-foreground">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="mb-4">
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name, username, or description..." />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Button variant={showFilters ? "default" : "outline"} size="sm" className="gap-2" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="w-4 h-4" /> Filters
            {activeFilterCount > 0 && <span className="ml-1 bg-primary-foreground text-primary rounded-full px-1.5 py-0.5 text-xs font-bold">{activeFilterCount}</span>}
          </Button>
          {activeFilterCount > 0 && <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={clearAllFilters}><X className="w-3 h-3" /> Clear all</Button>}
        </div>

        {showFilters && (
          <div className="rounded-xl border border-border bg-card p-5 mb-6 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { label: "Platform", value: platformFilter, set: setPlatformFilter, opts: PLATFORMS },
                { label: "Ad Type", value: contentTypeFilter, set: setContentTypeFilter, opts: CONTENT_TYPES },
                { label: "Niche", value: nicheFilter, set: setNicheFilter, opts: NICHES },
                { label: "Language", value: languageFilter, set: setLanguageFilter, opts: LANGUAGES },
              ].map(({ label, value, set, opts }) => (
                <div key={label} className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">{label}</Label>
                  <Select value={value} onValueChange={set}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              ))}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Min Price ($)</Label>
                <Input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Max Price ($)</Label>
                <Input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Any" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SORT_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                {searchQuery && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setSearchQuery("")}>"{searchQuery}" <X className="w-3 h-3" /></Badge>}
                {platformFilter !== "All" && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setPlatformFilter("All")}>{platformFilter} <X className="w-3 h-3" /></Badge>}
                {contentTypeFilter !== "All" && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setContentTypeFilter("All")}>{contentTypeFilter} <X className="w-3 h-3" /></Badge>}
                {nicheFilter !== "All" && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setNicheFilter("All")}>{nicheFilter} <X className="w-3 h-3" /></Badge>}
                {languageFilter !== "All" && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setLanguageFilter("All")}>{languageFilter} <X className="w-3 h-3" /></Badge>}
                {minPrice && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setMinPrice("")}>Min ${minPrice} <X className="w-3 h-3" /></Badge>}
                {maxPrice && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setMaxPrice("")}>Max ${maxPrice} <X className="w-3 h-3" /></Badge>}
                {sortBy !== "Newest" && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setSortBy("Newest")}>{sortBy} <X className="w-3 h-3" /></Badge>}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground">No listings found.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filtered.map((listing) => (
              <div key={listing.id} className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-brand-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{listing.profile?.first_name} {listing.profile?.last_name}</h3>
                    <p className="text-sm text-muted-foreground">@{listing.profile?.username}</p>
                  </div>
                  <Badge variant="secondary">{listing.content_language}</Badge>
                </div>

                {listing.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {listing.images.slice(0, 3).map((img, i) => (
                      <img key={i} src={img.image_url} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setSelectedImage(img.image_url)} />
                    ))}
                  </div>
                )}

                <p className="text-sm text-foreground line-clamp-3">{listing.description}</p>

                {/* Clickable social media links */}
                <div className="flex flex-wrap gap-1.5">
                  {listing.social_media.map((s, i) => (
                    <a key={i} href={getSocialUrl(s.platform, s.username)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-border text-xs font-medium hover:bg-accent hover:border-primary transition-colors">
                      {s.platform}: {s.username} <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  ))}
                </div>

                <div className="space-y-1">
                  {listing.prices.map((p, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{p.platform} — {p.content_type}</span>
                      <span className="font-medium">${Number(p.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Action buttons — only shown to logged-in users who don't own the listing */}
                {user && user.id !== listing.user_id && (
                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => handleMessage(listing)}
                    >
                      <MessageSquare className="w-4 h-4" /> Message
                    </Button>

                    {accountType === "brand" && (
                      <Button
                        className="flex-1 gap-2 gradient-brand text-primary-foreground"
                        onClick={() => handleSendOffer(listing)}
                      >
                        <Briefcase className="w-4 h-4" /> Send Offer
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Viewer */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <img src={selectedImage || ""} alt="" className="w-full h-auto rounded-lg" />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrowseListings;