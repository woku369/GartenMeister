
// Static generation für Dynamic Route
export async function generateStaticParams() {
  // Für Static Export generieren wir alle möglichen Beet-IDs (1-50)
  // Die echten Beete werden dann client-side geladen
  const bedIds = [];
  for (let i = 1; i <= 50; i++) {
    bedIds.push({ id: `bed-${i}` });
  }
  return bedIds;
}

// Import der Client Component
import EditBedPageClient from './EditBedPageClient';

// Server Component als Wrapper (Standard Export)
export default function EditBedPage({ params }: { params: Promise<{ id: string }> }) {
  return <EditBedPageClient params={params} />;
}