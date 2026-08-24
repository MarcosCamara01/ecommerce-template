import Link from "next/link";
import { Suspense } from "react";
import { getAllProducts } from "./actions";
import {
  ProductsSkeleton,
  GridProducts,
  ProductItem,
} from "@/components/products";

const categories = [
  { name: "Taladros", icon: "⚙️", href: "/t-shirts" },
  { name: "Sierras", icon: "🪚", href: "/pants" },
  { name: "Amoladoras", icon: "🛠️", href: "/sweatshirts" },
  { name: "Herramientas", icon: "🔧", href: "/t-shirts" },
  { name: "Electricidad", icon: "⚡", href: "/pants" },
  { name: "Construcción", icon: "🧱", href: "/sweatshirts" },
];

const benefits = [
  ["🚚", "Envíos a todo el país", "Entregas rápidas y seguras"],
  ["↩️", "Cambios y devoluciones", "Compra con tranquilidad"],
  ["💬", "Atención personalizada", "Te ayudamos a elegir"],
  ["🏷️", "Ofertas semanales", "Precios especiales online"],
];

const Home = async () => {
  return (
    <div className="bg-white text-slate-900">
      <section className="mx-auto max-w-[1440px] px-4 pb-8 pt-6 sm:px-6 lg:px-10">
        <div className="grid gap-4 lg:grid-cols-[2.05fr_1fr]">
          <div className="relative min-h-[390px] overflow-hidden rounded-sm bg-[#eef1f3] p-8 sm:p-12 lg:min-h-[500px]">
            <div className="relative z-10 max-w-lg pt-10 lg:pt-20">
              <p className="mb-2 text-2xl font-medium text-[#d7193f]">Potencia profesional</p>
              <h1 className="text-5xl font-black tracking-tight text-[#073c55] sm:text-6xl">
                Herramientas para hacer más
              </h1>
              <p className="mt-5 max-w-md text-base text-slate-600 sm:text-lg">
                Equipá tu obra, taller o casa con herramientas seleccionadas para trabajo exigente.
              </p>
              <Link
                href="/t-shirts"
                className="mt-7 inline-flex bg-[#d7193f] px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#b71435]"
              >
                Ver productos
              </Link>
            </div>

            <div className="pointer-events-none absolute -bottom-14 -right-8 hidden h-80 w-80 rotate-[-16deg] rounded-[48px] bg-[#0b506d] shadow-2xl sm:block lg:h-[390px] lg:w-[390px]">
              <div className="absolute left-[-80px] top-[120px] h-16 w-64 rounded-full bg-slate-800" />
              <div className="absolute left-12 top-14 h-36 w-52 rounded-3xl bg-[#187fa5]" />
              <div className="absolute left-28 top-24 h-20 w-24 rounded-xl bg-slate-950" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="relative min-h-[238px] overflow-hidden bg-[#f2f3f4] p-7">
              <p className="text-sm font-bold uppercase text-[#d7193f]">Destacado</p>
              <h2 className="mt-1 text-3xl font-black text-[#073c55]">Taladros inalámbricos</h2>
              <p className="mt-2 text-sm text-slate-600">Potencia, autonomía y precisión.</p>
              <div className="absolute -bottom-10 -right-6 h-36 w-36 rotate-[-25deg] rounded-3xl bg-[#12698b] shadow-lg" />
            </div>
            <div className="relative min-h-[238px] overflow-hidden bg-[#f2f3f4] p-7">
              <p className="text-sm font-bold uppercase text-[#d7193f]">Oferta de la semana</p>
              <h2 className="mt-1 text-3xl font-black text-[#073c55]">Sierras y corte</h2>
              <p className="mt-2 text-sm text-slate-600">Soluciones para obra y taller.</p>
              <div className="absolute -bottom-10 -right-8 h-40 w-48 rotate-[-12deg] rounded-[35px] bg-slate-800 shadow-lg" />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {benefits.map(([icon, title, text]) => (
            <div key={title} className="flex items-center gap-4 border border-slate-200 bg-white px-5 py-5">
              <span className="text-3xl" aria-hidden>{icon}</span>
              <div>
                <p className="font-bold text-[#073c55]">{title}</p>
                <p className="text-xs text-slate-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
        <div className="mb-6 flex items-end justify-between border-b border-slate-200 pb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d7193f]">Encontrá lo que necesitás</p>
            <h2 className="mt-1 text-3xl font-black text-[#073c55]">Comprar por categorías</h2>
          </div>
          <Link href="/t-shirts" className="hidden text-sm font-bold text-[#073c55] hover:text-[#d7193f] sm:block">
            Ver todas →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group flex min-h-36 flex-col items-center justify-center border border-slate-200 bg-[#f7f7f7] p-4 text-center transition hover:-translate-y-1 hover:border-[#d7193f] hover:bg-white hover:shadow-md"
            >
              <span className="text-4xl transition group-hover:scale-110" aria-hidden>{category.icon}</span>
              <span className="mt-4 text-sm font-bold text-[#073c55]">{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-[#f8f9fa] py-12">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d7193f]">Selección INCOFER</p>
              <h2 className="mt-1 text-3xl font-black text-[#073c55]">Productos destacados</h2>
            </div>
          </div>
          <Suspense fallback={<ProductsSkeleton items={8} />}>
            <AllProducts />
          </Suspense>
        </div>
      </section>
    </div>
  );
};

const AllProducts = async () => {
  const products = await getAllProducts();

  if (products.length === 0) {
    return (
      <div className="flex min-h-[30vh] flex-col items-center justify-center rounded border border-dashed border-slate-300 bg-white">
        <h2 className="text-xl font-bold text-[#073c55]">Próximamente nuevos productos</h2>
        <p className="mt-2 text-slate-500">Estamos preparando el catálogo de INCOFER.</p>
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
