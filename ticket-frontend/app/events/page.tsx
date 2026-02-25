import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { EventsPageClient } from './events-page-client';

export const metadata = {
  title: 'Events | Event Ticketing',
  description: 'Discover and browse events worldwide.',
};

type SearchParams = { country?: string; city?: string };

export default function EventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <EventsPageClient searchParams={searchParams} />
      <SiteFooter />
    </div>
  );
}
