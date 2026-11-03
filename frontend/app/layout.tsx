import type { Metadata } from 'next';
import './globals.css';
import './theme.css';
import './account.css';
import './finance.css';

export const metadata: Metadata = {
  title: 'FinWise — Your money, in focus',
  description: 'A thoughtful home for your everyday finances.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
