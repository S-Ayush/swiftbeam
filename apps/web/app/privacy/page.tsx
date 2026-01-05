import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy - SwiftBeam',
  description: 'Privacy Policy for SwiftBeam P2P file sharing platform',
};

export default function PrivacyPage() {
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
              <CardTitle className="text-2xl">Privacy Policy</CardTitle>
              <p className="text-sm text-muted-foreground">
                Last updated: January 2025
              </p>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <h2>1. Introduction</h2>
              <p>
                SwiftBeam ("we", "our", or "us") is committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, and safeguard your information
                when you use our peer-to-peer file sharing service.
              </p>

              <h2>2. Information We Collect</h2>

              <h3>2.1 Account Information</h3>
              <p>When you create an account, we collect:</p>
              <ul>
                <li>Name</li>
                <li>Email address</li>
                <li>Password (stored securely using bcrypt hashing)</li>
              </ul>

              <h3>2.2 Organization Information</h3>
              <p>When you create or join an organization, we collect:</p>
              <ul>
                <li>Organization name</li>
                <li>Membership information</li>
              </ul>

              <h3>2.3 Technical Information</h3>
              <p>We automatically collect:</p>
              <ul>
                <li>IP address (for rate limiting and security)</li>
                <li>Browser type and version</li>
                <li>Connection timestamps</li>
              </ul>

              <h2>3. What We Do NOT Collect</h2>
              <p>
                SwiftBeam is designed with privacy as a core principle. We do NOT:
              </p>
              <ul>
                <li>Store any files you transfer - all transfers are peer-to-peer</li>
                <li>Read or access the content of your messages</li>
                <li>Keep logs of your file transfers</li>
                <li>Track what files you share</li>
                <li>Store data after your session ends</li>
              </ul>

              <h2>4. How We Use Your Information</h2>
              <p>We use collected information to:</p>
              <ul>
                <li>Provide and maintain the service</li>
                <li>Authenticate users and manage sessions</li>
                <li>Facilitate WebRTC connection establishment (signaling only)</li>
                <li>Prevent abuse and enforce rate limits</li>
                <li>Send important service notifications</li>
              </ul>

              <h2>5. Data Storage and Security</h2>
              <p>
                Account data is stored securely in our database. Passwords are hashed using
                bcrypt and are never stored in plain text. Room codes and session data are
                temporary and automatically expire after 15 minutes of inactivity.
              </p>

              <h2>6. Peer-to-Peer Transfers</h2>
              <p>
                All file and message transfers use WebRTC technology, which creates direct
                encrypted connections between users. Our servers only facilitate the initial
                connection (signaling) and never see or store the transferred content.
              </p>

              <h2>7. Data Retention</h2>
              <ul>
                <li>Account data: Retained until you delete your account</li>
                <li>Session data: Deleted after session ends or 15 minutes of inactivity</li>
                <li>Transferred files: Never stored (peer-to-peer only)</li>
              </ul>

              <h2>8. Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access your account information</li>
                <li>Update your account details</li>
                <li>Delete your account and all associated data</li>
                <li>Leave any organization you've joined</li>
              </ul>

              <h2>9. Third-Party Services</h2>
              <p>We use the following third-party services:</p>
              <ul>
                <li>STUN/TURN servers for WebRTC connection establishment</li>
                <li>Cloud hosting providers for application hosting</li>
              </ul>

              <h2>10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of
                any changes by posting the new Privacy Policy on this page and updating the
                "Last updated" date.
              </p>

              <h2>11. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:privacy@swiftbeam.app">privacy@swiftbeam.app</a>.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
