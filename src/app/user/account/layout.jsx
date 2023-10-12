import Link from "next/link";
import '../../../styles/profile.css';

export default function RootLayout({ children }) {
    return (
        <section>
            <div className="user-links">
                <Link href="/user/account/orders">
                    PURCHASES
                </Link>
                <Link href="/user/account/profile">
                    PROFILE
                </Link>
                <Link href="#">
                    SETTINGS
                </Link>
            </div>
            {children}
        </section>
    )
}
