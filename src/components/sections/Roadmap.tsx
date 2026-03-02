import { Calendar, Rocket, Users, Sparkles, Globe } from "lucide-react";
import { Card } from "@/components/ui/card";

const Roadmap = () => {
  const milestones = [
    {
      quarter: "Q1 2025",
      icon: Rocket,
      title: "MVP Launch",
      description: "Launch core platform with essential features for brands and influencers",
      status: "current"
    },
    {
      quarter: "Q2 2025",
      icon: Users,
      title: "Community Growth",
      description: "Onboard 500+ influencers and establish early brand partnerships",
      status: "upcoming"
    },
    {
      quarter: "Q3 2025",
      icon: Sparkles,
      title: "AI & Analytics",
      description: "Introduce AI-powered matching and advanced analytics dashboard",
      status: "upcoming"
    },
    {
      quarter: "Q4 2025",
      icon: Globe,
      title: "European Expansion",
      description: "Expand to Poland & Finland with localized features",
      status: "upcoming"
    }
  ];

  return (
    <section className="py-20 bg-muted/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-brand-subtle text-primary text-sm font-medium">
            <Calendar className="w-4 h-4" />
            Our Vision
          </div>
          <h2 className="text-4xl md:text-5xl font-bold">
            Building the Future of{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Influencer Marketing
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Our roadmap to becoming Europe's most trusted marketplace
          </p>
        </div>

        {/* Timeline */}
        <div className="max-w-4xl mx-auto space-y-8">
          {milestones.map((milestone, index) => (
            <div key={index} className="relative">
              {/* Connector line */}
              {index < milestones.length - 1 && (
                <div className="absolute left-[31px] top-20 w-0.5 h-16 bg-gradient-to-b from-primary to-accent opacity-30" />
              )}
              
              <Card className={`relative overflow-hidden ${
                milestone.status === 'current' 
                  ? 'border-2 border-primary shadow-brand-md' 
                  : 'border-2'
              }`}>
                {milestone.status === 'current' && (
                  <div className="absolute top-0 right-0">
                    <div className="px-4 py-1 gradient-brand text-primary-foreground text-xs font-bold rounded-bl-lg">
                      CURRENT
                    </div>
                  </div>
                )}
                
                <div className="p-8 flex items-start gap-6">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 shadow-brand-sm ${
                    milestone.status === 'current'
                      ? 'gradient-brand'
                      : 'gradient-brand-subtle'
                  }`}>
                    <milestone.icon className={`w-8 h-8 ${
                      milestone.status === 'current'
                        ? 'text-primary-foreground'
                        : 'text-primary'
                    }`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <div className="text-sm font-semibold text-primary uppercase tracking-wider">
                      {milestone.quarter}
                    </div>
                    <h3 className="text-2xl font-bold">{milestone.title}</h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* Future Vision */}
        <div className="max-w-4xl mx-auto mt-12">
          <Card className="p-8 bg-gradient-to-br from-card to-primary/5 border-2 border-primary/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
                <Globe className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">2026 and Beyond</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Expand throughout Europe with strategic partnerships, advanced automation features, 
                  and become the go-to platform for influencer marketing across all major social media platforms. 
                  Our mission: make influencer marketing simple, transparent, and profitable for everyone.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quote */}
        <div className="text-center mt-12 max-w-3xl mx-auto">
          <blockquote className="text-xl italic text-muted-foreground">
            "We're building the most trusted marketplace for influencers and brands in Europe."
          </blockquote>
        </div>
      </div>
    </section>
  );
};

export default Roadmap;