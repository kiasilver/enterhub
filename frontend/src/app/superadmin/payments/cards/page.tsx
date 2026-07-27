import { redirect } from 'next/navigation';

/** Cards CRUD lives on /superadmin/payments — keep plan route alias. */
export default function PaymentsCardsPage() {
  redirect('/superadmin/payments');
}
