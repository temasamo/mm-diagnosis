import dynamic from 'next/dynamic';

const PrimaryExplainClient = dynamic(() => import('./PrimaryExplainClient'), { ssr: false });

export default function PrimaryExplainGate() {
  return process.env.NEXT_PUBLIC_FEATURE_PRIMARY_EXPLAIN === '1'
    ? <PrimaryExplainClient />
    : null;
}
