import { Products } from "@/components/products/Products";
import Link from "next/link";
import { getItems } from "./action";
import { Session, getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { Suspense } from "react";
import { Loader } from "@/components/common/Loader";

export async function generateMetadata() {
    return {
        title: "Wishlists | Ecommerce Template",
        description: `Wishlists at e-commerce template made by Marcos Cámara`,
    };
}

const Wishlists = async () => {
    const session: Session | null = await getServerSession(authOptions);
    let filteredWishlist;

    if (session) {
        filteredWishlist = await getItems(session.user._id);
    }

    return (
        <Suspense
            fallback={<div className="flex items-center justify-center height-loader">
                <Loader height={35} width={35} />
            </div>}>
            <div className="pt-12">
                {session?.user ?
                    filteredWishlist && filteredWishlist?.length > 0 ?
                        <>
                            <h2 className="mb-5 text-xl font-bold sm:text-2xl">YOUR WISHLISTS</h2>
                            <Products
                                products={filteredWishlist}
                                extraClassname={"colums-mobile"}
                            />
                        </>
                        :
                        <div className="flex flex-col items-center justify-center w-full h-[70vh] gap-2 px-4">
                            <h1 className="mb-6 text-4xl font-bold">YOUR WISHLIST IS EMPTY</h1>
                            <p className="mb-4 text-lg">When you have added something to the wishlist, it will appear here. Want to get started?</p>
                            <Link
                                className="flex font-medium	 items-center bg-[#0C0C0C] justify-center text-sm min-w-[160px] max-w-[160px] h-[40px] px-[10px] rounded-md border border-solid border-[#2E2E2E] transition-all hover:bg-[#1F1F1F] hover:border-[#454545]"
                                href="/"
                            >
                                Start
                            </Link>
                        </div>
                    :
                    <div className="flex flex-col items-center justify-center w-full h-[70vh] gap-2 px-4">
                        <h1 className="mb-6 text-4xl font-bold">YOUR WISHLIST IS EMPTY</h1>
                        <p className="mb-4 text-lg">Not registered? You must be in order to save your favorite products.</p>
                        <Link
                            className="flex font-medium	 items-center bg-[#0C0C0C] justify-center text-sm min-w-[160px] max-w-[160px] h-[40px] px-[10px] rounded-md border border-solid border-[#2E2E2E] transition-all hover:bg-[#1F1F1F] hover:border-[#454545]"
                            href="/login"
                        >
                            Login
                        </Link>
                    </div>
                }
            </div>
        </Suspense>
    );
}

export default Wishlists;
