import Link from "next/link";
import '@/styles/profile.css';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const linkStyles = "px-4 py-1.5 text-sm border border-solid border-border-primary rounded bg-background-secondary transition duration-150 ease hover:bg-color-secondary"
    return (
        <section className="page-section">
            <div className="flex gap-2.5 flex-wrap">
                <Link className={linkStyles} href="/account/orders">
                    Purchases
                </Link>
                <Link className={linkStyles} href="/account/profile">
                    Profile
                </Link>
                <Link className={linkStyles} href="#">
                    Settings
                </Link>
            </div>
            {children}
        </section>
    )
}