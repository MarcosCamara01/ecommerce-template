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

    const wishlist: Wishlists | undefined = await getTotalWishlist(session);

    const favoriteItem = wishlist?.items.find(wishlistProduct => wishlistProduct.productId.toString() === product._id.toString());

    if (favoriteItem) {
        isFavorite = true;
    }

    return <WishlistButton
        session={session}
        isFavorite={isFavorite}
        productId={product._id}
    />
};