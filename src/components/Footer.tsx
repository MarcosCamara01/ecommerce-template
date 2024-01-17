"use client"

import React from 'react';
import Link from 'next/link';
import { FaLinkedin } from 'react-icons/fa';
import { FaGithubSquare } from 'react-icons/fa';
import { SiVercel } from 'react-icons/si';

export const Footer = () => {
  const linkStyles = "text-sm transition duration-150 ease hover:text-white";
  const liStyles = "text-color-tertiary my-1.5"

  return (
    <footer className='py-24 px-6	bg-background-secondary border-t border-border-primary border-solid'>
      <nav className='max-w-screen-2xl mx-auto	gap-5	flex flex-wrap justify-around'>
        <div className='w-full max-w-xs	flex flex-col items-center justify-center gap-5'>
          <div className='flex gap-3.5'>
            <Link
              href="https://portfoliomarcos.com/"
              target='_blank'
              title="Portfolio of Marcos">
              <SiVercel className="text-2xl" />
            </Link>
            <span className='text-sm text-color-tertiary	flex items-center'>© 2023</span>
          </div>
          <div className='flex gap-3.5'>
            <Link
              href="https://www.linkedin.com/in/marcospenelascamara/"
              target='_blank'
              title="LindedIn of Marcos"
            ><FaLinkedin className="text-2xl" /></Link>
            <Link
              href="https://github.com/MarcosCamara01"
              target='_blank'
              title="GitHub of Marcos"
            ><FaGithubSquare className="text-2xl" /></Link>
          </div>
        </div>
        <div className='w-full max-w-xs'>
          <h2 className='text-sm font-medium my-3'>Products</h2>
          <ul className='grid grid-cols-2'>
            <li className={liStyles}><Link href={`${process.env.NEXT_PUBLIC_APP_URL}/t-shirts`} className={linkStyles}>T-shirts</Link></li>
            <li className={liStyles}><Link href={`${process.env.NEXT_PUBLIC_APP_URL}/pants`} className={linkStyles}>Pants</Link></li>
            <li className={liStyles}><Link href={`${process.env.NEXT_PUBLIC_APP_URL}/sweatshirts`} className={linkStyles}>Sweatshirts</Link></li>
          </ul>
        </div>
        <div className='w-full max-w-xs'>
          <h2 className='text-sm font-medium my-3'>Assistance</h2>
          <ul className='grid grid-cols-2'>
            <li className={liStyles}><Link href="#" className={linkStyles}>Size guide</Link></li>
            <li className={liStyles}><Link href="#" className={linkStyles}>Delivery</Link></li>
            <li className={liStyles}><Link href="#" className={linkStyles}>Returns and refunds</Link></li>
          </ul>
        </div>
        <div className='w-full max-w-xs'>
          <h2 className='text-sm font-medium my-3'>About Marcos</h2>
          <ul className='grid grid-cols-2'>
            <li className={liStyles}><Link href="https://portfoliomarcos.com/" target='_blank' className={linkStyles}>Portfolio</Link></li>
            <li className={liStyles}><Link href="https://www.linkedin.com/in/marcospenelascamara/" target='_blank' className={linkStyles}>LinkedIn</Link></li>
            <li className={liStyles}><Link href="https://github.com/MarcosCamara01" target='_blank' className={linkStyles}>GitHub</Link></li>
          </ul>
        </div>
      </nav>
    </footer>
  )
}
