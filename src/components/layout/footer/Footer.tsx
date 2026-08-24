import Link from "next/link";
import { FiFacebook, FiInstagram, FiMail, FiMapPin, FiPhone } from "react-icons/fi";

export const Footer = () => {
  const linkStyles = "text-sm text-slate-300 transition hover:text-white";

  return (
    <footer className="pointer-events-auto border-t border-white/10 bg-[#062f43] text-white">
      <div className="mx-auto max-w-[1440px] px-6 py-14 lg:px-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-3xl font-black tracking-tight">INCOFER</span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.34em] text-slate-300">Ferretería</span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-6 text-slate-300">
              Herramientas, materiales y soluciones para construcción, taller y hogar.
            </p>
            <div className="mt-5 flex gap-3">
              <a href="#" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-slate-200 transition hover:bg-white/10"><FiFacebook /></a>
              <a href="#" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-slate-200 transition hover:bg-white/10"><FiInstagram /></a>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-xs font-extrabold uppercase tracking-[0.16em] text-white">Categorías</h2>
            <ul className="space-y-3">
              <li><Link href="/t-shirts" className={linkStyles}>Herramientas eléctricas</Link></li>
              <li><Link href="/pants" className={linkStyles}>Herramientas manuales</Link></li>
              <li><Link href="/sweatshirts" className={linkStyles}>Construcción</Link></li>
              <li><Link href="/pants" className={linkStyles}>Electricidad</Link></li>
              <li><Link href="/t-shirts" className={linkStyles}>Ferretería general</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-xs font-extrabold uppercase tracking-[0.16em] text-white">Ayuda</h2>
            <ul className="space-y-3">
              <li><Link href="#" className={linkStyles}>Envíos y entregas</Link></li>
              <li><Link href="#" className={linkStyles}>Cambios y devoluciones</Link></li>
              <li><Link href="#" className={linkStyles}>Preguntas frecuentes</Link></li>
              <li><Link href="#" className={linkStyles}>Formas de pago</Link></li>
              <li><Link href="#" className={linkStyles}>Contacto</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-xs font-extrabold uppercase tracking-[0.16em] text-white">Mi cuenta</h2>
            <ul className="space-y-3">
              <li><Link href="/login" className={linkStyles}>Iniciar sesión</Link></li>
              <li><Link href="/orders" className={linkStyles}>Mis pedidos</Link></li>
              <li><Link href="/wishlist" className={linkStyles}>Mis favoritos</Link></li>
              <li><Link href="/cart" className={linkStyles}>Mi carrito</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-xs font-extrabold uppercase tracking-[0.16em] text-white">Contacto</h2>
            <ul className="space-y-4 text-sm text-slate-300">
              <li className="flex items-center gap-3"><FiPhone className="shrink-0 text-white" /> +595 981 000 000</li>
              <li className="flex items-center gap-3"><FiMail className="shrink-0 text-white" /> ventas@incofer.com.py</li>
              <li className="flex items-center gap-3"><FiMapPin className="shrink-0 text-white" /> Paraguay</li>
            </ul>
            <div className="mt-6">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-white">Formas de pago</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {['VISA', 'MASTER', 'DINELCO'].map((item) => (
                  <span key={item} className="rounded bg-white px-2.5 py-1.5 text-[10px] font-black text-[#073c55]">{item}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 INCOFER Ferretería. Todos los derechos reservados.</p>
          <div className="flex gap-5">
            <Link href="#" className="hover:text-white">Términos y condiciones</Link>
            <Link href="#" className="hover:text-white">Política de privacidad</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
