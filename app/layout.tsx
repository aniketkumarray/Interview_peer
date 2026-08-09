import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth-context';
import { PWAInstaller } from '@/components/pwa-installer';

export const metadata: Metadata = {
  title: 'PeerConnect — Reciprocal Mock Interview Marketplace',
  description: 'Find compatible practice partners, schedule 1-on-1 mock interviews, meet via private Jitsi video links, and build a verified practice streak.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PeerConnect',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0A0A0A',
  interactiveWidget: 'resizes-content',
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
          <PWAInstaller />
        </AuthProvider>
      </body>
    </html>
  );
}
