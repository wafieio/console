import { ApplicationLayoutWrapper } from '@/app/components/application/ApplicationLayoutWrapper';

export default function ApplicationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  return (
    <ApplicationLayoutWrapper params={params}>
      {children}
    </ApplicationLayoutWrapper>
  );
}