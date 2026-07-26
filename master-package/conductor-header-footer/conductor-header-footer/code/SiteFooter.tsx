/**
 * Public SiteFooter — use on Landing / Demo / Login layouts.
 * Keep App (dashboard) layouts free of this heavy footer.
 */

import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1 space-y-3">
            <Link href="/" className="font-semibold tracking-tight text-foreground">
              Conductor
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              One human. A crew of agents.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/demo" className="hover:text-foreground transition-colors">
                  Live demo
                </Link>
              </li>
              <li>
                <Link href="/demo/moment" className="hover:text-foreground transition-colors">
                  Needs You moment
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Account</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  Sign in
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@conductor.example"
                  className="hover:text-foreground transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Conductor. All rights reserved.</p>
          <p className="text-muted-foreground/80">
            AI outputs may be incorrect. You remain responsible for decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}
