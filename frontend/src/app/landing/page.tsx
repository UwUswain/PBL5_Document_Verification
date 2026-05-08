'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, CheckCircle2, ZoomIn, FileText, Shield, Zap, Lock, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="w-full bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/95 z-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
              D
            </div>
            <span className="text-xl font-bold text-foreground hidden sm:inline">DocFlow</span>
          </div>
          
          <div className="flex items-center gap-8 hidden md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#workflow" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How it works
            </a>
            <a href="#preview" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" className="hidden sm:inline-flex text-sm h-9">
              Sign in
            </Button>
            <Button className="h-9 bg-primary hover:bg-primary/90">
              Start free trial
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-muted rounded-full border border-border">
            <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-muted-foreground">
              Trusted by Fortune 500 companies
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground text-balance leading-tight">
              AI-powered document processing
              <span className="text-primary"> that actually works</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
              Extract data, detect signatures, verify stamps, and automate document workflows with enterprise-grade accuracy. No hallucinations. No errors.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button className="h-12 px-8 bg-primary hover:bg-primary/90 text-base">
              Get started free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="outline" className="h-12 px-8 text-base border-2">
              Book a demo
            </Button>
          </div>
        </div>

        {/* Hero Image Placeholder */}
        <div className="mt-16 rounded-xl border border-border bg-gradient-to-b from-muted to-background overflow-hidden">
          <div className="aspect-video flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                <ZoomIn className="w-8 h-8" />
              </div>
              <p className="text-sm">Interactive demo preview</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Metrics */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-border bg-white">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-sm font-medium text-muted-foreground mb-12">
            TRUSTED BY LEADING COMPANIES
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            {['SAP', 'Oracle', 'Workday', 'Coupa'].map((company) => (
              <div key={company} className="h-12 flex items-center justify-center text-foreground font-semibold opacity-60 hover:opacity-100 transition-opacity">
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Workflow Visualization */}
      <section id="workflow" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background via-white to-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
              Your documents processed in seconds
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From upload to insights. Our AI agents handle the complexity while you focus on business decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Upload', desc: 'Email, cloud storage, or direct upload' },
              { step: '2', title: 'Extract', desc: 'AI-powered OCR and data extraction' },
              { step: '3', title: 'Verify', desc: 'Signature & stamp validation' },
              { step: '4', title: 'Automate', desc: 'Trigger workflows & approvals' },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <Card className="p-6 border-2 hover:border-primary transition-colors group cursor-pointer">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold mb-4 group-hover:bg-primary group-hover:text-white transition-all">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </Card>
                {idx < 3 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 w-6 h-6 items-center justify-center text-primary">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
              Enterprise-grade capabilities
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to process documents at scale with confidence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: ZoomIn,
                title: 'Advanced OCR',
                desc: 'Accurately extract text from any document type with 99.8% accuracy',
              },
              {
                icon: Shield,
                title: 'Signature Detection',
                desc: 'Identify and verify digital and handwritten signatures',
              },
              {
                icon: FileText,
                title: 'Data Extraction',
                desc: 'Intelligently extract and classify key data fields',
              },
              {
                icon: Lock,
                title: 'Fraud Detection',
                desc: 'AI-powered anomaly detection protects against document forgery',
              },
              {
                icon: Zap,
                title: 'Stamp Verification',
                desc: 'Validate official stamps and security marks automatically',
              },
              {
                icon: BarChart3,
                title: 'Real-time Insights',
                desc: 'Track processing metrics and document analytics in real-time',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="p-8 border-2 hover:border-primary hover:shadow-lg transition-all group cursor-pointer">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                    <Icon className="w-6 h-6 text-primary group-hover:text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section id="preview" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
                Powerful dashboard, simple to use
              </h2>
              <p className="text-lg text-muted-foreground">
                Monitor all your document processing in one beautiful interface. Real-time status updates, detailed analytics, and one-click controls.
              </p>
              <div className="space-y-4">
                {[
                  'Real-time processing status',
                  'Advanced search and filtering',
                  'Customizable workflows',
                  'Bulk processing capabilities',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <Button className="h-12 px-8 bg-primary hover:bg-primary/90 text-base mt-4">
                View full demo
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <div className="rounded-xl border border-border bg-gradient-to-b from-muted to-background overflow-hidden">
              <div className="aspect-square flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                  <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                    <FileText className="w-10 h-10" />
                  </div>
                  <p className="text-sm">Dashboard preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            {[
              { number: '1M+', label: 'Documents processed monthly' },
              { number: '99.8%', label: 'Average accuracy rate' },
              { number: '24/7', label: 'Enterprise support' },
            ].map((stat, idx) => (
              <div key={idx} className="space-y-2">
                <div className="text-4xl sm:text-5xl font-bold text-primary">{stat.number}</div>
                <p className="text-muted-foreground text-lg">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/5 to-primary/10 border-y border-border">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
            Ready to transform your document workflows?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start processing documents with AI. No credit card required. First 1,000 pages free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="h-12 px-8 bg-primary hover:bg-primary/90 text-base">
              Start free trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="outline" className="h-12 px-8 text-base border-2">
              Schedule a call
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-3">
                {['Features', 'Pricing', 'Security', 'Roadmap'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-3">
                {['About', 'Blog', 'Careers', 'Contact'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-3">
                {['Privacy', 'Terms', 'SOC 2', 'GDPR'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-semibold text-foreground mb-4">Stay updated</h4>
              <p className="text-sm text-muted-foreground mb-4">Get the latest updates on AI document processing.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button className="bg-primary hover:bg-primary/90">Subscribe</Button>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xs">
                D
              </div>
              <span className="font-semibold text-foreground">DocFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; 2024 DocFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
