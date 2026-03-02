import { Percent, Crown, GraduationCap, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

const BusinessModel = () => {
  const revenueStreams = [
    {
      icon: Percent,
      title: "Platform Commission",
      description: "10-15% commission from every successful deal between brands and influencers",
      highlight: "Primary Revenue"
    },
    {
      icon: Crown,
      title: "Premium Placement",
      description: "Featured profile spots and priority visibility in search results",
      highlight: "For Influencers"
    },
    {
      icon: GraduationCap,
      title: "Expert Courses",
      description: "Educational content and masterclasses for influencer marketing success",
      highlight: "Value Add"
    },
    {
      icon: Zap,
      title: "Early Payout",
      description: "Fast-track payment processing for influencers who need immediate access to funds",
      highlight: "Premium Feature"
    }
  ];

  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            How We{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Make Money
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Sustainable revenue model that grows with our community
          </p>
        </div>

        {/* Revenue Streams */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {revenueStreams.map((stream, index) => (
            <Card key={index} className="relative overflow-hidden group hover:shadow-brand-md transition-smooth">
              <div className="absolute top-0 right-0 w-32 h-32 gradient-brand opacity-5 rounded-full -mr-16 -mt-16" />
              <div className="relative p-6 space-y-4">
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-xl gradient-brand flex items-center justify-center shadow-brand-sm group-hover:scale-110 transition-smooth">
                    <stream.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                    {stream.highlight}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">{stream.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {stream.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Summary Card */}
        <div className="max-w-4xl mx-auto mt-12">
          <Card className="p-8 gradient-brand-subtle border-2 border-primary/20">
            <div className="text-center space-y-3">
              <h3 className="text-xl font-bold">Win-Win-Win Model</h3>
              <p className="text-muted-foreground leading-relaxed">
                goConnecta only succeeds when our users succeed. Our commission-based model aligns our interests with yours, 
                ensuring we're always working to deliver the best possible experience for both brands and influencers.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default BusinessModel;