"use client"

import Link from 'next/link';
import React from 'react';
import { HiOutlineSearch } from 'react-icons/hi';
import '../styles/header.css';

export const Navbar = () => {
  return (
    <header>
      <ul>
        <li><Link href="/dashboard/camisetas">Camisetas</Link></li>
        <li><Link href="/dashboard/pantalones">Pantalones</Link></li>
        <li><Link href="/dashboard/sudaderas">Sudaderas</Link></li>
      </ul>
      <ul>
        <div className='search'><HiOutlineSearch /></div>
        <li><Link href="/register">Login</Link></li>
      </ul>
    </header>
  )
}
