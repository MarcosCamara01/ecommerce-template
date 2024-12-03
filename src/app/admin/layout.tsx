import { ReactNode } from 'react';
import AdminNavbar from '@/components/admin/AdminNavbar';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen">
      <div className="w-64 bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>
        <AdminNavbar />
      </div>
      <div className="flex-1 p-8 bg-gray-100 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;