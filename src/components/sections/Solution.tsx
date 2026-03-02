import { CheckCircle2, Search, MessageCircle, Shield, Star } from "lucide-react";

const Solution = () => {
  const features = [
    {
      icon: Search,
      label: "Search"
    },
    {
      icon: MessageCircle,
      label: "Chat"
    },
    {
      icon: Shield,
      label: "Pay Safely"
    },
    {
      icon: Star,
      label: "Rate"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-brand-subtle text-primary text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              The Solution
            </div>
            <h2 className="text-4xl md:text-5xl font-bold">
              We Simplify{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Influencer Marketing
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              goConnecta brings both sides together on one platform
            </p>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Description */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Brands can find, filter, and contact influencers instantly</h3>
                    <p className="text-muted-foreground">No more endless scrolling through social media. Advanced filters help you find the perfect match in seconds.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Influencers can list offers and connect all accounts</h3>
                    <p className="text-muted-foreground">Showcase your stats, set your pricing, and let brands come to you. All your social media in one professional profile.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Everyone gets paid safely through our system</h3>
                    <p className="text-muted-foreground">Escrow payments protect both parties. Funds are released only when work is delivered and approved.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Feature Icons */}
            <div className="grid grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="relative group"
                >
                  <div className="absolute inset-0 gradient-brand opacity-0 group-hover:opacity-10 rounded-2xl transition-smooth" />
                  <div className="relative bg-card p-8 rounded-2xl border-2 border-border hover:border-primary transition-smooth shadow-brand-sm hover:shadow-brand-md">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-16 h-16 rounded-xl gradient-brand flex items-center justify-center shadow-brand-md group-hover:scale-110 transition-smooth">
                        <feature.icon className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <h4 className="font-bold text-lg">{feature.label}</h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Solution;