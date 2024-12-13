import Image from "next/image";
import { ShopButton } from "../common/ShopButton";

const ProductBanner2 = () => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-16 px-4 md:px-8">
      <div className="relative w-full md:w-1/2 h-[600px]">
        <Image
          src="/all-three.webp"
          alt="Featured product collection"
          fill
          className="object-cover rounded-lg"
          priority
        />
      </div>

      <div className="flex flex-col gap-6 md:w-1/2">
        <h2 className="text-4xl font-bold">Plug and Play</h2>
        <p className="text-lg text-999 leading-relaxed">
          Connect to Android, Apple, and USB.
        </p>
        <ShopButton href={''} text="SHOP NOW"/>
      </div>
    </div>
  );
};

export default ProductBanner2;
