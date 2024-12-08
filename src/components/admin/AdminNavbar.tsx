'use client';

import { Dialog, DialogTrigger } from '@radix-ui/react-dialog';
import { Session } from 'next-auth';
import Link from 'next/link';
import { useState } from 'react';
import EditProfile from '../common/EditProfile';
import { UserMenu } from '../common/UserMenu';

// ... existing imports ...

interface Navbar {
  session: Session | null;
}

export const AdminNavbar = ({ session }: Navbar) => {
  const [isHeaderOpen, setIsHeaderOpen] = useState(false);

  const adminLinks = [
    { path: "/admin/orders", name: "Orders" },
    { path: "/admin/products", name: "Products" },
    { path: "/admin/users", name: "Users" },
    { path: "/admin/stats", name: "Stats" },
  ];

  const authLinks = () => {
    if (session?.user) {
      return (
        <>
          <li className="flex lg:hidden">
            <Dialog>
              <DialogTrigger asChild>
                <button className="flex items-center w-full h-full px-4 py-2">
                  <svg
                    data-testid="geist-icon"
                    height="16"
                    strokeLinejoin="round"
                    viewBox="0 0 16 16"
                    width="16"
                    className="mr-2"
                    style={{ color: "currentColor" }}
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M7.75 0C5.95507 0 4.5 1.45507 4.5 3.25V3.75C4.5 5.54493 5.95507 7 7.75 7H8.25C10.0449 7 11.5 5.54493 11.5 3.75V3.25C11.5 1.45507 10.0449 0 8.25 0H7.75ZM6 3.25C6 2.2835 6.7835 1.5 7.75 1.5H8.25C9.2165 1.5 10 2.2835 10 3.25V3.75C10 4.7165 9.2165 5.5 8.25 5.5H7.75C6.7835 5.5 6 4.7165 6 3.75V3.25Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                  <span>Edit profile</span>
                </button>
              </DialogTrigger>
              <EditProfile />
            </Dialog>
          </li>

          <li className="items-center justify-center hidden lg:flex">
            <UserMenu fastSession={session} />
          </li>
        </>
      );
    } else {
      return (
        <li className="flex items-center justify-center">
          <Link
            href="/login"
            className="text-sm px-4 py-2 transition-all lg:text-[#A1A1A1] hover:text-[#EDEDED] font-medium"
          >
            Login
          </Link>
        </li>
      );
    }
  };

  return (
    <header className="pointer-events-auto w-full px-3.5 gap-4 xs:px-6 sm:px-12 py-6 flex items-center justify-between bg-background-secondary border-b border-solid border-border-primary">
      {/* Left side - User Session */}
      <div className="flex items-center">
        {authLinks()}
      </div>

      {/* Right side - Admin Links */}
      <nav className="hidden lg:block">
        <ul className="flex items-center gap-6">
          {adminLinks.map((link) => (
            <li key={link.path}>
              <Link
                href={link.path}
                className="text-sm px-4 py-2 transition-all text-[#A1A1A1] hover:text-[#EDEDED] font-medium"
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsHeaderOpen(!isHeaderOpen)}
        className="lg:hidden p-2"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1.5 3C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H13.5C13.7761 4 14 3.77614 14 3.5C14 3.22386 13.7761 3 13.5 3H1.5ZM1 7.5C1 7.22386 1.22386 7 1.5 7H13.5C13.7761 7 14 7.22386 14 7.5C14 7.77614 13.7761 8 13.5 8H1.5C1.22386 8 1 7.77614 1 7.5ZM1 11.5C1 11.2239 1.22386 11 1.5 11H13.5C13.7761 11 14 11.2239 14 11.5C14 11.7761 13.7761 12 13.5 12H1.5C1.22386 12 1 11.7761 1 11.5Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
          ></path>
        </svg>
      </button>

      {/* Mobile Menu */}
      {isHeaderOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-background-secondary">
          <div className="p-4 flex justify-end">
            <button
              onClick={() => setIsHeaderOpen(false)}
              className="p-2"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
          </div>
          <nav className="px-4">
            <ul className="flex flex-col gap-4">
              {adminLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    onClick={() => setIsHeaderOpen(false)}
                    className="text-sm px-4 py-2 block transition-all text-[#A1A1A1] hover:text-[#EDEDED] font-medium"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};