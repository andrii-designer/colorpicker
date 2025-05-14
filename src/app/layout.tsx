import "./globals.css";
import { Inter } from 'next/font/google';
import dynamic from 'next/dynamic';

// Dynamically import the prefetcher to avoid SSR issues
const PalettesPrefetcher = dynamic(
  () => import('./components/PalettesPrefetcher'),
  { ssr: false }
);

// Dynamically import the mobile viewport fix component to avoid SSR issues
const MobileViewportFix = dynamic(
  () => import('./components/MobileViewportFix'),
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />
        {/* Script to handle mobile layout better - ultra aggressive approach for deployment environments */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Ultra aggressive mobile viewport fix - deployment optimized
            (function() {
              // Determine if running on iOS
              const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
              
              // Fix for mobile 100vh issue with multiple approaches
              function fixViewportHeight() {
                try {
                  // Multiple measurement approaches for redundancy
                  let windowHeight = window.innerHeight;
                  let visualHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
                  const screenHeight = window.screen.height;
                  
                  // For iOS Safari, use a special calculation
                  if (isIOS) {
                    // In iOS 15+, use visualViewport when available
                    if (window.visualViewport) {
                      windowHeight = window.visualViewport.height;
                    } else {
                      // Fallback for older iOS
                      windowHeight = Math.min(windowHeight, screenHeight);
                    }
                  }
                  
                  // Use the most reliable height measurement
                  const reliableHeight = Math.min(windowHeight, visualHeight);
                  
                  // Force set document level custom property and attributes
                  document.documentElement.style.setProperty('--app-height', \`\${reliableHeight}px\`);
                  
                  // Create a specific mobile adjustment for safe areas
                  document.documentElement.style.setProperty('--safe-bottom', \`\${Math.max(0, parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom') || '0'))}\`);
                  
                  // Apply height directly to critical elements
                  document.documentElement.style.height = \`\${reliableHeight}px\`;
                  document.body.style.height = \`\${reliableHeight}px\`;
                  
                  // Set a data attribute for debugging
                  document.documentElement.setAttribute('data-viewport-height', String(reliableHeight));
                  
                  // Reset any scroll position for iOS
                  if (isIOS) {
                    window.scrollTo(0, 0);
                  }
                  
                  // Update all mobile container elements that might rely on height
                  const containers = document.querySelectorAll('.flex-1');
                  containers.forEach(container => {
                    if (container instanceof HTMLElement) {
                      void container.offsetHeight;
                    }
                  });
                  
                  // Force a reflow
                  void document.documentElement.offsetHeight;
                  
                  // Use RAF for additional update chance
                  requestAnimationFrame(() => {
                    document.documentElement.style.setProperty('--app-height', \`\${reliableHeight}px\`);
                  });
                } catch (error) {
                  console.error('Error in viewport height fix:', error);
                }
              }
              
              // Call immediately
              fixViewportHeight();
              
              // Set up multiple event listeners with options
              const events = ['resize', 'orientationchange', 'load', 'pageshow'];
              
              events.forEach(eventName => {
                window.addEventListener(eventName, () => {
                  // Immediate fix
                  fixViewportHeight();
                  
                  // Delayed fix for any animations to complete
                  setTimeout(fixViewportHeight, 100);
                }, { passive: true });
              });
              
              // For devices with dynamic chrome (like iOS Safari)
              if (isIOS) {
                // Additional iOS-specific handlers
                window.addEventListener('touchend', () => {
                  setTimeout(fixViewportHeight, 100);
                }, { passive: true });
                
                // Track scroll for iOS toolbar show/hide
                let lastScrollY = window.scrollY;
                window.addEventListener('scroll', () => {
                  if (Math.abs(window.scrollY - lastScrollY) > 20) {
                    lastScrollY = window.scrollY;
                    fixViewportHeight();
                  }
                }, { passive: true });
              }
              
              // Also track focus events for keyboard
              window.addEventListener('focusin', () => setTimeout(fixViewportHeight, 200), { passive: true });
              window.addEventListener('focusout', () => setTimeout(fixViewportHeight, 200), { passive: true });
              
              // For debugging - expose to global
              window.__fixViewportHeight = fixViewportHeight;
            })();
          `
        }} />
      </head>
      <body className="font-sans antialiased">
        {children}
        {/* Add mobile viewport fix component */}
        <MobileViewportFix />
        {/* Prefetch palettes data in the background */}
        <PalettesPrefetcher />
      </body>
    </html>
  );
}
