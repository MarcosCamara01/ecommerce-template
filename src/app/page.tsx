import { Suspense } from "react";

import { getAllProducts } from "./actions";
import { HomeShowcase, type HeroPiece } from "@/components/home/HomeShowcase";
import { SectionBands } from "@/components/home/SectionBands";
import { Skeleton } from "@/components/ui/skeleton";
import { shopSections } from "@/constants/navigation";
import { fitDisplaySize } from "@/lib/display-type";
import { heroWord } from "@/lib/hero-word";

const HERO_PIECES = 4;

const Home = async () => {
  return (
    <>
      <h1 className="sr-only">Store — new in this season</h1>
      <Suspense fallback={<HomeSkeleton />}>
        <Showcase />
      </Suspense>
    </>
  );
};

const Showcase = async () => {
  const products = (await getAllProducts())
    .filter((product) => product.variants.length > 0)
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));

  if (products.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-start justify-center gap-3">
        <h2 className="font-display text-6xl leading-[0.9]">No products available</h2>
        <p className="text-muted">Check back later to see our products</p>
      </div>
    );
  }

  const pieces: HeroPiece[] = products.slice(0, HERO_PIECES).map((product) => {
    const word = heroWord(product.name);
    return {
      product,
      variant: product.variants[0],
      word,
      wordSize: {
        mobile: fitDisplaySize(word, { maxPx: 150, budgetPx: 358, vwBudget: 92 }),
        desktop: fitDisplaySize(word, { maxPx: 300, budgetPx: 1350, vwBudget: 93 }),
      },
      categoryLabel:
        shopSections.find((section) => section.key === product.category)?.label ??
        product.category,
      pairs: products
        .filter((other) => other.category !== product.category)
        .slice(0, 4),
    };
  });

  return <HomeShowcase pieces={pieces} bands={<SectionBands />} />;
};

// Holds the hero's place: the same height and photo size on desktop.
const HomeSkeleton = () => (
  <div
    aria-busy="true"
    aria-label="Loading"
    className="hero flex flex-col items-center gap-6 pt-6 lg:h-[var(--hero-h)]"
  >
    <Skeleton className="h-[min(240px,20vw)] w-[70%] rounded-photo lg:h-[calc(var(--hero-u)*120)]" />
    <Skeleton className="aspect-[2/3] w-64 rounded-photo-lg lg:w-[min(30vw,calc(var(--hero-u)*432))]" />
  </div>
);

export default Home;
