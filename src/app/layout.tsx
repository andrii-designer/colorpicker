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
        {/* Script to handle mobile layout better - aggressive approach */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Fix for mobile 100vh issue - aggressive approach
            (function() {
              // Force layout recalculation on all browsers
              function fixViewportHeight() {
                // Get viewport dimensions
                const windowHeight = window.innerHeight;
                
                // Apply viewport height to root and document
                document.documentElement.style.setProperty('--app-height', \`\${windowHeight}px\`);
                
                // Force reflow through multiple approaches - important for Safari
                document.body.style.height = \`\${windowHeight}px\`;
                document.documentElement.style.height = \`\${windowHeight}px\`;
                
                // Forcefully prevent scrolling on body and html
                document.body.style.overflow = 'hidden';
                document.documentElement.style.overflow = 'hidden';
                
                // Scroll to top to ensure we're at the top of the page
                window.scrollTo(0, 0);
                
                // Request animation frame for smoother handling
                requestAnimationFrame(() => {
                  // Apply the height again after a frame to ensure it sticks
                  document.documentElement.style.setProperty('--app-height', \`\${windowHeight}px\`);
                });
              }
              
              // Run immediately
              fixViewportHeight();
              
              // Run on first layout event
              window.addEventListener('load', fixViewportHeight, { passive: true });
              
              // Run on resize with debounce
              let resizeTimer;
              window.addEventListener('resize', function() {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(fixViewportHeight, 50);
              }, { passive: true });
              
              // Run on orientation change
              window.addEventListener('orientationchange', function() {
                // Run immediately
                fixViewportHeight();
                
                // Run again after a short delay to catch iOS adjustments
                setTimeout(fixViewportHeight, 50);
                
                // Run a third time after iOS fully adjusts
                setTimeout(fixViewportHeight, 150);
              }, { passive: true });
              
              // Additional mobile-specific events
              window.addEventListener('touchend', function() {
                // Short delay after touch ends (helpful for some browsers)
                setTimeout(fixViewportHeight, 100);
              }, { passive: true });
              
              // For mobile keyboard appearing/disappearing
              window.addEventListener('focusin', function() {
                setTimeout(fixViewportHeight, 200);
              }, { passive: true });
              
              window.addEventListener('focusout', function() {
                setTimeout(fixViewportHeight, 200);
              }, { passive: true });
              
              // Run periodically to ensure it stays correct (some browsers need this)
              setInterval(fixViewportHeight, 2000);
            })();
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
