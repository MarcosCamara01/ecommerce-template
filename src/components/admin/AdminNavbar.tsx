'use client';

import Link from 'next/link';

const AdminNavbar = () => {
  return (
    <nav className="space-y-2">
      <Link href="/admin/orders" className="block py-2 px-4 hover:bg-gray-700 rounded">
        Orders
      </Link>
      <Link href="/admin/products" className="block py-2 px-4 hover:bg-gray-700 rounded">
        Products
      </Link>
      <Link href="/admin/users" className="block py-2 px-4 hover:bg-gray-700 rounded">
        Users
      </Link>
    </nav>
  );
};

export default AdminNavbar;