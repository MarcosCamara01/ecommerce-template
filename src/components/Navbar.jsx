"use client"

import Link from 'next/link';
import '../styles/header.css';
import { useSession } from "next-auth/react";
import { useCart } from '@/hooks/CartContext';
import { useClientMediaQuery } from '@/hooks/useClientMediaQuery';
import { useEffect, useState } from 'react';
import { HiMiniBars2 } from "react-icons/hi2";
import { HiMiniXMark } from "react-icons/hi2";

export const Navbar = () => {
  const { data: session, status } = useSession();
  const { cartItems, userCart } = useCart();
  const isMobile = useClientMediaQuery('(max-width: 600px)');
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

  const totalQuantity = cartItems.reduce((total, cartItem) => {
    return total + cartItem.quantity;
  }, 0);

  const toggleHeader = () => {
    if (isMobile) {
      setIsHeaderOpen(!isHeaderOpen);
    }
  };

  const linksData = [
    { path: '/t-shirt', name: 'T-SHIRTS' },
    { path: '/pants', name: 'PANTS' },
    { path: '/sweatshirts', name: 'SWEATSHIRTS' },
  ];

  const commonLinks = (
    <ul>
      {linksData.map((link, index) => (
        <li key={index}>
          <Link href={link.path} onClick={toggleHeader}>{link.name}</Link>
        </li>
      ))}
    </ul>
  );

  const authLinks = (
    <ul>
      {status === "authenticated" ? (
        <li><Link href="/account/profile">{session.user.name?.split(' ')[0]}</Link></li>
      ) : (
        <li><Link href="/login">Login</Link></li>
      )}
      <li><Link href="/wishlists">Wishlists ({userCart?.favorites ? userCart.favorites.length : 0})</Link></li>
      <li><Link href="/cart">Cart ({totalQuantity})</Link></li>
    </ul>
  );

  if (isMobile === null) {
    return <header></header>;
  }

  return (
    <header>
      {isMobile ? (
        <>
          <button onClick={toggleHeader}>
            <HiMiniBars2 />
          </button>
          <ul>
            <li><Link href="/cart">Cart ({totalQuantity})</Link></li>
          </ul>

          <div className={`mobile-content ${isHeaderOpen ? 'open' : 'closed'}`}>
            <ul>
              <button onClick={toggleHeader}>
                <HiMiniXMark />
              </button>

              {status === "authenticated" ? (
                <li><Link href="/account/profile" onClick={toggleHeader}>{session.user.name?.split(' ')[0]}</Link></li>
              ) : (
                <li><Link href="/login" onClick={toggleHeader}>Login</Link></li>
              )}
            </ul>

            <div className='content-mid'>
              {commonLinks}
            </div>
          </div>
        </>
      ) : (
        <>
          {commonLinks}
          {authLinks}
        </>
      )}
    </header>
  )
}
