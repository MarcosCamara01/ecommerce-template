"use client"

import Link from 'next/link';
import { useState } from 'react';
import { Session } from 'next-auth';
import { NavbarDesktop } from './NavbarDesktop';
import { DropdownMenuDemo } from './DropdownMenu';
import SearchInput from './SearchInput';

interface Navbar {
  session: Session | null,
  isMobile: boolean,
  totalItemsCart: number,
  totalWishlists: number | undefined
}

export const Navbar = (
  { session, isMobile, totalItemsCart, totalWishlists }: Navbar
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

  const authLinks = () => {
    if (session?.user) {
      return (
        <li className='flex items-center justify-center'>
          <DropdownMenuDemo fastSession={session} />
        </li>
      );
    } else {
      return (
        <li className='flex items-center justify-center'>
          <Link
            href="/login"
            onClick={toggleHeader}
            className="text-sm px-4 py-2 transition-all text-[#A1A1A1] hover:text-[#EDEDED] font-medium"
          >
            Login
          </Link>
        </li>
      );
    }
  };

  const cartLinks = (
    <ul className='flex gap-2'>
      <li className='flex items-center justify-center'>
        <Link href="/cart" aria-label="Products saved in the shopping cart" className='text-sm py-3 px-3 rounded-md transition-all text-[#EDEDED] hover:bg-[#1F1F1F] relative'>
          <svg data-testid="geist-icon" height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16" style={{ color: 'currentColor' }}>
            <path fillRule="evenodd" clipRule="evenodd" d="M0 2.5L0.958427 2.5C1.41012 2.5 1.82194 2.74308 2.04258 3.12774L2.5 4.5L3.93019 8.79057C4.27047 9.81142 5.22582 10.5 6.3019 10.5H12.4505C13.6422 10.5 14.6682 9.65885 14.9019 8.49029L15.7 4.5L16 3H14.4703L4.5 3L3.62309 3L3.50287 2.70678C3.07956 1.67431 2.0743 1 0.958427 1H0V2.5ZM4.08114 4.5L5.35321 8.31623C5.48933 8.72457 5.87147 9 6.3019 9H12.4505C12.9272 9 13.3376 8.66354 13.4311 8.19612L14.1703 4.5H4.5H4.08114ZM12.5 15C11.6716 15 11 14.3284 11 13.5C11 12.6716 11.6716 12 12.5 12C13.3284 12 14 12.6716 14 13.5C14 14.3284 13.3284 15 12.5 15ZM4.5 13.5C4.5 14.3284 5.17157 15 6 15C6.82843 15 7.5 14.3284 7.5 13.5C7.5 12.6716 6.82843 12 6 12C5.17157 12 4.5 12.6716 4.5 13.5Z" fill="currentColor"></path>
          </svg>
          <span
            className='flex items-center bg-[#0072F5] font-medium text-[#EDEDED] justify-center absolute w-[20px] rounded-full top-[-3px] right-[-3px]'
          >
            {totalItemsCart}
          </span>
        </Link>
      </li>
      <li className='flex items-center justify-center'>
        <Link href="/wishlist" aria-label="Products saved in whishlist" className='text-sm py-3 px-3 rounded-md transition-all text-[#EDEDED] hover:bg-[#1F1F1F] relative'>
          <svg
            data-testid="geist-icon"
            height="16"
            strokeLinejoin="round"
            viewBox="0 0 16 16"
            width="16"
            style={{ color: 'currentColor' }}
          >
            <path
              d="M1.39408 2.14408C3.21165 0.326509 6.13348 0.286219 8 2.02321C9.86652 0.286221 12.7884 0.326509 14.6059 2.14408C16.4647 4.00286 16.4647 7.01653 14.6059 8.87531L8 15.4812L1.39408 8.87531C-0.464691 7.01653 -0.464694 4.00286 1.39408 2.14408Z"
              fill="currentColor"
            ></path>
          </svg>
          <span
            className='flex items-center bg-[#0072F5] font-medium text-[#EDEDED] justify-center absolute w-[20px] rounded-full top-[-3px] right-[-3px]'
          >
            {totalWishlists || 0}
          </span>
        </Link>
      </li>
    </ul>
  );

  return (
    <header className="pointer-events-auto w-full px-3.5 gap-4 xs:px-6 sm:px-12 py-6 flex items-center justify-between bg-background-secondary border-b border-solid border-border-primary">
      {isMobile ? (
        <>
          <button
            onClick={() => {
              toggleHeader();
              document.body.style.overflow = 'hidden';
            }}
            className='px-4 py-2'
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
          <SearchInput />
          <div className='flex justify-between text-sm gap-9'>
            {cartLinks}
          </div>

          <div className={`fixed top-0 left-0 h-screen w-full bg-background-secondary py-10 px-3.5 xs:px-6 transition ease duration-200 z-20	 ${isHeaderOpen ? 'translate-x-0' : 'translate-x-hide'}`}>
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

              {authLinks()}
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
          <ul className='flex justify-between gap-2 text-sm'>
            {authLinks()}
            <li><NavbarDesktop /></li>
          </ul>
          <SearchInput />
          <div>{cartLinks}</div>
        </>
      )}
    </header>
  )
}
