'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  Loader2,
  Github,
} from 'lucide-react';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

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
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const prefersReducedMotion = useReducedMotion();

  // Redirect authenticated users
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Loading state
  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Animation settings based on user preference
  const animationProps = prefersReducedMotion
    ? { initial: 'visible', animate: 'visible' }
    : { initial: 'hidden', whileInView: 'visible', viewport: { once: true, margin: '-50px' } };

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const };

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
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign up</Button>
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
              <motion.div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] bg-primary/10 rounded-full blur-3xl"
                animate={prefersReducedMotion ? {} : { scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>

            <div className="container">
              <motion.div
                className="mx-auto max-w-4xl text-center"
                variants={staggerContainer}
                {...animationProps}
              >
                {/* Badge */}
                <motion.div
                  variants={fadeInUp}
                  transition={transition}
                  className="mb-6 inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium"
                >
                  <Zap className="mr-2 h-4 w-4 text-primary" />
                  No signup required to start sharing
                </motion.div>

                {/* Main Headline - H1 for SEO */}
                <motion.h1
                  variants={fadeInUp}
                  transition={{ ...transition, delay: 0.1 }}
                  className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
                >
                  Share files{' '}
                  <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    instantly
                  </span>
                  <br />
                  with anyone, anywhere
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                  variants={fadeInUp}
                  transition={{ ...transition, delay: 0.2 }}
                  className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto"
                >
                  Peer-to-peer file sharing that respects your privacy. No server storage,
                  no file size limits up to 15GB. Your files go directly from you to your recipient.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  variants={fadeInUp}
                  transition={{ ...transition, delay: 0.3 }}
                  className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                  <Link href="/room/new">
                    <Button size="lg" className="group text-lg px-8 py-6">
                      <FileUp className="mr-2 h-5 w-5" />
                      Start Sharing Now
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                      <Users className="mr-2 h-5 w-5" />
                      Create Organization
                    </Button>
                  </Link>
                </motion.div>

                {/* Trust indicators */}
                <motion.div
                  variants={fadeInUp}
                  transition={{ ...transition, delay: 0.4 }}
                  className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground"
                >
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
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="py-16 border-y bg-muted/30">
            <div className="container">
              <motion.div
                className="grid grid-cols-2 md:grid-cols-4 gap-8"
                variants={staggerContainer}
                {...animationProps}
              >
                {[
                  { value: '15GB', label: 'Max file size', icon: FileUp },
                  { value: '0', label: 'Files stored on servers', icon: Server },
                  { value: '100%', label: 'Private & secure', icon: Lock },
                  { value: '<1s', label: 'Connection time', icon: Clock },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    variants={scaleIn}
                    transition={{ ...transition, delay: index * 0.1 }}
                    className="text-center"
                  >
                    <stat.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-3xl sm:text-4xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20 sm:py-32" id="features">
            <div className="container">
              <motion.div
                className="text-center mb-16"
                variants={fadeInUp}
                {...animationProps}
                transition={transition}
              >
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Why choose SwiftBeam?
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                  Built for privacy, speed, and simplicity. Share files the way they should be shared.
                </p>
              </motion.div>

              <motion.div
                className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
                variants={staggerContainer}
                {...animationProps}
              >
                {[
                  {
                    icon: Lock,
                    title: 'End-to-End Encrypted',
                    description:
                      'Files transfer directly between peers using WebRTC with DTLS encryption. We never see or store your data.',
                  },
                  {
                    icon: Zap,
                    title: 'Lightning Fast',
                    description:
                      'No upload to servers means faster transfers. Files go straight from sender to receiver at maximum speed.',
                  },
                  {
                    icon: Shield,
                    title: 'No Signup Required',
                    description:
                      'Start sharing immediately with a room code. No accounts, no email verification, no friction.',
                  },
                  {
                    icon: Globe,
                    title: 'Works Everywhere',
                    description:
                      'Browser-based WebRTC technology works on any device. No app downloads or plugins needed.',
                  },
                  {
                    icon: Users,
                    title: 'Team Collaboration',
                    description:
                      'Create organizations for your team. See who is online and initiate secure P2P sessions instantly.',
                  },
                  {
                    icon: Eye,
                    title: 'Privacy First',
                    description:
                      'Sessions are ephemeral. Rooms auto-expire after 15 minutes of inactivity. No logs, no traces.',
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    variants={fadeInUp}
                    transition={{ ...transition, delay: index * 0.1 }}
                  >
                    <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1">
                      <CardContent className="p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                          <feature.icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="py-20 sm:py-32 bg-muted/30" id="how-it-works">
            <div className="container">
              <motion.div
                className="text-center mb-16"
                variants={fadeInUp}
                {...animationProps}
                transition={transition}
              >
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  How it works
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                  Share files in three simple steps. No complicated setup required.
                </p>
              </motion.div>

              <motion.div
                className="grid gap-8 md:grid-cols-3"
                variants={staggerContainer}
                {...animationProps}
              >
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
                ].map((item, index) => (
                  <motion.div
                    key={item.step}
                    variants={fadeInUp}
                    transition={{ ...transition, delay: index * 0.15 }}
                    className="relative"
                  >
                    <div className="text-6xl font-bold text-primary/10 absolute -top-4 -left-2">
                      {item.step}
                    </div>
                    <div className="relative pt-8 pl-4">
                      <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Architecture diagram */}
              <motion.div
                className="mt-16 p-8 rounded-xl bg-background border"
                variants={scaleIn}
                {...animationProps}
                transition={{ ...transition, delay: 0.3 }}
              >
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
                    <div>|</div>
                    <div>WebRTC</div>
                    <div>Encrypted</div>
                    <div>|</div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    Recipient
                  </div>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Server only handles initial connection (signaling), not your data
                </p>
              </motion.div>
            </div>
          </section>

          {/* Use Cases Section */}
          <section className="py-20 sm:py-32">
            <div className="container">
              <motion.div
                className="text-center mb-16"
                variants={fadeInUp}
                {...animationProps}
                transition={transition}
              >
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Perfect for every use case
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                  Whether you are sharing with a friend or collaborating with your team.
                </p>
              </motion.div>

              <motion.div
                className="grid gap-6 md:grid-cols-2"
                variants={staggerContainer}
                {...animationProps}
              >
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
                ].map((useCase, index) => (
                  <motion.div
                    key={useCase.title}
                    variants={fadeInUp}
                    transition={{ ...transition, delay: index * 0.15 }}
                  >
                    <Card className="h-full">
                      <CardContent className="p-8">
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
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="py-20 sm:py-32 bg-primary text-primary-foreground">
            <div className="container">
              <motion.div
                className="text-center max-w-3xl mx-auto"
                variants={staggerContainer}
                {...animationProps}
              >
                <motion.h2
                  variants={fadeInUp}
                  transition={transition}
                  className="text-3xl sm:text-4xl font-bold tracking-tight"
                >
                  Ready to share files securely?
                </motion.h2>
                <motion.p
                  variants={fadeInUp}
                  transition={{ ...transition, delay: 0.1 }}
                  className="mt-4 text-lg opacity-90"
                >
                  Join thousands of users who trust SwiftBeam for fast, private file sharing.
                  No signup required to get started.
                </motion.p>
                <motion.div
                  variants={fadeInUp}
                  transition={{ ...transition, delay: 0.2 }}
                  className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                  <Link href="/room/new">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="text-lg px-8 py-6 group"
                    >
                      <FileUp className="mr-2 h-5 w-5" />
                      Start Sharing Free
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
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
                &copy; {new Date().getFullYear()} SwiftBeam. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
