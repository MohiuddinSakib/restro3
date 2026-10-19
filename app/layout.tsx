import type { Metadata } from 'next';
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "L'ÉTOILE | Experience Fine Dining",
  description: "Immerse yourself in sensory mastery, locally sourced heritage ingredients, and culinary architecture at L'Étoile Atelier Gastronomique.",
  openGraph: {
    title: "L'ÉTOILE | Experience Fine Dining",
    description: "Immerse yourself in sensory mastery, locally sourced heritage ingredients, and culinary architecture.",
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "L'ÉTOILE | Experience Fine Dining",
    description: "Immerse yourself in sensory mastery, locally sourced heritage ingredients, and culinary architecture.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${plusJakarta.variable} scroll-smooth`}>
      <body className="font-sans antialiased bg-[#ECE7DC] text-[#221E19] selection:bg-[#C19A6B] selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
