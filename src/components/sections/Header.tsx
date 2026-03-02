import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LogIn, UserPlus, LayoutDashboard, User, LogOut,
  Search, PlusCircle, MessageSquare, Briefcase
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const { user, accountType, hasListing, ready } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Active page highlight — exact match only
  const navBtn = (path: string) => {
    const active = location.pathname === path;
    return active
      ? "gap-2 bg-primary/10 text-primary font-semibold"
      : "gap-2 text-muted-foreground hover:text-foreground";
  };

  // Hold rendering until auth is confirmed — eliminates all flicker
  if (!ready) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                goConnecta
              </h1>
            </Link>
            <div className="h-8 w-64 rounded-md bg-muted/50 animate-pulse" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              goConnecta
            </h1>
          </Link>

          <div className="flex items-center gap-1">
            {user ? (
              <>
                <Button variant="ghost" size="sm" className={navBtn("/browse")} onClick={() => navigate("/browse")}>
                  <Search className="w-4 h-4" /> Browse
                </Button>

                {accountType === "influencer" && !hasListing && (
                  <Button size="sm" className="gap-2 gradient-brand text-primary-foreground ml-1" onClick={() => navigate("/create-listing")}>
                    <PlusCircle className="w-4 h-4" /> Create Listing
                  </Button>
                )}

                <Button variant="ghost" size="sm" className={navBtn("/messages")} onClick={() => navigate("/messages")}>
                  <MessageSquare className="w-4 h-4" /> Messages
                </Button>

                <Button variant="ghost" size="sm" className={navBtn("/projects")} onClick={() => navigate("/projects")}>
                  <Briefcase className="w-4 h-4" /> Projects
                </Button>

                <Button variant="ghost" size="sm" className={navBtn("/dashboard")} onClick={() => navigate("/dashboard")}>
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Button>

                <Button variant="ghost" size="sm" className={navBtn("/profile")} onClick={() => navigate("/profile")}>
                  <User className="w-4 h-4" /> Profile
                </Button>

                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground ml-1" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" /> Log Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className={navBtn("/browse")} onClick={() => navigate("/browse")}>
                  <Search className="w-4 h-4" /> Browse
                </Button>
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate("/login")}>
                  <LogIn className="w-4 h-4" /> Log In
                </Button>
                <Button variant="default" size="sm" className="gap-2 gradient-brand text-primary-foreground" onClick={() => navigate("/signup")}>
                  <UserPlus className="w-4 h-4" /> Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;