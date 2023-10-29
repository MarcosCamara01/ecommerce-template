"use client"

import React from 'react';
import Link from 'next/link';
import { FaLinkedin } from 'react-icons/fa';
import { FaGithubSquare } from 'react-icons/fa';
import { SiVercel } from 'react-icons/si';

import '../styles/footer.css';

export const Footer = () => {
  return (
    <footer>
      <nav>
        <div className='footer-side-group'>
          <div className='stack'>
            <Link href="https://portfoliomarcos.com/" target='_blank'>
              <SiVercel />
            </Link>
            <span>© 2023</span>
          </div>
          <div className='stack'>
            <Link href="https://www.linkedin.com/in/marcospenelascamara/" target='_blank'><FaLinkedin /> </Link>
            <Link href="https://github.com/MarcosCamara01" target='_blank'><FaGithubSquare /> </Link>
          </div>
        </div>
        <div className='footer-group'>
          <h2>Products</h2>
          <ul>
            <li><Link href={`${process.env.NEXT_PUBLIC_APP_URL}/t-shirts`}>T-shirts</Link></li>
            <li><Link href={`${process.env.NEXT_PUBLIC_APP_URL}/pants`}>Pants</Link></li>
            <li><Link href={`${process.env.NEXT_PUBLIC_APP_URL}/sweatshirts`}>Sweatshirts</Link></li>
          </ul>
        </div>
        <div className='footer-group'>
          <h2>Assistance</h2>
          <ul>
            <li><Link href="#">Size guide</Link></li>
            <li><Link href="#">Delivery</Link></li>
            <li><Link href="#">Returns and refunds</Link></li>
          </ul>
        </div>
        <div className='footer-group'>
          <h2>About Marcos</h2>
          <ul>
            <li><Link href="https://portfoliomarcos.com/" target='_blank'>Portfolio</Link></li>
            <li><Link href="https://www.linkedin.com/in/marcospenelascamara/" target='_blank'>LinkedIn</Link></li>
            <li><Link href="https://github.com/MarcosCamara01" target='_blank'>GitHub</Link></li>
          </ul>
        </div>
      </nav>
    </footer>
  )
}
