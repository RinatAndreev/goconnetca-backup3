import { Filter, MessageSquare, Shield, Star, User, TrendingUp, DollarSign, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

const Features = () => {
  const brandFeatures = [
    {
      icon: Filter,
      title: "Advanced Filters",
      description: "Search by price, engagement, platform, niche, and location"
    },
    {
      icon: MessageSquare,
      title: "Direct Messaging",
      description: "Built-in chat to negotiate and finalize deals"
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Escrow system protects your investment"
    },
    {
      icon: Star,
      title: "Reviews & Ratings",
      description: "Make informed decisions based on past performance"
    }
  ];

  const influencerFeatures = [
    {
      icon: User,
      title: "Profile Creation",
      description: "Link all your social media accounts in one place"
    },
    {
      icon: TrendingUp,
      title: "Automatic Stats",
      description: "Real-time views, engagement, and follower counts"
    },
    {
      icon: DollarSign,
      title: "Custom Pricing",
      description: "Set different rates for posts, stories, and videos"
    },
    {
      icon: Sparkles,
      title: "AI Assistant",
      description: "Get help with bio writing and pricing optimization"
    }
  ];

  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Everything You Need —{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              All in One Platform
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Built for simplicity, speed, and transparency
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12">
          {/* For Brands */}
          <div className="space-y-6">
            <div className="inline-block">
              <h3 className="text-2xl font-bold mb-2">For Brands</h3>
              <div className="h-1 w-20 gradient-brand rounded-full" />
            </div>
            <div className="grid gap-6">
              {brandFeatures.map((feature, index) => (
                <Card key={index} className="p-6 hover:shadow-brand-md transition-smooth border-2">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-lg">{feature.title}</h4>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* For Influencers */}
          <div className="space-y-6">
            <div className="inline-block">
              <h3 className="text-2xl font-bold mb-2">For Influencers</h3>
              <div className="h-1 w-20 gradient-brand rounded-full" />
            </div>
            <div className="grid gap-6">
              {influencerFeatures.map((feature, index) => (
                <Card key={index} className="p-6 hover:shadow-brand-md transition-smooth border-2">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-lg">{feature.title}</h4>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;