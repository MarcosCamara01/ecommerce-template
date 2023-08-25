import Link from 'next/link';
import React from 'react';
import { HiOutlineSearch } from 'react-icons/hi';
import '../styles/header.css';

export const Navbar = () => {
  return (
    <header>
      <ul>
        <li><Link href="#">Camisetas</Link></li>
        <li><Link href="#">Pantalones</Link></li>
        <li><Link href="#">Sudaderas</Link></li>
      </ul>
      <ul>
        <div className='search'><HiOutlineSearch /></div>
        <li><Link href="/register">Login</Link></li>
      </ul>
    </header>
  )
}
