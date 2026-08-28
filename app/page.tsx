import { Radar } from "lucide-react";
import Link from "next/link";
import { ScannerDashboard } from "@/components/scanner-dashboard";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07110f] text-[#eaf7f1]">
      <div className="grid-overlay pointer-events-none fixed inset-0 opacity-30" />
      <div className="relative mx-auto min-h-screen max-w-[1500px] px-4 pb-12 sm:px-7 lg:px-10">
        <header className="flex h-20 items-center justify-between border-b border-white/10">
          <Link href="/" className="group flex items-center gap-3" aria-label="CloudScope home">
            <span className="grid size-9 place-items-center rounded-lg border border-[#5ee9ae]/35 bg-[#5ee9ae]/10 text-[#5ee9ae] shadow-[0_0_24px_rgba(94,233,174,0.12)]">
              <Radar className="size-5 transition-transform group-hover:rotate-12" />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-[0.18em] text-white">CLOUDSCOPE</span>
              <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-[#78978b]">Security posture scanner</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 font-mono text-xs text-[#78978b] sm:flex">
              <span className="size-1.5 rounded-full bg-[#5ee9ae] shadow-[0_0_10px_#5ee9ae]" />
              public · no sign-in
            </span>
            <a
              href="https://github.com/madhav1337/cloudscope-security-scanner"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-[#b9cec5] transition hover:border-white/20 hover:text-white"
            >
              <span className="font-mono text-[11px]" aria-hidden="true">&lt;/&gt;</span> Source
            </a>
          </div>
        </header>

        <ScannerDashboard />
      </div>
    </main>
  );
}
