"use client"

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" width={100} height={50} alt="PoliBit Logo" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Home</Link>

            <DropdownMenu>
              <DropdownMenuTrigger className="text-muted-foreground hover:text-primary transition-colors outline-none">
                Industries
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href="/real-estate-investment-platform">Real Estate</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/private-equity-investment-platform">Private Equity</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/private-debt-investment-platform">Private Debt</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="text-muted-foreground hover:text-primary transition-colors outline-none">
                Features
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href="/investment-platform">Platform Overview</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/fundraising-and-capital-raising">Fundraising & Capital Raising</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/investor-portal">Investor Portal</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/fund-administration-and-operations">Fund Administration & Operations</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/investment-reporting-and-analytics">Reporting & Analytics</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="text-muted-foreground hover:text-primary transition-colors outline-none">
                Resources
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href="/blog">Blog</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/customer-success-stories">Customer Success Stories</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="text-muted-foreground hover:text-primary transition-colors outline-none">
                Company
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href="/about-us">About Us</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/free-demo">Contact</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-4">
            {/* Mobile Menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="rounded-lg">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] rounded-l-2xl overflow-y-auto">
                <nav className="flex flex-col gap-4 mt-8 px-2 pb-8">
                  <Link
                    href="/"
                    className="text-lg font-medium hover:text-primary transition-colors px-4 py-1.5 rounded-lg hover:bg-primary/5"
                    onClick={() => setOpen(false)}
                  >
                    Home
                  </Link>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground px-4">Industries</p>
                    <div className="space-y-1">
                      <Link
                        href="/real-estate-investment-platform"
                        className="block text-sm hover:text-primary transition-colors px-4 py-1.5 rounded-lg hover:bg-primary/5"
                        onClick={() => setOpen(false)}
                      >
                        Real Estate
                      </Link>
                      <Link
                        href="/private-equity-investment-platform"
                        className="block text-sm hover:text-primary transition-colors px-4 py-1.5 rounded-lg hover:bg-primary/5"
                        onClick={() => setOpen(false)}
                      >
                        Private Equity
                      </Link>
                      <Link
                        href="/private-debt-investment-platform"
                        className="block text-sm hover:text-primary transition-colors px-4 py-1.5 rounded-lg hover:bg-primary/5"
                        onClick={() => setOpen(false)}
                      >
                        Private Debt
                      </Link>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground px-4">Features</p>
                    <div className="space-y-1">
                      <Link
                        href="/investment-platform"
                        className="block text-sm hover:text-primary transition-colors px-4 py-1.5 rounded-lg hover:bg-primary/5"
                        onClick={() => setOpen(false)}
                      >
                        Platform Overview
                      </Link>
                      <Link
                        href="/fundraising-and-capital-raising"
                        className="block text-sm hover:text-primary transition-colors px-4 py-1.5 rounded-lg hover:bg-primary/5"
                        onClick={() => setOpen(false)}
                      >
                        Fundraising & Capital Raising
                      </Link>
                      <Link
                        href="/investor-portal"
                        className="block text-sm hover:text-primary transition-colors px-4 py-1.5 rounded-lg hover:bg-primary/5"
                        onClick={() => setOpen(false)}
                      >
                        Investor Portal
                      </Link>
                      <Link
                        href="/fund-administration-and-operations"
                        className="block text-sm hover:text-primary transition-colors px-4 py-1.5 rounded-lg hover:bg-primary/5"
                        onClick={() => setOpen(false)}
                      >
                        Fund Administration & Operations
                      </Link>
                      <Link
                        href="/investment-reporting-and-analytics"
                        className="block text-sm hover:text-primary transition-colors px-4 py-1.5 rounded-lg hover:bg-primary/5"
                        onClick={() => setOpen(false)}
                      >
                        Reporting & Analytics
                      </Link>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground px-4">Resources</p>
                    <div className="space-y-1">
                      <Link
                        href="/blog"
                        className="block text-sm hover:text-primary transition-colors px-4 py-1.5 rounded-lg hover:bg-primary/5"
                        onClick={() => setOpen(false)}
                      >
                        Blog
                      </Link>
                      <Link
                        href="/customer-success-stories"
                        className="block text-sm hover:text-primary transition-colors px-4 py-1.5 rounded-lg hover:bg-primary/5"
                        onClick={() => setOpen(false)}
                      >
                        Customer Success Stories
                      </Link>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground px-4">Company</p>
                    <div className="space-y-1">
                      <Link
                        href="/about-us"
                        className="block text-sm hover:text-primary transition-colors px-4 py-1.5 rounded-lg hover:bg-primary/5"
                        onClick={() => setOpen(false)}
                      >
                        About Us
                      </Link>
                      <Link
                        href="/free-demo"
                        className="block text-sm hover:text-primary transition-colors px-4 py-1.5 rounded-lg hover:bg-primary/5"
                        onClick={() => setOpen(false)}
                      >
                        Contact
                      </Link>
                    </div>
                  </div>

                  <Button asChild className="mt-4 mx-4 rounded-lg">
                    <Link href="/free-demo" onClick={() => setOpen(false)}>Free Demo</Link>
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>

            {/* Desktop CTA Button */}
            <Button asChild className="hidden md:flex">
              <Link href="/free-demo">Free Demo</Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
