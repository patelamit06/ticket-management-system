import Link from "next/link";
import {
  CalendarDays,
  CreditCard,
  Globe,
  LayoutDashboard,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Ticket,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroCarousel } from "@/components/hero-carousel";
import { AuthCtas } from "@/components/auth-ctas";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-primary/6 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-accent/8 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24 md:py-28">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
            Events, tickets, and check-in.
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">One platform.</span>
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:mt-5 sm:text-lg md:text-xl max-w-2xl mx-auto px-1">
            Discover events, buy tickets, and manage everything in one place. For attendees and organizers.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
              Stripe-powered payments
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-primary" aria-hidden />
              Secure checkout
            </span>
          </div>
       
          {/* Hero carousel: replace slide content with <Image> or <img> when you have images */}
          <div className="mx-auto mt-12 max-w-4xl px-4 sm:px-0">
            <HeroCarousel
              aria-label="Hero images"
              autoPlayMs={5000}
              slides={[
                <div
                  key="1"
                  className="aspect-video w-full bg-gradient-to-br from-primary/20 via-primary/8 to-accent/15 flex items-center justify-center"
                >
                  <span className="text-sm text-muted-foreground/80">Slide 1 — Add your image</span>
                </div>,
                <div
                  key="2"
                  className="aspect-video w-full bg-gradient-to-br from-accent/20 via-primary/12 to-primary/18 flex items-center justify-center"
                >
                  <span className="text-sm text-muted-foreground/80">Slide 2 — Add your image</span>
                </div>,
                <div
                  key="3"
                  className="aspect-video w-full bg-gradient-to-br from-primary/15 via-accent/10 to-primary/12 flex items-center justify-center"
                >
                  <span className="text-sm text-muted-foreground/80">Slide 3 — Add your image</span>
                </div>,
              ]}
            />
          </div>
        </div>
      </section>

  


      <SiteFooter />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  className = "",
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={`group rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/25 sm:p-6 ${className}`}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors group-hover:bg-primary/20 group-hover:scale-105">
          {icon}
        </div>
      )}
      <h3 className="font-heading font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
