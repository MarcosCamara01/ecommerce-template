"use client"

import Link from 'next/link';
import React from 'react';
import { HiOutlineSearch } from 'react-icons/hi';
import '../styles/header.css';
import { useSession } from "next-auth/react";
import { useCart } from '@/hooks/CartContext';

export const Navbar = () => {
  const { data: session, status } = useSession();
  const { cartItems } = useCart();

  const totalQuantity = cartItems.reduce((total, cartItem) => {
    return total + cartItem.quantity;
  }, 0);

  return (
    <header>
      <ul>
        <li><Link href="/camisetas">Camisetas</Link></li>
        <li><Link href="/pantalones">Pantalones</Link></li>
        <li><Link href="/sudaderas">Sudaderas</Link></li>
      </ul>
      <ul>
        <li><div className='search'><HiOutlineSearch /></div></li>
        {
          status === "authenticated" ?
            <li><Link href="/user/account/profile">{session.user.fullname.split(' ')[0]}</Link></li>
            :
            <li><Link href="/login">Login</Link></li>
        }
        <li><Link href="/user/cart">Cesta ({totalQuantity})</Link></li>
      </ul>
    </header>
  )
}
