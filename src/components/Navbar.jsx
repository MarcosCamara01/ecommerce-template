"use client"

import Link from 'next/link';
import React from 'react';
import '../styles/header.css';
import { useSession } from "next-auth/react";
import { useCart } from '@/hooks/CartContext';

export const Navbar = () => {
  const { data: session, status } = useSession();
  const { cartItems, userCart } = useCart();

  const totalQuantity = cartItems.reduce((total, cartItem) => {
    return total + cartItem.quantity;
  }, 0);

  return (
    <header>
      <ul>
        <li><Link href="/t-shirt">T-SHIRTS</Link></li>
        <li><Link href="/pants">PANTS</Link></li>
        <li><Link href="/sweatshirts">SWEATSHIRTS</Link></li>
      </ul>
      <ul>
        {
          status === "authenticated" ?
            <li><Link href="/account/profile">{session.user.name?.split(' ')[0]}</Link></li>
            :
            <li><Link href="/login">Login</Link></li>
        }
        <li><Link href="/wishlists">Wishlists ({userCart?.favorites ? userCart.favorites.length : 0})</Link></li>

        <li><Link href="/cart">Cart ({totalQuantity})</Link></li>
      </ul>
    </header>
  )
}