import Image from "next/image";

const MainBanner = () => {
  return (
    <div className="relative w-full" style={{ aspectRatio: "20/10"}}>
    {/* <div className="relative w-full h-[200px] sm:h-[500px]"> */}
      <Image
        src="/clouds.jpg"
        alt="Clouds background"
        fill
        className="object-cover w-full h-auto"
        priority
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <h1 className="text-2xl font-bold text-white text-center px-4 sm:text-5xl">
          LEAVE THE CLOUD BEHIND
          <br />
          <span className="text-lg sm:text-3xl font-semibold uppercase">
            {/* Your Data, Direct and Secure */}
            Pay Once - Store Forever
          </span>
        </h1>
      </div>
    </div>
  );
};

export default MainBanner;

