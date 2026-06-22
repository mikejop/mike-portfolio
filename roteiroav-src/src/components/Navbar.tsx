import Link from "next/link"
import { Container } from "./Container"

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <Container>
                <div className="flex h-16 items-center justify-between">
                    <div className="flex gap-6 md:gap-10">
                        <Link href="/" className="flex items-center space-x-2">
                            <span className="inline-block font-bold">Roteiro AV</span>
                        </Link>
                        <nav className="flex gap-6">
                            <Link
                                href="/"
                                className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                Home
                            </Link>
                            <Link
                                href="/tools"
                                className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                Tools
                            </Link>
                        </nav>
                    </div>
                </div>
            </Container>
        </header>
    )
}
