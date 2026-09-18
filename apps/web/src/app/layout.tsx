import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Web App Assessment',
  description: 'A small web and the browser used to read it.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
