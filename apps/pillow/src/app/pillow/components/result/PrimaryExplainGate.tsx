import dynamic from 'next/dynamic';

const PrimaryExplainClient = dynamic(
  () => import('./PrimaryExplainClient'),
  { ssr: false, loading: () => null } // クライアント専用・ちらつき防止
);

type Props = { profile: any };

export default function PrimaryExplainGate({ profile }: Props) {
  if (process.env.NEXT_PUBLIC_FEATURE_PRIMARY_EXPLAIN !== '1') return null;
  return <PrimaryExplainClient profile={profile　?? {}} />;
}
