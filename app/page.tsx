import { ArrowRight, LockKeyhole, Radar, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ScannerDashboard } from "@/components/scanner-dashboard";
import {
  chatGPTSignInPath,
  chatGPTSignOutPath,
  getChatGPTUser,
} from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();

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
              passive checks online
            </span>
            {user ? (
              <a href={chatGPTSignOutPath("/")} className="rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-[#b9cec5] transition hover:border-white/20 hover:text-white">
                Sign out
              </a>
            ) : null}
          </div>
        </header>

        {user ? (
          <ScannerDashboard user={{ displayName: user.displayName, email: user.email }} />
        ) : (
          <section className="grid min-h-[calc(100vh-8rem)] items-center gap-10 py-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="max-w-3xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#5ee9ae]/20 bg-[#5ee9ae]/[0.06] px-3 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-[#74dcae]">
                <ShieldCheck className="size-3.5" /> Portfolio security tool
              </div>
              <h1 className="text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.045em] text-white sm:text-6xl lg:text-[5.2rem]">
                See what your domain reveals
                <span className="text-[#5ee9ae]"> before attackers do.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#9bb5aa]">
                CloudScope checks HTTPS enforcement, security headers, information leakage, and common public web endpoints—then turns the evidence into a clear, prioritized report.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <a href={chatGPTSignInPath("/")} target="_top" className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#5ee9ae] px-5 text-sm font-semibold text-[#062016] transition hover:bg-[#7af2be] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5ee9ae]">
                  Sign in to scan <ArrowRight className="size-4" />
                </a>
                <span className="flex items-center gap-2 text-sm text-[#78978b]"><LockKeyhole className="size-4" /> Reports stay tied to your account</span>
              </div>
            </div>

            <div className="scan-terminal relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1915]/90 p-1 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex gap-1.5"><i /><i /><i /></div>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#668177]">sample posture report</span>
              </div>
              <div className="p-6 sm:p-8">
                <div className="flex items-end justify-between gap-6">
                  <div>
                    <p className="font-mono text-xs text-[#668177]">TARGET / EXAMPLE.COM</p>
                    <p className="mt-2 text-xl font-medium text-white">Public surface analysis</p>
                  </div>
                  <div className="grid size-20 place-items-center rounded-full border-4 border-[#f7c85b] bg-[#f7c85b]/5 text-3xl font-semibold text-[#f7c85b]">78</div>
                </div>
                <div className="mt-8 space-y-3">
                  {[
                    ["HTTPS reachable", "PASS", "good"],
                    ["Content Security Policy", "PASS", "good"],
                    ["Permissions Policy", "MISSING", "warn"],
                    ["Server signature", "EXPOSED", "warn"],
                  ].map(([label, value, tone]) => (
                    <div key={label} className="flex items-center justify-between border-b border-white/[0.07] py-3 font-mono text-xs">
                      <span className="text-[#9bb5aa]">{label}</span>
                      <span className={tone === "good" ? "text-[#5ee9ae]" : "text-[#f7c85b]"}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
