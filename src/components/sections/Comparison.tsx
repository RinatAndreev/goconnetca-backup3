import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";

const Comparison = () => {
  const competitors = [
    { name: "goConnecta", highlight: true },
    { name: "Heepsy" },
    { name: "Collabstr" },
    { name: "AspireIQ" }
  ];

  const features = [
    { name: "Secure Payments", values: [true, false, true, true] },
    { name: "Built-in Chat", values: [true, false, true, false] },
    { name: "Free for Brands", values: [true, false, false, false] },
    { name: "Automatic Analytics", values: [true, true, false, true] },
    { name: "Localized for Europe", values: [true, false, false, false] },
    { name: "AI-Powered Tools", values: [true, false, false, true] },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            What Makes Us{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Different
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            See how goConnecta compares to other platforms
          </p>
        </div>

        {/* Comparison Table */}
        <Card className="max-w-5xl mx-auto overflow-hidden border-2">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left p-6 font-bold text-lg">Features</th>
                  {competitors.map((competitor, index) => (
                    <th 
                      key={index} 
                      className={`p-6 text-center font-bold text-lg ${
                        competitor.highlight 
                          ? 'gradient-brand text-primary-foreground' 
                          : 'bg-muted/50'
                      }`}
                    >
                      {competitor.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((feature, featureIndex) => (
                  <tr key={featureIndex} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                    <td className="p-6 font-medium">{feature.name}</td>
                    {feature.values.map((value, valueIndex) => (
                      <td 
                        key={valueIndex} 
                        className={`p-6 text-center ${
                          competitors[valueIndex].highlight 
                            ? 'bg-primary/5' 
                            : ''
                        }`}
                      >
                        {value ? (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                            <Check className="w-5 h-5 text-primary" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                            <X className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Bottom Note */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            * Feature comparison based on publicly available information as of 2025
          </p>
        </div>
      </div>
    </section>
  );
};

export default Comparison;