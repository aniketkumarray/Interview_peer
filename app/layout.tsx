import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth-context';

export const metadata: Metadata = {
  title: 'PeerConnect — Reciprocal Mock Interview Marketplace',
  description: 'Find compatible practice partners, schedule 1-on-1 mock interviews, meet via private Jitsi video links, and build a verified practice streak.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0A0A0A] text-slate-100 antialiased selection:bg-sandow-500 selection:text-white min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
