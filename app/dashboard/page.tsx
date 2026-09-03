'use client';

import { useState } from 'react';
import { AroundTheWorld } from '@/components/around-the-world';
import { ReportManager } from '@/components/report-manager';
import { RealityCheck } from '@/components/reality-check';
import { SiteNav } from '@/components/site-nav';

type Tab = 'world' | 'reality' | 'reports';

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>('world');

  return (
    <main className="paper-grid min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7 lg:px-10">
        <div className="flex items-center gap-6">
          <img src="/vantage-lockup-light.svg" alt="Vantage" className="h-9 w-auto" />
          <SiteNav />
        </div>
        <div className="hidden text-right sm:block">
          <div className="eyebrow">Dashboard</div>
          <div className="mt-1 text-xs text-[#6e6a61]">Explore the world. Manage your records.</div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-4 lg:px-10">
        <div className="mb-8 border-b border-[#cfc6b7] pb-1">
          <div className="flex gap-1">
            <button
              onClick={() => setTab('world')}
              className={`px-4 py-3 text-sm font-bold transition ${tab === 'world' ? 'border-b-2 border-[#b23a2e] text-[#b23a2e]' : 'text-[#6e6a61] hover:text-[#1b1b18]'}`}
            >
              Around the World
            </button>
            <button
              onClick={() => setTab('reality')}
              className={`px-4 py-3 text-sm font-bold transition ${tab === 'reality' ? 'border-b-2 border-[#b23a2e] text-[#b23a2e]' : 'text-[#6e6a61] hover:text-[#1b1b18]'}`}
            >
              Reality Check
            </button>
            <button
              onClick={() => setTab('reports')}
              className={`px-4 py-3 text-sm font-bold transition ${tab === 'reports' ? 'border-b-2 border-[#b23a2e] text-[#b23a2e]' : 'text-[#6e6a61] hover:text-[#1b1b18]'}`}
            >
              My Reports
            </button>
          </div>
        </div>

        {tab === 'world' ? (
          <div>
            <div className="mb-6">
              <div className="stamp">Atlas 02</div>
              <h1 className="serif mt-4 text-4xl font-bold tracking-[-.03em]">Around the World</h1>
              <p className="mt-3 max-w-2xl text-[#555149]">Browse every continent, drill into a country and province, and discover the universities and colleges there. Filter by type to narrow your view.</p>
            </div>
            <AroundTheWorld />
          </div>
        ) : tab === 'reality' ? (
          <div>
            <div className="mb-6">
              <div className="stamp">Reality 04</div>
              <h1 className="serif mt-4 text-4xl font-bold tracking-[-.03em]">Reality Check</h1>
              <p className="mt-3 max-w-2xl text-[#555149]">Not waiting for senior year. Get an honest, grounded read on where you stand right now — and the specific areas to focus on to pull up your socks before it counts.</p>
            </div>
            <RealityCheck />
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <div className="stamp">Records 03</div>
              <h1 className="serif mt-4 text-4xl font-bold tracking-[-.03em]">My High School Reports</h1>
              <p className="mt-3 max-w-2xl text-[#555149]">Upload reports for each year of high school — transcripts, recommendation letters, project portfolios, or any document you want to keep on hand. Everything stays in your browser; nothing is sent to a server.</p>
            </div>
            <ReportManager />
          </div>
        )}
      </section>

      <footer className="border-t border-[#cfc6b7] px-6 py-8 text-center text-xs text-[#6e6a61]">
        <span className="serif text-base font-bold text-[#1b1b18]">Vantage.</span> A clearer starting point for the questions that matter.
      </footer>
    </main>
  );
}
