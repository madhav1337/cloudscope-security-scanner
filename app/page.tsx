import { ArrowUpRight, Code2, Radar } from "lucide-react";
import Link from "next/link";
import { ScannerDashboard } from "@/components/scanner-dashboard";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070b14] text-[#f4f7fc]">
      <div className="ambient-light pointer-events-none fixed inset-0" />
      <div className="grid-overlay pointer-events-none fixed inset-0" />

      <div className="relative mx-auto min-h-screen max-w-[1480px] px-4 sm:px-6 lg:px-10">
        <header className="sticky top-0 z-40 pt-3 sm:pt-4">
          <div className="flex min-h-16 items-center justify-between rounded-2xl border border-white/[0.08] bg-[#090e1a]/85 px-3.5 shadow-[0_16px_60px_rgba(0,0,0,.28)] backdrop-blur-xl sm:px-5">
            <Link href="/" className="group flex min-h-11 items-center gap-3" aria-label="CloudScope home">
              <span className="brand-mark relative grid size-10 place-items-center rounded-xl border border-[#59e1ff]/25 bg-[#59e1ff]/[0.08] text-[#59e1ff]">
                <Radar className="size-5 transition-transform duration-300 group-hover:rotate-45" />
              </span>
              <span>
                <span className="block text-[13px] font-bold tracking-[0.16em] text-white sm:text-sm">CLOUDSCOPE</span>
                <span className="hidden font-mono text-[9px] uppercase tracking-[0.18em] text-[#7d8ca5] sm:block">Security intelligence</span>
              </span>
              <span className="hidden rounded-full border border-[#a99bff]/20 bg-[#a99bff]/10 px-2 py-1 font-mono text-[9px] font-semibold tracking-wider text-[#c3baff] md:inline-flex">2026</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden min-h-9 items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.025] px-3 font-mono text-[10px] text-[#9aa8bd] md:flex">
                <span className="size-1.5 rounded-full bg-[#45d89b] shadow-[0_0_12px_#45d89b]" />
                scanner online
              </span>
              <a
                href="https://github.com/madhav1337/cloudscope-security-scanner"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.035] px-3.5 text-xs font-semibold text-[#bdc7d6] transition duration-200 hover:border-[#59e1ff]/25 hover:bg-[#59e1ff]/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#59e1ff] sm:px-4"
              >
                <Code2 className="size-4" />
                <span className="hidden sm:inline">View source</span>
                <ArrowUpRight className="size-3.5 text-[#65738a] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </header>

        <ScannerDashboard />

        <footer className="flex flex-col gap-3 border-t border-white/[0.07] py-7 text-xs text-[#687890] sm:flex-row sm:items-center sm:justify-between">
          <p>CloudScope performs bounded, passive checks on public web configuration.</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em]">Open source · Anonymous · Built for the web</p>
        </footer>
      </div>
    </main>
  );
}
