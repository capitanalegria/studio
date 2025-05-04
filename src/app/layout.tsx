import type {Metadata} from 'next';
import { Inter } from 'next/font/google' // Use Inter for a modern geometric feel
import './globals.css';
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Latent Space Explorer',
  description: 'Explore latent spaces visually',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      {/* Head is implicitly added by Next.js unless a custom one is defined */}
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <main className="flex min-h-screen flex-col items-center justify-center">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
