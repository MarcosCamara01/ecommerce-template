import Link from "next/link";
import '../../../styles/profile.css';

export default function RootLayout({ children }) {
    return (
        <section>
            <div className="user-links">
                <Link href="#">
                    COMPRAS
                </Link>
                <Link href="#">
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
