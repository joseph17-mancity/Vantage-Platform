'use client';

import { useEffect, useRef, useState } from 'react';
import { getAllReports, saveReport, deleteReport, getReportBlob, type UploadedReport } from '@/lib/report-store';

const HIGH_SCHOOL_YEARS = ['Year 1 (Freshman)', 'Year 2 (Sophomore)', 'Year 3 (Junior)', 'Year 4 (Senior)'];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

export function ReportManager() {
  const [reports, setReports] = useState<UploadedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadReports();
  }, []);

  async function loadReports() {
    try {
      const all = await getAllReports();
      all.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
      setReports(all);
    } catch {
      setError('Could not load saved reports from this browser.');
    } finally {
      setLoading(false);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!selectedYear) {
      setError('Pick a high school year before uploading.');
      return;
    }
    setError('');
    for (const file of Array.from(files)) {
      const report: UploadedReport = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        year: selectedYear,
        fileName: file.name,
        fileType: file.type || 'unknown',
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        blob: file,
      };
      await saveReport(report);
    }
    await loadReports();
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleDelete(id: string) {
    await deleteReport(id);
    await loadReports();
  }

  async function handleDownload(report: UploadedReport) {
    const blob = await getReportBlob(report.id);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = report.fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  const yearCounts = HIGH_SCHOOL_YEARS.map((year) => ({
    year,
    count: reports.filter((r) => r.year === year).length,
  }));

  return (
    <div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {yearCounts.map(({ year, count }) => (
          <div
            key={year}
            className={`border p-4 transition ${selectedYear === year ? 'border-[#b23a2e] bg-[#f7e2dc]/40' : 'border-[#cfc6b7] bg-[#f9f6ef]'}`}
          >
            <button onClick={() => setSelectedYear(year)} className="w-full text-left">
              <div className="eyebrow">{count} {count === 1 ? 'file' : 'files'}</div>
              <div className="serif mt-1 text-lg font-bold">{year}</div>
            </button>
          </div>
        ))}
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); void handleFiles(e.dataTransfer.files); }}
        className={`border-2 border-dashed p-8 text-center transition ${dragOver ? 'border-[#b23a2e] bg-[#f7e2dc]/30' : 'border-[#cfc6b7] bg-[#f9f6ef]'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.csv"
          onChange={(e) => void handleFiles(e.target.files)}
          className="hidden"
        />
        <p className="serif text-xl font-bold">{selectedYear ? `Upload reports for ${selectedYear}` : 'Pick a year, then upload'}</p>
        <p className="mt-2 text-sm text-[#6e6a61]">Drag files here or <button onClick={() => fileInputRef.current?.click()} className="font-bold text-[#b23a2e] underline">browse</button>. Files stay in your browser only — nothing is uploaded to a server.</p>
        <p className="mt-1 text-xs text-[#6e6a61]">Accepts PDF, DOC, DOCX, JPG, PNG, TXT, CSV</p>
      </div>

      {error && <div className="mt-4 border border-[#b23a2e] bg-[#f7e2dc] p-3 text-sm text-[#8f2d24]">{error}</div>}

      <div className="mt-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16" />)}
          </div>
        ) : reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="flex flex-wrap items-center justify-between gap-4 border border-[#cfc6b7] bg-[#f9f6ef] p-4">
                <div className="flex items-center gap-4">
                  <span className="stamp">{report.year.split(' ')[1].replace('(', '').replace(')', '')}</span>
                  <div>
                    <div className="serif text-lg font-bold">{report.fileName}</div>
                    <div className="text-xs text-[#6e6a61]">{report.year} · {formatBytes(report.fileSize)} · {formatDate(report.uploadedAt)}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => void handleDownload(report)} className="secondary-button text-xs">Download</button>
                  <button onClick={() => void handleDelete(report.id)} className="secondary-button text-xs hover:!border-[#b23a2e] hover:!text-[#b23a2e]">Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-[#cfc6b7] p-8 text-center text-sm text-[#6e6a61]">
            No reports uploaded yet. Pick a year above and add your first file.
          </div>
        )}
      </div>
    </div>
  );
}
