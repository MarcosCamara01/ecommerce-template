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
        <li><Link href="/pantalones">PANTS</Link></li>
        <li><Link href="/sudaderas">SWEATSHIRTS</Link></li>
      </ul>
      <ul>
        {
          status === "authenticated" ?
            <li><Link href="/user/account/profile">{session.user.name?.split(' ')[0]}</Link></li>
            :
            <li><Link href="/login">Login</Link></li>
        }
        <li><Link href="/user/wishlists">Wishlists ({userCart?.favorites ? userCart.favorites.length : 0})</Link></li>

        <li><Link href="/user/cart">Cart ({totalQuantity})</Link></li>
      </ul>
    </header>
  )
}