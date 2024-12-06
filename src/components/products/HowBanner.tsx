import Image from "next/image";

const HowBanner = () => {
  return (
    <div className="flex flex-col md:flex-row gap-10 p-10">
      <div className="relative w-full md:w-1/2 h-[600px]">
        <Image
          src="/apple-interface.webp"
          alt="Product showcase image 1"
          fill
          className="object-fill"
          priority
        />
      </div>

      <div className="relative w-full md:w-1/2 h-[600px]">
        <Image
          src="/android-interface.png" 
          alt="Product showcase image 2"
          fill
          className="object-fill"
          priority
        />
      </div>
    </div>
  );
};

export default HowBanner;
