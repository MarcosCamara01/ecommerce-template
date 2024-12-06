import Image from "next/image";
import Link from "next/link";

const ProductBanner = () => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-16 px-4 md:px-8">
      <div className="flex flex-col gap-6 md:w-1/2">
        <h2 className="text-4xl font-bold">Premium Quality Essentials</h2>
        <p className="text-lg text-999 leading-relaxed">
          Discover our collection of timeless pieces crafted from the finest materials. 
          Each item is designed with attention to detail and built to last, 
          ensuring both style and durability for your everyday wear.
        </p>
        <Link 
          href="/products"
          className="inline-flex items-center justify-center px-8 py-3 text-sm font-medium text-white transition-colors bg-[#0072F5] rounded-md hover:bg-[#0051BC] w-fit"
        >
          Shop Now
        </Link>
      </div>

      <div className="relative w-full md:w-1/2 h-[400px]">
        <Image
          src="/product-banner.jpg"
          alt="Featured product collection"
          fill
          className="object-cover rounded-lg"
          priority
        />
      </div>
    </div>
  );
};

export default ProductBanner;
