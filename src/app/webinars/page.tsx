import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default function Webinars() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Image src="/logo.png" width={100} height={50} alt="PoliBit Logo" />
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Home</Link>
              <Link href="/platform-investment-platform" className="text-muted-foreground hover:text-primary transition-colors">Platform</Link>
            </div>
            <Button>Free Demo</Button>
          </nav>
        </div>
      </header>
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-40">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Webinars</h1>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">Coming soon.</p>
        </div>
      </section>
    </div>
  );
}