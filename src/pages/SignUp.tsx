import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type AccountType = "influencer" | "brand";

const SignUp = () => {
  const [accountType, setAccountType] = useState<AccountType>("influencer");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    // Influencer
    instagramUsername: "",
    // Brand
    brandName: "",
    brandWebsiteOrInstagram: "",
  });

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            account_type: accountType,
            first_name: form.firstName,
            last_name: form.lastName,
            username: form.username,
            instagram_username: accountType === "influencer" ? form.instagramUsername : null,
            brand_name: accountType === "brand" ? form.brandName : null,
            brand_website_or_instagram: accountType === "brand" ? form.brandWebsiteOrInstagram : null,
          },
        },
      });

      if (error) throw error;

      toast({ title: "Account created! Please check your email to verify." });
      navigate("/login");
    } catch (err: any) {
      toast({ title: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Link to="/">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              goConnecta
            </h1>
          </Link>
          <p className="mt-2 text-muted-foreground">Create your account</p>
        </div>

        {/* Account Type Toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setAccountType("influencer")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              accountType === "influencer"
                ? "gradient-brand text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Influencer
          </button>
          <button
            type="button"
            onClick={() => setAccountType("brand")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              accountType === "brand"
                ? "gradient-brand text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Brand
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Name</Label>
              <Input id="firstName" required value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} placeholder="John" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Surname</Label>
              <Input id="lastName" required value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} placeholder="Doe" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" required value={form.username} onChange={(e) => updateField("username", e.target.value)} placeholder="johndoe" />
          </div>

          {accountType === "influencer" ? (
            <div className="space-y-2">
              <Label htmlFor="instagramUsername">Instagram Username</Label>
              <Input id="instagramUsername" required value={form.instagramUsername} onChange={(e) => updateField("instagramUsername", e.target.value)} placeholder="@johndoe" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="brandName">Brand Name</Label>
                <Input id="brandName" required value={form.brandName} onChange={(e) => updateField("brandName", e.target.value)} placeholder="Acme Inc." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brandWebsite">Brand Website or Instagram</Label>
                <Input id="brandWebsite" required value={form.brandWebsiteOrInstagram} onChange={(e) => updateField("brandWebsiteOrInstagram", e.target.value)} placeholder="https://acme.com or @acme" />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" required value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="john@example.com" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={form.password} onChange={(e) => updateField("password", e.target.value)} placeholder="••••••••" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" required value={form.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} placeholder="••••••••" />
          </div>

          <Button type="submit" className="w-full gradient-brand text-primary-foreground" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
