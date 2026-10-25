import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

export function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-brand">
          <div className="navbar-logo-icon">
            <Image src="/logo.png" alt="Language Tutor MCP logo" width={34} height={34} style={{ objectFit: "cover", borderRadius: "10px" }} />
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
  );
}
