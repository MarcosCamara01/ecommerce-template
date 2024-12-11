import { Suspense } from 'react';
import OrderList from '@/components/admin/OrderList';
import ProductList from '@/components/admin/ProductList';
import UserList from '@/components/admin/UserList';

const AdminPage = () => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Sales Stats</h2>
      <Suspense fallback={<div>Loading orders...</div>}>
        <div className="mb-8">
          <p>Sales stats will be displayed here.</p>
        </div>
      </Suspense>
    </div>
  );
};

export default AdminPage;