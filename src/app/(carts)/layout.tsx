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
                    Cart
                </Link>
                <Link href="/wishlists">
                    Wishlists
                </Link>
            </div>
            {children}
        </section>
    )
}
