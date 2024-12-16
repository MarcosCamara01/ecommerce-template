import Image from "next/image";
import { ShopButton } from "../common/ShopButton";

const ProductBanner = () => {
    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-16 px-4 md:px-8">
            <div className="flex flex-col gap-6 md:w-1/2">
                <h2 className="text-4xl font-bold">RUNNING OUT OF SPACE</h2>
                <p className="text-lg text-999 leading-relaxed">
                    Store over 20,000 photos.
                </p>
                <ShopButton
                    href={"/Storage/6753222a5ab4f54aac80c903"}
                    text="SHOP NOW"
                />
            </div>

            <div className="relative w-full md:w-1/2 h-[600px]">
                <Image
                    src="/running-out-of-space.jpg"
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
