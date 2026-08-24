import Link from "next/link";
import { Suspense } from "react";
import {
  FiArrowRight,
  FiHeadphones,
  FiHome,
  FiPackage,
  FiRefreshCcw,
  FiShield,
  FiShoppingCart,
  FiTag,
  FiTool,
  FiTruck,
  FiZap,
} from "react-icons/fi";
import { getAllProducts } from "./actions";
import {
  ProductsSkeleton,
  GridProducts,
  ProductItem,
} from "@/components/products";

const categories = [
  { name: "Herramientas eléctricas", icon: FiZap, href: "/t-shirts" },
  { name: "Herramientas manuales", icon: FiTool, href: "/pants" },
  { name: "Construcción", icon: FiHome, href: "/sweatshirts" },
  { name: "Electricidad", icon: FiZap, href: "/pants" },
  { name: "Seguridad", icon: FiShield, href: "/t-shirts" },
  { name: "Ferretería general", icon: FiPackage, href: "/sweatshirts" },
];

const benefits = [
  { icon: FiTruck, title: "Envíos a todo el país", text: "Cobertura nacional y entregas seguras" },
  { icon: FiRefreshCcw, title: "Cambios y devoluciones", text: "Comprá con mayor tranquilidad" },
  { icon: FiHeadphones, title: "Atención personalizada", text: "Te ayudamos a elegir la mejor opción" },
  { icon: FiTag, title: "Ofertas semanales", text: "Promociones seleccionadas online" },
];

const demoProducts = [
  { name: "Taladro percutor 18V", brand: "Línea profesional", price: "Gs. 1.450.000", icon: FiTool },
  { name: "Amoladora angular 850W", brand: "Uso intensivo", price: "Gs. 599.000", icon: FiZap },
  { name: "Sierra circular 1600W", brand: "Corte profesional", price: "Gs. 1.250.000", icon: FiTool },
  { name: "Kit de herramientas", brand: "Taller y hogar", price: "Gs. 420.000", icon: FiPackage },
  { name: "Cable flexible 100 m", brand: "Electricidad", price: "Gs. 350.000", icon: FiZap },
  { name: "Materiales de obra", brand: "Construcción", price: "Consultar", icon: FiHome },
];

const Home = async () => {
  return (
    <div className="bg-white text-slate-900">
      <section className="mx-auto max-w-[1440px] px-4 pb-5 pt-5 sm:px-6 lg:px-10">
        <div className="grid gap-4 lg:grid-cols-[2.05fr_1fr]">
          <div className="relative min-h-[440px] overflow-hidden rounded-md bg-[#062f43] p-8 text-white shadow-sm sm:p-12 lg:min-h-[520px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_35%,rgba(35,148,190,0.28),transparent_34%),linear-gradient(120deg,rgba(3,25,36,0.98),rgba(7,60,85,0.88))]" />
            <div className="absolute -right-20 bottom-[-50px] h-[410px] w-[410px] rounded-full border-[44px] border-white/5" />
            <div className="absolute right-10 top-16 hidden h-64 w-64 rotate-[-12deg] items-center justify-center rounded-[44px] border border-white/10 bg-white/5 text-[150px] text-[#ef244b] shadow-2xl backdrop-blur-sm md:flex lg:right-16 lg:h-72 lg:w-72">
              <FiTool />
            </div>

            <div className="relative z-10 flex min-h-[360px] max-w-xl flex-col justify-center lg:min-h-[430px]">
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/90">
                <span className="h-2 w-2 rounded-full bg-[#ef244b]" /> Potencia profesional
              </div>
              <h1 className="max-w-[620px] text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
                Herramientas para hacer más
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-slate-200 sm:text-lg">
                Equipá tu obra, taller o casa con soluciones confiables para construcción, electricidad y ferretería profesional.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/t-shirts" className="inline-flex items-center gap-2 rounded bg-[#e91d46] px-7 py-4 text-sm font-extrabold uppercase tracking-wide text-white transition hover:bg-[#c91539]">
                  Ver productos <FiArrowRight />
                </Link>
                <Link href="#categorias" className="inline-flex items-center gap-2 rounded border border-white/25 bg-white/5 px-7 py-4 text-sm font-bold text-white transition hover:bg-white/10">
                  Explorar categorías
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Link href="/t-shirts" className="group relative min-h-[250px] overflow-hidden rounded-md bg-[#eef3f6] p-7 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="relative z-10 max-w-[70%]">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#e91d46]">Destacado</p>
                <h2 className="mt-2 text-3xl font-black leading-tight text-[#073c55]">Taladros y potencia</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">Equipos para perforación, montaje y trabajo exigente.</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#073c55]">Ver categoría <FiArrowRight /></span>
              </div>
              <FiTool className="absolute -bottom-6 -right-4 text-[150px] text-[#137da4]/20 transition duration-300 group-hover:scale-105 group-hover:text-[#137da4]/30" />
            </Link>

            <Link href="/pants" className="group relative min-h-[250px] overflow-hidden rounded-md bg-[#071d31] p-7 text-white transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="relative z-10 max-w-[72%]">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#ef244b]">Oferta de la semana</p>
                <h2 className="mt-2 text-3xl font-black leading-tight">Electricidad y obra</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">Productos seleccionados para profesionales y hogar.</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold">Ver ofertas <FiArrowRight /></span>
              </div>
              <FiZap className="absolute -bottom-3 right-2 text-[145px] text-[#ef244b]/20 transition duration-300 group-hover:scale-105 group-hover:text-[#ef244b]/30" />
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {benefits.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-4 rounded-md border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#073c55]/7 text-xl text-[#073c55]"><Icon /></span>
              <div>
                <p className="font-extrabold text-[#073c55]">{title}</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="categorias" className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
        <div className="mb-6 flex items-end justify-between border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#e91d46]">Encontrá lo que necesitás</p>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-[#073c55] sm:text-4xl">Comprar por categorías</h2>
          </div>
          <Link href="/t-shirts" className="hidden items-center gap-2 text-sm font-extrabold text-[#073c55] hover:text-[#e91d46] sm:inline-flex">Ver todas <FiArrowRight /></Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map(({ name, icon: Icon, href }) => (
            <Link key={name} href={href} className="group flex min-h-40 flex-col items-center justify-center rounded-md border border-slate-200 bg-[#fafbfc] p-5 text-center transition duration-200 hover:-translate-y-1 hover:border-[#e91d46]/50 hover:bg-white hover:shadow-lg">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl text-[#073c55] shadow-sm ring-1 ring-slate-200 transition group-hover:bg-[#073c55] group-hover:text-white"><Icon /></span>
              <span className="mt-5 text-sm font-extrabold leading-5 text-[#073c55]">{name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-[#f6f8fa] py-12">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#e91d46]">Selección INCOFER</p>
              <h2 className="mt-1 text-3xl font-black tracking-tight text-[#073c55] sm:text-4xl">Productos destacados</h2>
            </div>
            <Link href="/t-shirts" className="hidden items-center gap-2 text-sm font-extrabold text-[#073c55] hover:text-[#e91d46] sm:inline-flex">Ver todos <FiArrowRight /></Link>
          </div>
          <Suspense fallback={<ProductsSkeleton items={8} />}>
            <AllProducts />
          </Suspense>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto grid max-w-[1440px] gap-4 px-4 sm:px-6 md:grid-cols-2 lg:px-10">
          <div className="rounded-md bg-[#073c55] p-8 text-white sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff5575]">Para profesionales</p>
            <h3 className="mt-2 text-3xl font-black">Todo para tu obra y taller</h3>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200">Consultá por herramientas, materiales y soluciones para proyectos de cualquier escala.</p>
            <Link href="/t-shirts" className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold">Explorar catálogo <FiArrowRight /></Link>
          </div>
          <div className="rounded-md border border-slate-200 bg-[#f7f8f9] p-8 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e91d46]">Asesoramiento INCOFER</p>
            <h3 className="mt-2 text-3xl font-black text-[#073c55]">¿No sabés qué producto elegir?</h3>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Nuestro equipo puede ayudarte a encontrar la herramienta o material adecuado según tu necesidad.</p>
            <Link href="#" className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold text-[#073c55]">Contactar a un asesor <FiArrowRight /></Link>
          </div>
        </div>
      </section>
    </div>
  );
};

const AllProducts = async () => {
  const products = await getAllProducts();

  if (products.length === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {demoProducts.map(({ name, brand, price, icon: Icon }) => (
          <article key={name} className="group overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-[78px] text-[#073c55]">
              <Icon className="transition duration-200 group-hover:scale-105" />
            </div>
            <div className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{brand}</p>
              <h3 className="mt-1 min-h-10 text-sm font-extrabold leading-5 text-[#073c55]">{name}</h3>
              <p className="mt-4 text-lg font-black text-[#e91d46]">{price}</p>
              <button type="button" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded bg-[#073c55] px-3 py-3 text-xs font-extrabold uppercase tracking-wide text-white transition hover:bg-[#0a4d6c]">
                <FiShoppingCart /> Agregar al carrito
              </button>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <GridProducts>
      {products.slice(0, 8).map((product) => (
        <ProductItem key={product.id} product={product} />
      ))}
    </GridProducts>
  );
};

export default Home;
