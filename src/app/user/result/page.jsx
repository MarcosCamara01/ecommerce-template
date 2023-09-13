"use client"

import { useSearchParams } from 'next/navigation';
import PrintObject from '@/components/PrintObject';
import useSWR from 'swr';
import { fetchGetJSON } from '@/utils/api-helpers';

function CheckoutSuccess() {
  const searchParams = useSearchParams()
 
  const session_id = searchParams.get('session_id')

  const { data, error } = useSWR(
    () => `/api/payment/${session_id}`,
    fetchGetJSON
  );

  if (error) return <div>failed to load</div>;

  return (
    <section>
      <div className="page-container">
        <h1>Checkout Payment Result</h1>
        <h2>Status: {data?.payment_intent?.status ?? 'loading...'}</h2>
        <h3>CheckoutSession response:</h3>
        <PrintObject content={data ?? 'loading...'} />
      </div>
    </section>
  );
}

export default CheckoutSuccess;
