'use client';

import React from 'react';
import { usePwaInstall } from '../hooks/usePwaInstall';

export function PwaInstallPrompt() {
  const { isInstallable, promptInstall } = usePwaInstall();

  if (!isInstallable) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 w-full max-w-sm px-4">
      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xl rounded-2xl p-4 flex items-center justify-between border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col">
          <span className="font-semibold text-sm">Install App</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Add to home screen for quick access</span>
        </div>
        <button
          onClick={promptInstall}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" x2="12" y1="15" y2="3"/>
          </svg>
          Install
        </button>
      </div>
    </div>
  );
}
