import './globals.css';
import './theme.css';
import './account.css';
import './finance.css';
export const metadata = {
    title: 'FinWise — Your money, in focus',
    description: 'A thoughtful home for your everyday finances.',
};
export default function RootLayout({ children }) {
    return <html lang="en"><body>{children}</body></html>;
}
