import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Linkedin, Mail, GraduationCap, Briefcase, Radio } from "lucide-react";

const Team = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Meet{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              The Founder
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Driven by passion for technology and marketing innovation
          </p>
        </div>

        {/* Founder Card */}
        <Card className="max-w-4xl mx-auto overflow-hidden border-2 hover:shadow-brand-lg transition-smooth">
          <div className="grid md:grid-cols-[300px_1fr] gap-8 p-8">
            {/* Photo Placeholder */}
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
                <div className="text-center space-y-2 p-8">
                  <div className="w-24 h-24 rounded-full gradient-brand mx-auto flex items-center justify-center shadow-brand-md">
                    <GraduationCap className="w-12 h-12 text-primary-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Rinats Andrejevs</p>
                </div>
              </div>
            </div>

            {/* Bio Content */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-3xl font-bold">Rinats Andrejevs</h3>
                <p className="text-lg text-primary font-semibold">Founder & CEO</p>
              </div>

              <div className="space-y-4 text-muted-foreground">
                <p className="leading-relaxed">
                  Financial Engineering student at Riga Technical University with a unique blend of 
                  experience in digital marketing, programming, and startup management.
                </p>

                {/* Highlights */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <GraduationCap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Education</p>
                      <p className="text-sm">Financial Engineering, Riga Technical University</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Briefcase className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Experience</p>
                      <p className="text-sm">Digital marketing, programming, and startup management</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Radio className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Recognition</p>
                      <p className="text-sm">Represented Junior Achievement Latvia on national radio</p>
                    </div>
                  </div>
                </div>

                <p className="leading-relaxed pt-2">
                  Currently leading MVP development and building the core team to revolutionize 
                  the influencer marketing industry in Europe.
                </p>
              </div>

              {/* Contact Buttons */}
              <div className="flex flex-wrap gap-3 pt-4">
                <Button variant="hero" size="lg" className="gap-2">
                  <Linkedin className="w-5 h-5" />
                  Connect on LinkedIn
                </Button>
                <Button variant="hero-outline" size="lg" className="gap-2">
                  <Mail className="w-5 h-5" />
                  Send Email
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default Team;