import { Suspense } from 'react';
import type { Metadata } from 'next';
import { GuideClient } from '@/components/guide/GuideClient';

export const metadata: Metadata = {
  title: 'Help center · Enterhub',
  description:
    'Learn Enterhub by role — projects, departments, My Tasks, chat, meetings, email, billing, and analytics.',
};

export default function GuidePage() {
  return (
    <Suspense>
      <GuideClient />
    </Suspense>
  );
}
