import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'MIRAGE — Cyber Deception Lab', description: 'A hands-on, safe cybersecurity deception simulation lab.' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#0b0d14' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
