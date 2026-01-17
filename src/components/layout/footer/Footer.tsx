"use client";

import Link from "next/link";
import {
  FaTriangleExclamation,
  FaLinkedin,
  FaGithub,
  FaMedium,
} from "react-icons/fa6";

export const Footer = () => {
  const linkStyles = "text-sm transition duration-150 ease hover:text-white";
  const liStyles = "text-color-secondary my-1.5";

  return (
    <footer className="px-6 py-24 border-t border-solid pointer-events-auto bg-background-secondary border-[#242424]">
      <nav className="flex flex-wrap justify-around gap-5 mx-auto max-w-screen-2xl">
        <div className="w-full max-w-xs">
          <h2 className="my-3 text-sm font-medium">Products</h2>
          <ul className="grid grid-cols-2">
            <li className={liStyles}>
              <Link
                href={`${process.env.NEXT_PUBLIC_APP_URL}/t-shirts`}
                className={linkStyles}
              >
                T-shirts
              </Link>
            </li>
            <li className={liStyles}>
              <Link
                href={`${process.env.NEXT_PUBLIC_APP_URL}/pants`}
                className={linkStyles}
              >
                Pants
              </Link>
            </li>
            <li className={liStyles}>
              <Link
                href={`${process.env.NEXT_PUBLIC_APP_URL}/sweatshirts`}
                className={linkStyles}
              >
                Sweatshirts
              </Link>
            </li>
          </ul>
        </div>
        <div className="w-full max-w-xs">
          <h2 className="my-3 text-sm font-medium">Assistance</h2>
          <ul className="grid grid-cols-2">
            <li className={liStyles}>
              <Link href="#" className={linkStyles}>
                Size guide
              </Link>
            </li>
            <li className={liStyles}>
              <Link href="#" className={linkStyles}>
                Delivery
              </Link>
            </li>
            <li className={liStyles}>
              <Link href="#" className={linkStyles}>
                Returns and refunds
              </Link>
            </li>
          </ul>
        </div>
        <div className="w-full max-w-xs">
          <h2 className="my-3 text-sm font-medium">About Marcos</h2>
          <ul className="grid grid-cols-2">
            <li className={liStyles}>
              <Link
                href="https://marcoscamara.com"
                target="_blank"
                className={linkStyles}
              >
                Portfolio
              </Link>
            </li>
            <li className={liStyles}>
              <Link
                href="https://www.linkedin.com/in/marcospenelascamara/"
                target="_blank"
                className={linkStyles}
              >
                LinkedIn
              </Link>
            </li>
            <li className={liStyles}>
              <Link
                href="https://github.com/MarcosCamara01"
                target="_blank"
                className={linkStyles}
              >
                GitHub
              </Link>
            </li>
            <li className={liStyles}>
              <Link
                href="https://medium.com/@marcoscamara"
                target="_blank"
                className={linkStyles}
              >
                Medium
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </footer>
  );
};
