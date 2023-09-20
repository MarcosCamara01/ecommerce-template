import Link from "next/link";
import '../../../styles/profile.css';

export default function RootLayout({ children }) {
    return (
        <section>
            <div className="user-links">
                <Link href="/user/account/orders">
                    COMPRAS
                </Link>
                <Link href="/user/account/profile">
                    PERFIL
                </Link>
                <Link href="#">
                    AJUSTES
                </Link>
            </div>
            {children}
        </section>
    )
}
