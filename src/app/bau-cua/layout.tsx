import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Bau Cua | Smashed Box",
    description: "Play Bau Cua Tom Ca with your family!",
};

export default function BauCuaLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            {children}
        </>
    );
}
