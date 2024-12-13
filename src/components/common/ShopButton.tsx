import Link from "next/link"; // Importing Link from next.js

interface ShopButtonProps {
    text: string;
    href: string; // Keeping href prop for the link destination
}

export const ShopButton: React.FC<ShopButtonProps> = ({ text, href }) => {
    return (
        <Link
            href={href}
            passHref
            style={{
                borderRadius: "5px",
                padding: "10px",
                backgroundColor: "#007BFF",
                color: "#fff",
                textDecoration: "none",
            }}
        >
            {text}
        </Link>
    );
};
