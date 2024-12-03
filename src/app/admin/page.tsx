import { Suspense } from 'react';
import OrderList from '@/components/admin/OrderList';
import ProductList from '@/components/admin/ProductList';
import UserList from '@/components/admin/UserList';

const AdminPage = () => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Sales Stats</h2>
      <div className="mb-8">
        <p>Sales stats will be displayed here.</p>
      </div>
      <Suspense fallback={<div>Loading orders...</div>}>
        <OrderList />
      </Suspense>
      <Suspense fallback={<div>Loading products...</div>}>
        <ProductList />
      </Suspense>
      <Suspense fallback={<div>Loading users...</div>}>
        <UserList />
      </Suspense>
    </div>
  );
};

export default AdminPage;