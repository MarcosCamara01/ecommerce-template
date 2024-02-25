"use client"

import Link from 'next/link';
import { useSession } from "next-auth/react";
import { useCart } from '@/hooks/CartContext';
import { useEffect, useState } from 'react';
import { HiMiniBars2 } from "react-icons/hi2";
import { HiMiniXMark } from "react-icons/hi2";
import { ItemDocument } from '@/types/types';

export const Navbar = ({ isMobile }: { isMobile: boolean }) => {
  const { data: session, status } = useSession();
  const { cartItems, cartLoading } = useCart();
  const [isHeaderOpen, setIsHeaderOpen] = useState(false);

  useEffect(() => {
    if (isHeaderOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isHeaderOpen]);

  const totalQuantity = cartItems.reduce((total: number, cartItem: ItemDocument) => {
    return total + cartItem.quantity;
  }, 0);

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
        status === "loading" ?
          <div className='h-5 rounded-sm w-14 shine'></div>
          :
          status === "authenticated" ? (
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
    <>
      {
        cartLoading ?
          <div className='h-5 rounded-sm w-14 shine'></div>
          :
          <li className='flex items-center justify-center'><Link href="/cart">Cart ({totalQuantity})</Link></li>
      }
    </>
  );

  return (
    <header className={headerStyles}>
      {isMobile ? (
        <>
          <button onClick={toggleHeader}>
            <HiMiniBars2 className="text-2xl" />
          </button>
          <ul className='flex justify-between text-sm gap-9'>
            {cartLink}
          </ul>

          <div className={`fixed top-0 left-0 h-screen w-full bg-black py-10 px-3.5 xs:px-6 transition ease duration-200 z-20	 ${isHeaderOpen ? 'translate-x-0' : 'translate-x-hide'}`}>
            <ul className='flex justify-between text-sm gap-9'>
              <button onClick={toggleHeader}>
                <HiMiniXMark className="text-2xl" />
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
          <ul className='flex justify-between text-sm gap-9'>
            {linksData.map((link, index) => (
              <li key={index} className='flex items-center justify-center'>
                <Link href={link.path} onClick={toggleHeader}>{link.name}</Link>
              </li>
            ))}
          </ul>
          <ul className='flex justify-between text-sm gap-9'>
            {authLinks}
            {cartLink}
          </ul>
        </>
      )}
    </header>
  )
}
