'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const MapPickerLeaflet = dynamic(() => import('./MapPickerLeaflet'), { ssr: false });

type LatLon = [number, number];

type MapPickerModalProps = {
  open: boolean;
  title: string;
  onConfirm: (lat: number, lng: number) => void;
  onClose: () => void;
};

export function MapPickerModal({ open, title, onConfirm, onClose }: MapPickerModalProps) {
  const [picked, setPicked] = useState<LatLon | null>(null);

  if (!open) return null;

  const handleConfirm = () => {
    if (!picked) return;
    onConfirm(picked[0], picked[1]);
    setPicked(null);
    onClose();
  };

  const handleClose = () => {
    setPicked(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Pilih Lokasi</p>
            <h3 className="text-base font-semibold text-slate-900 mt-0.5">{title}</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Instruction */}
        <div className="px-5 py-2.5 bg-blue-50 border-b border-blue-100 shrink-0">
          <p className="text-xs text-blue-700 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            Klik pada peta untuk menandai lokasi. Zoom dan geser peta untuk mencari titik yang tepat.
          </p>
        </div>

        {/* Map */}
        <div style={{ height: '420px', position: 'relative', flexShrink: 0 }}>
          <MapPickerLeaflet onPick={(lat, lng) => setPicked([lat, lng])} picked={picked} />
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center gap-3">
          {picked ? (
            <span className="text-xs font-mono text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
              {picked[0].toFixed(6)}, {picked[1].toFixed(6)}
            </span>
          ) : (
            <span className="text-xs text-slate-400">Belum ada titik dipilih</span>
          )}
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!picked}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Konfirmasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
