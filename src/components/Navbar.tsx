"use client"

import Link from 'next/link';
import { useState } from 'react';
import { Session } from 'next-auth';
import { NavbarDesktop } from './NavbarDesktop';

export const Navbar = (
  { session, isMobile, totalItems }:
    { session: Session | null, isMobile: boolean, totalItems: number }
) => {
  const [isHeaderOpen, setIsHeaderOpen] = useState(false);

  const toggleHeader = () => {
    if (isMobile) {
      setIsHeaderOpen(!isHeaderOpen);
    }
  };

  const linksData = [
    { path: '/t-shirts', name: 'T-SHIRTS' },
    { path: '/pants', name: 'PANTS' },
    { path: '/sweatshirts', name: 'SWEATSHIRTS' },
  ];

  const headerStyles = "w-full px-3.5 xs:px-6 sm:px-12 py-10 flex items-center justify-between bg-background-secondary border-b border-solid border-border-primary";

  const authLinks = (
    <>
      {
        session?.user ? (
          <li className='flex items-center justify-center'>
            <Link
              href="/account/profile"
              onClick={toggleHeader}
            >{session.user.name?.split(' ')[0]}
            </Link>
          </li>
        ) : (
          <li className='flex items-center justify-center'>
            <Link
              href="/login"
              onClick={toggleHeader}
            >Login
            </Link>
          </li>
        )
      }
    </>
  );

  const cartLink = (
    <li className='flex items-center justify-center'>
      <Link href="/cart">
        Cart ({totalItems})
      </Link>
    </li>
  );

  return (
    <header className={headerStyles}>
      {isMobile ? (
        <>
          <button onClick={() => {
            toggleHeader();
            document.body.style.overflow = 'hidden';
          }}>
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
          <ul className='flex justify-between text-sm gap-9'>
            {cartLink}
          </ul>

          <div className={`fixed top-0 left-0 h-screen w-full bg-black py-10 px-3.5 xs:px-6 transition ease duration-200 z-20	 ${isHeaderOpen ? 'translate-x-0' : 'translate-x-hide'}`}>
            <ul className='flex justify-between text-sm gap-9'>
              <button onClick={() => {
                toggleHeader();
                document.body.style.overflow = 'auto';
              }}>
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

              {authLinks}
            </ul>

            <div className='flex items-center justify-center my-10 h-5/6'>
              <ul className='flex flex-col justify-between text-sm gap-9'>
                {linksData.map((link, index) => (
                  <li key={index} className='flex items-center justify-center'>
                    <Link href={link.path} onClick={toggleHeader}>{link.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ) : (
        <>
          <NavbarDesktop />
          <ul className='flex justify-between text-sm gap-9'>
            {authLinks}
            {cartLink}
          </ul>
        </>
      )}
    </header>
  )
}
