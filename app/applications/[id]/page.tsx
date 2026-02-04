import { redirect } from 'next/navigation';

export default async function ApplicationRootPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  // Redirect to the overview page as the default
  redirect(`/applications/${resolvedParams.id}/overview`);
}