import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'MIRAGE — Cyber Deception Lab', description: 'A hands-on, safe cybersecurity deception simulation lab.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
