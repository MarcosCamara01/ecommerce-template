import { EnrichedProducts } from '@/types/types';
import { Wishlists } from '@/app/(carts)/wishlist/action';
import { getTotalWishlist } from '@/app/(carts)/wishlist/action';
import { Session, getServerSession } from 'next-auth';
import { authOptions } from '@/libs/auth';
import React from 'react';
import WishlistButton from './WishlistButton';

export const Wishlist = async (
    { product }: { product: EnrichedProducts }
) => {
    const session: Session | null = await getServerSession(authOptions);
    let isFavorite: boolean = false;

    if (session?.user) {
        const wishlist: Wishlists | undefined = await getTotalWishlist(session);

        const favoriteItem = wishlist?.items.find(wishlistProduct => wishlistProduct.productId.toString() === product._id.toString());

        if (favoriteItem) {
            isFavorite = true;
        }
    }

    const productId = JSON.stringify(product._id);

    return <WishlistButton
        session={session}
        isFavorite={isFavorite}
        id={productId}
    />
};