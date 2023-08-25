import Link from 'next/link';
import React from 'react';
import { HiOutlineSearch } from 'react-icons/hi';

export const Navbar = () => {
  return (
    <div>
        <ul>
            <li><Link href="#">Móviles</Link></li>
            <li><Link href="#">Tablets</Link></li>
            <li><Link href="#">Ordenadores</Link></li>
        </ul>
        <ul>
            <div className='search'><HiOutlineSearch /></div>
            <li><Link href="/register">Login</Link></li>
        </ul>
    </div>
  )
}
