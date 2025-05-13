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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no" />
        {/* Script to handle mobile layout better */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // More reliable viewport height fix for mobile browsers
            function setAppHeight() {
              // Get the actual viewport height
              let vh = window.innerHeight * 0.01;
              // Set the CSS variable
              document.documentElement.style.setProperty('--app-height', \`\${window.innerHeight}px\`);
              
              // Force relayout for iOS/Chrome
              document.body.style.height = '100%';
              document.body.style.height = 'var(--app-height)';
              
              // Scroll to top to avoid issues with keyboard
              window.scrollTo(0, 0);
            }
            
            // Run on page load
            window.addEventListener('load', setAppHeight);
            
            // Update on resize with debounce
            let resizeTimer;
            window.addEventListener('resize', function() {
              clearTimeout(resizeTimer);
              resizeTimer = setTimeout(setAppHeight, 100);
            });
            
            // Update immediately for first render
            setAppHeight();
            
            // Update on orientation change
            window.addEventListener('orientationchange', function() {
              // Wait a bit for the orientation change to complete
              setTimeout(setAppHeight, 200);
            });
            
            // Additional fixes for iOS
            window.addEventListener('focusin', function() {
              // Keyboard appeared, adjust height after a delay
              setTimeout(setAppHeight, 300);
            });
            
            window.addEventListener('focusout', function() {
              // Keyboard disappeared, reset height
              setTimeout(setAppHeight, 300);
            });
          `
        }} />
      </head>
      <body className="font-sans antialiased">
        {children}
        {/* Prefetch palettes data in the background */}
        <PalettesPrefetcher />
      </body>
    </html>
  );
}
