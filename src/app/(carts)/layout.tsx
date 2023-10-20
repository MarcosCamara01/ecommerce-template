import Link from "next/link";
import '@/styles/profile.css';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <section>
            <div className="user-links">
                <Link href="/cart">
                    CART
                </Link>
                <Link href="/wishlists">
                    WISHLISTS
                </Link>
            </div>
            {children}
        </section>
    )
}
