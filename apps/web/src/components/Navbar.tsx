import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

const GREETINGS = ["Hola", "Bonjour", "Ciao", "Hallo", "こんにちは", "Olá", "Привет", "你好", "Namaste", "안녕하세요", "Merhaba", "Hej"];

export function Navbar() {
  return (
    <>
    <header className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-brand">
          <div className="navbar-logo-icon">
            <Image src="/logo.png" alt="Language Tutor MCP logo" width={34} height={34} style={{ objectFit: "cover", borderRadius: 0 }} />
          </div>
          <span>Language Tutor MCP</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Show when="signed-in">
            <div className="online-chip">
              <span className="pulsing-dot" />
              <span>MCP Tutor Connected</span>
            </div>
            <UserButton />
          </Show>
          <Show when="signed-out">
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <SignInButton mode="modal">
                <button type="button" className="btn btn-secondary" style={{ padding: "0.5rem 1rem" }}>
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button type="button" className="btn" style={{ padding: "0.5rem 1rem" }}>
                  Sign up
                </button>
              </SignUpButton>
            </div>
          </Show>
        </div>
      </div>
    </header>
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {[...GREETINGS, ...GREETINGS, ...GREETINGS, ...GREETINGS].map((g, i) => (
          <span key={i}>{g} ✦</span>
        ))}
      </div>
    </div>
    </>
  );
}
