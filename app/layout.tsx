import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth-context';

export const metadata: Metadata = {
  title: 'PeerMock — Reciprocal Mock Interview Marketplace',
  description: 'Find compatible practice partners, schedule 1-on-1 mock interviews, meet via private Jitsi video links, and build a verified practice streak.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-teal-500 selection:text-slate-950 min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
