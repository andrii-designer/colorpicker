import "./globals.css";
import { Inter } from 'next/font/google';
import dynamic from 'next/dynamic';

// Dynamically import the prefetcher to avoid SSR issues
const PalettesPrefetcher = dynamic(
  () => import('./components/PalettesPrefetcher'),
  { ssr: false }
);

// Initialize the Inter font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'Color Palette Generator',
  description: 'Create beautiful color palettes for your design projects.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="font-sans antialiased">
        {children}
        {/* Prefetch palettes data in the background */}
        <PalettesPrefetcher />
      </body>
    </html>
  );
}
