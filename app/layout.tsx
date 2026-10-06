import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'União • Gestão Financeira', description: 'Tesouraria, financeiro e relatórios gerenciais da União Supermercados.', icons: { icon: '/favicon.icose' } };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="pt-BR"><body>{children}</body></html>; }
