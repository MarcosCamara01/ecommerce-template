"use client"

import Link from 'next/link';
import React from 'react';
import { HiOutlineSearch } from 'react-icons/hi';
import '../styles/header.css';
import { useSession } from "next-auth/react";

export const Navbar = () => {
  const { data: session } = useSession();

  return (
    <header>
      <ul>
        <li><Link href="/camisetas">Camisetas</Link></li>
        <li><Link href="/pantalones">Pantalones</Link></li>
        <li><Link href="/sudaderas">Sudaderas</Link></li>
      </ul>
      <ul>
        <div className='search'><HiOutlineSearch /></div>
        {
          session ?
          <li><Link href="/user/profile">{session.user.fullname}</Link></li>
          :
          <li><Link href="/login">Login</Link></li>
        }
      </ul>
    </header>
  )
}
