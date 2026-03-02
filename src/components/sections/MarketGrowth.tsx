import { TrendingUp, Users, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";

const MarketGrowth = () => {
  const stats = [
    {
      icon: DollarSign,
      value: "$21B → $60B+",
      label: "Market Size Growth",
      sublabel: "2023 to 2030 projection"
    },
    {
      icon: Users,
      value: "6,939+",
      label: "Companies in Market",
      sublabel: "And still growing fast"
    },
    {
      icon: TrendingUp,
      value: "80%",
      label: "Brands Investing More",
      sublabel: "Planning budget increases"
    }
  ];

  return (
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 gradient-brand opacity-5" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-brand-subtle text-primary text-sm font-medium">
            <TrendingUp className="w-4 h-4" />
            Market Opportunity
          </div>
          <h2 className="text-4xl md:text-5xl font-bold">
            Influencer Marketing Is{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Exploding
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            The industry is growing faster than ever, and now is the perfect time to join
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden group">
              <div className="absolute inset-0 gradient-brand opacity-0 group-hover:opacity-5 transition-smooth" />
              <div className="relative p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mx-auto shadow-brand-md group-hover:scale-110 transition-smooth">
                  <stat.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="font-semibold text-lg">{stat.label}</div>
                  <div className="text-sm text-muted-foreground">{stat.sublabel}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Additional context */}
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 bg-gradient-to-br from-card to-muted/30 border-2">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold">Why This Matters</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                With thousands of companies competing in this space and billions of dollars flowing through influencer marketing, 
                there's never been a better time to streamline the process. goConnecta positions you at the center of this explosive growth.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default MarketGrowth;