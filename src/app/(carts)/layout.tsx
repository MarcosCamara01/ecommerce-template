import Link from "next/link";
import '@/styles/profile.css';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <section className="page-section">
            <div className="user-links">
                <Link href="/cart">
                    Cart
                </Link>
                <Link href="/wishlist">
                    Wishlist
                </Link>
            </div>
            {children}
        </section>
    )
}
