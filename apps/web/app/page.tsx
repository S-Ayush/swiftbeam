import Link from 'next/link';
import {
  Zap,
  Shield,
  Users,
  Lock,
  Globe,
  FileUp,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  Server,
  Github,
} from 'lucide-react';

// JSON-LD Structured Data
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'SwiftBeam',
  description:
    'Peer-to-peer file sharing platform that enables direct, secure file transfers without server storage.',
  url: 'https://swiftbeam-web.vercel.app',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Peer-to-peer file transfer',
    'No signup required',
    'End-to-end encryption',
    'Large file support up to 15GB',
    'Real-time chat',
    'Organization collaboration',
  ],
  browserRequirements: 'Requires WebRTC support',
};

export default function LandingPage() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen flex flex-col bg-background">
        {/* Minimal Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">SwiftBeam</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
              >
                Sign up
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative overflow-hidden py-20 sm:py-32">
            {/* Background gradient */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
            </div>

            <div className="container">
              <div className="mx-auto max-w-4xl text-center animate-fade-in-up">
                {/* Badge */}
                <div className="mb-6 inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium">
                  <Zap className="mr-2 h-4 w-4 text-primary" />
                  No signup required to start sharing
                </div>

                {/* Main Headline - H1 for SEO */}
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                  Share files{' '}
                  <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    instantly
                  </span>
                  <br />
                  with anyone, anywhere
                </h1>

                {/* Subheadline */}
                <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                  Peer-to-peer file sharing that respects your privacy. No server storage,
                  no file size limits up to 15GB. Your files go directly from you to your recipient.
                </p>

                {/* CTA Buttons */}
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/room/new"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-4 text-lg font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 group"
                  >
                    <FileUp className="mr-2 h-5 w-5" />
                    Start Sharing Now
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-4 text-lg font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Users className="mr-2 h-5 w-5" />
                    Create Organization
                  </Link>
                </div>

                {/* Trust indicators */}
                <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    End-to-end encrypted
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    No data stored on servers
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Works on all devices
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="py-16 border-y bg-muted/30">
            <div className="container">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { value: '15GB', label: 'Max file size', Icon: FileUp },
                  { value: '0', label: 'Files stored on servers', Icon: Server },
                  { value: '100%', label: 'Private & secure', Icon: Lock },
                  { value: '<1s', label: 'Connection time', Icon: Clock },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <stat.Icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-3xl sm:text-4xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20 sm:py-32" id="features">
            <div className="container">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Why choose SwiftBeam?
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                  Built for privacy, speed, and simplicity. Share files the way they should be shared.
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    Icon: Lock,
                    title: 'End-to-End Encrypted',
                    description:
                      'Files transfer directly between peers using WebRTC with DTLS encryption. We never see or store your data.',
                  },
                  {
                    Icon: Zap,
                    title: 'Lightning Fast',
                    description:
                      'No upload to servers means faster transfers. Files go straight from sender to receiver at maximum speed.',
                  },
                  {
                    Icon: Shield,
                    title: 'No Signup Required',
                    description:
                      'Start sharing immediately with a room code. No accounts, no email verification, no friction.',
                  },
                  {
                    Icon: Globe,
                    title: 'Works Everywhere',
                    description:
                      'Browser-based WebRTC technology works on any device. No app downloads or plugins needed.',
                  },
                  {
                    Icon: Users,
                    title: 'Team Collaboration',
                    description:
                      'Create organizations for your team. See who is online and initiate secure P2P sessions instantly.',
                  },
                  {
                    Icon: Eye,
                    title: 'Privacy First',
                    description:
                      'Sessions are ephemeral. Rooms auto-expire after 15 minutes of inactivity. No logs, no traces.',
                  },
                ].map((feature) => (
                  <div
                    key={feature.title}
                    className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                      <feature.Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="py-20 sm:py-32 bg-muted/30" id="how-it-works">
            <div className="container">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  How it works
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                  Share files in three simple steps. No complicated setup required.
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-3">
                {[
                  {
                    step: '01',
                    title: 'Create a Room',
                    description:
                      'Click "Start Sharing" to create a unique room with a shareable code. No signup needed.',
                  },
                  {
                    step: '02',
                    title: 'Share the Code',
                    description:
                      'Send the room code to your recipient. They can join instantly from any browser.',
                  },
                  {
                    step: '03',
                    title: 'Transfer Directly',
                    description:
                      'Once connected, drag and drop files. They transfer directly to your peer, not through servers.',
                  },
                ].map((item) => (
                  <div key={item.step} className="relative">
                    <div className="text-6xl font-bold text-primary/10 absolute -top-4 -left-2">
                      {item.step}
                    </div>
                    <div className="relative pt-8 pl-4">
                      <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Architecture diagram */}
              <div className="mt-16 p-8 rounded-xl bg-background border">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold">Direct Peer-to-Peer Architecture</h3>
                  <p className="text-sm text-muted-foreground">
                    Your files never touch our servers
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    You
                  </div>
                  <div className="hidden sm:block text-muted-foreground">
                    {'<'}--- WebRTC Encrypted ---{'>'}
                  </div>
                  <div className="sm:hidden text-muted-foreground text-center">
                    <div>↕</div>
                    <div>WebRTC Encrypted</div>
                    <div>↕</div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    Recipient
                  </div>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Server only handles initial connection (signaling), not your data
                </p>
              </div>
            </div>
          </section>

          {/* Use Cases Section */}
          <section className="py-20 sm:py-32">
            <div className="container">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Perfect for every use case
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                  Whether you are sharing with a friend or collaborating with your team.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {[
                  {
                    title: 'Quick File Sharing',
                    description:
                      'Send a large video to a friend? Share design files with a client? Just create a room and share the code.',
                    features: ['No signup needed', 'Works instantly', 'Any file type'],
                  },
                  {
                    title: 'Team Collaboration',
                    description:
                      'Create an organization for your team. See who is online and share files securely within your group.',
                    features: ['Real-time presence', 'Connection requests', 'Invite links'],
                  },
                ].map((useCase) => (
                  <div key={useCase.title} className="rounded-xl border bg-card p-8 shadow-sm">
                    <h3 className="text-2xl font-semibold mb-3">{useCase.title}</h3>
                    <p className="text-muted-foreground mb-6">{useCase.description}</p>
                    <ul className="space-y-2">
                      {useCase.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="py-20 sm:py-32 bg-primary text-primary-foreground">
            <div className="container">
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Ready to share files securely?
                </h2>
                <p className="mt-4 text-lg opacity-90">
                  Join thousands of users who trust SwiftBeam for fast, private file sharing.
                  No signup required to get started.
                </p>
                <div className="mt-10">
                  <Link
                    href="/room/new"
                    className="inline-flex items-center justify-center rounded-md bg-background text-foreground px-8 py-4 text-lg font-medium shadow-lg hover:bg-background/90 transition-all hover:scale-105 group"
                  >
                    <FileUp className="mr-2 h-5 w-5" />
                    Start Sharing Free
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t py-12 bg-muted/30">
          <div className="container">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">SwiftBeam</span>
              </div>

              <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
                <a
                  href="https://github.com/S-Ayush/swiftbeam"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </nav>

              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} SwiftBeam. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
