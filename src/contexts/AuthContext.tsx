import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AuthState {
  user: any | null;
  accountType: string | null;
  hasListing: boolean;
  ready: boolean; // true once the initial session check is complete
  refreshListingStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  accountType: null,
  hasListing: false,
  ready: false,
  refreshListingStatus: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [accountType, setAccountType] = useState<string | null>(null);
  const [hasListing, setHasListing] = useState(false);
  const [ready, setReady] = useState(false);

  const loadProfile = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("user_id", userId)
      .single();

    const type = (profile as any)?.account_type ?? null;
    setAccountType(type);

    if (type === "influencer") {
      await checkListing(userId);
    } else {
      setHasListing(false);
    }
  };

  const checkListing = async (userId: string) => {
    const { data } = await supabase
      .from("listings")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();
    setHasListing(!!data);
  };

  const refreshListingStatus = async () => {
    if (user && accountType === "influencer") {
      await checkListing(user.id);
    }
  };

  useEffect(() => {
    // 1. Get the existing session synchronously-ish on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        loadProfile(u.id).finally(() => setReady(true));
      } else {
        setReady(true);
      }
    });

    // 2. Keep in sync with sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        loadProfile(u.id);
      } else {
        setAccountType(null);
        setHasListing(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, accountType, hasListing, ready, refreshListingStatus }}>
      {children}
    </AuthContext.Provider>
  );
};