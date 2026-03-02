import { AlertCircle, Search, MessageSquare, CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";

const Problem = () => {
  const problems = [
    {
      icon: Search,
      title: "Manual Search Nightmare",
      description: "Brands waste countless hours manually searching across social media platforms to find the right creators.",
      audience: "Brands"
    },
    {
      icon: MessageSquare,
      title: "Lost in DMs",
      description: "Influencers lose deals because there's no central place to showcase their offers, stats, and pricing.",
      audience: "Influencers"
    },
    {
      icon: CreditCard,
      title: "Payment Chaos",
      description: "Communication happens through messy DMs, and payments are unsafe or completely untracked.",
      audience: "Both"
    }
  ];

  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            The Problem
          </div>
          <h2 className="text-4xl md:text-5xl font-bold">
            The Influencer Marketing Process is{" "}
            <span className="text-destructive">Broken</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Both brands and influencers struggle with an outdated, inefficient system
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {problems.map((problem, index) => (
            <Card key={index} className="p-8 hover:shadow-brand-md transition-smooth border-2">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-xl gradient-brand-subtle flex items-center justify-center">
                  <problem.icon className="w-7 h-7 text-primary" />
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-primary uppercase tracking-wider">
                    {problem.audience}
                  </div>
                  <h3 className="text-xl font-bold">{problem.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {problem.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Problem;