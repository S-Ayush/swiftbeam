import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service - SwiftBeam',
  description: 'Terms of Service for SwiftBeam P2P file sharing platform',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-12">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Terms of Service</CardTitle>
              <p className="text-sm text-muted-foreground">
                Last updated: January 2025
              </p>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing or using SwiftBeam (&quot;the Service&quot;), you agree to be bound
                by these Terms of Service. If you do not agree to these terms, please
                do not use the Service.
              </p>

              <h2>2. Description of Service</h2>
              <p>
                SwiftBeam is a peer-to-peer file sharing platform that enables direct
                file transfers between users through WebRTC technology. The Service
                facilitates connection establishment but does not store or transmit
                the files being shared.
              </p>

              <h2>3. User Accounts</h2>

              <h3>3.1 Account Creation</h3>
              <p>
                To use certain features, you must create an account. You agree to
                provide accurate information and keep your account credentials secure.
              </p>

              <h3>3.2 Account Responsibility</h3>
              <p>
                You are responsible for all activities under your account. Notify us
                immediately of any unauthorized use.
              </p>

              <h2>4. Acceptable Use</h2>
              <p>You agree NOT to use the Service to:</p>
              <ul>
                <li>Share illegal content or copyrighted material without authorization</li>
                <li>Distribute malware, viruses, or harmful software</li>
                <li>Harass, threaten, or harm other users</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Use the Service for any unlawful purpose</li>
                <li>Impersonate others or misrepresent your identity</li>
              </ul>

              <h2>5. Organizations</h2>

              <h3>5.1 Creating Organizations</h3>
              <p>
                Users can create organizations to share files within a trusted group.
                Organization creators are responsible for managing membership.
              </p>

              <h3>5.2 Organization Conduct</h3>
              <p>
                All organization members must adhere to these Terms. Organization
                administrators may be held responsible for content shared within
                their organizations.
              </p>

              <h2>6. Privacy and Data</h2>
              <p>
                Your use of the Service is also governed by our{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                . By using the Service, you consent to our data practices as
                described therein.
              </p>

              <h2>7. Intellectual Property</h2>

              <h3>7.1 Service Content</h3>
              <p>
                The Service, including its design, features, and code, is owned by
                SwiftBeam and protected by intellectual property laws.
              </p>

              <h3>7.2 User Content</h3>
              <p>
                You retain ownership of files you share. By using the Service, you
                represent that you have the right to share such content.
              </p>

              <h2>8. Disclaimers</h2>

              <h3>8.1 Service Availability</h3>
              <p>
                The Service is provided &quot;as is&quot; without warranties of any kind. We
                do not guarantee uninterrupted or error-free operation.
              </p>

              <h3>8.2 Content Disclaimer</h3>
              <p>
                We do not monitor, verify, or endorse content shared between users.
                Users are solely responsible for the content they share.
              </p>

              <h3>8.3 Peer-to-Peer Nature</h3>
              <p>
                File transfers occur directly between users. We cannot guarantee
                transfer success, speed, or security beyond the initial connection
                establishment.
              </p>

              <h2>9. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, SwiftBeam shall not be liable
                for any indirect, incidental, special, consequential, or punitive
                damages arising from your use of the Service.
              </p>

              <h2>10. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless SwiftBeam from any claims,
                damages, or expenses arising from your use of the Service or
                violation of these Terms.
              </p>

              <h2>11. Termination</h2>
              <p>
                We may suspend or terminate your access to the Service at any time,
                with or without cause. You may delete your account at any time through
                your account settings.
              </p>

              <h2>12. Changes to Terms</h2>
              <p>
                We may update these Terms from time to time. Continued use of the
                Service after changes constitutes acceptance of the new Terms.
              </p>

              <h2>13. Governing Law</h2>
              <p>
                These Terms are governed by applicable laws. Any disputes shall be
                resolved through appropriate legal channels.
              </p>

              <h2>14. Contact</h2>
              <p>
                For questions about these Terms, please contact us at{' '}
                <a href="mailto:legal@swiftbeam.app">legal@swiftbeam.app</a>.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
