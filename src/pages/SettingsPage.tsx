import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore';
import { selectTheme, setTheme } from '../store/uiSlice';
import { resetAllProgress } from '../store/progressSlice';
import { clearAllBookmarks } from '../store/bookmarksSlice';
import { clearHistory } from '../store/quizzesSlice';
import { exportData, importData, resetData } from '../utils/localStorage';
import type { Theme } from '../types';

export function SettingsPage() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  const handleThemeChange = (newTheme: Theme) => {
    dispatch(setTheme(newTheme));
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `german-learning-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    setImportError('');
    setImportSuccess(false);

    if (!importText.trim()) {
      setImportError('Please paste your backup data');
      return;
    }

    const success = importData(importText);
    if (success) {
      setImportSuccess(true);
      setImportText('');
      // Reload the page to refresh the store
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setImportError('Invalid backup data format');
    }
  };

  const handleResetProgress = () => {
    if (confirm('Are you sure you want to reset all learning progress? This cannot be undone.')) {
      dispatch(resetAllProgress());
    }
  };

  const handleClearBookmarks = () => {
    if (confirm('Are you sure you want to clear all bookmarks?')) {
      dispatch(clearAllBookmarks());
    }
  };

  const handleClearQuizHistory = () => {
    if (confirm('Are you sure you want to clear all quiz history?')) {
      dispatch(clearHistory());
    }
  };

  const handleResetAll = () => {
    if (
      confirm(
        'Are you sure you want to reset ALL data? This will delete all your progress, bookmarks, custom entries, and quiz history. This cannot be undone!'
      )
    ) {
      resetData();
      window.location.reload();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {/* Theme */}
      <div className="card bg-base-200 shadow-md mb-6">
        <div className="card-body">
          <h2 className="card-title">Theme</h2>
          <p className="text-base-content/70 mb-4">
            Choose your preferred color scheme
          </p>
          <div className="flex gap-4">
            <button
              className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => handleThemeChange('light')}
            >
              ☀️ Light
            </button>
            <button
              className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => handleThemeChange('dark')}
            >
              🌙 Dark
            </button>
          </div>
        </div>
      </div>

      {/* Export/Import */}
      <div className="card bg-base-200 shadow-md mb-6">
        <div className="card-body">
          <h2 className="card-title">Backup & Restore</h2>
          <p className="text-base-content/70 mb-4">
            Export your data to save a backup or import previous data
          </p>

          {/* Export */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Export Data</h3>
            <button className="btn btn-outline btn-primary" onClick={handleExport}>
              📥 Download Backup
            </button>
          </div>

          {/* Import */}
          <div>
            <h3 className="font-semibold mb-2">Import Data</h3>
            <textarea
              className="textarea textarea-bordered w-full mb-2"
              placeholder="Paste your backup JSON data here..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={4}
            />
            {importError && (
              <div className="alert alert-error mb-2">
                <span>{importError}</span>
              </div>
            )}
            {importSuccess && (
              <div className="alert alert-success mb-2">
                <span>Data imported successfully! Reloading...</span>
              </div>
            )}
            <button className="btn btn-outline" onClick={handleImport}>
              📤 Import Data
            </button>
          </div>
        </div>
      </div>

      {/* Reset Options */}
      <div className="card bg-base-200 shadow-md mb-6">
        <div className="card-body">
          <h2 className="card-title text-error">Danger Zone</h2>
          <p className="text-base-content/70 mb-4">
            These actions cannot be undone. Please proceed with caution.
          </p>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="font-semibold">Reset Learning Progress</h3>
                <p className="text-sm text-base-content/70">
                  Clear all known/learning status for entries
                </p>
              </div>
              <button
                className="btn btn-outline btn-warning btn-sm"
                onClick={handleResetProgress}
              >
                Reset Progress
              </button>
            </div>

            <div className="divider"></div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="font-semibold">Clear Bookmarks</h3>
                <p className="text-sm text-base-content/70">
                  Remove all bookmarked entries
                </p>
              </div>
              <button
                className="btn btn-outline btn-warning btn-sm"
                onClick={handleClearBookmarks}
              >
                Clear Bookmarks
              </button>
            </div>

            <div className="divider"></div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="font-semibold">Clear Quiz History</h3>
                <p className="text-sm text-base-content/70">
                  Delete all quiz attempts and statistics
                </p>
              </div>
              <button
                className="btn btn-outline btn-warning btn-sm"
                onClick={handleClearQuizHistory}
              >
                Clear History
              </button>
            </div>

            <div className="divider"></div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="font-semibold text-error">Reset Everything</h3>
                <p className="text-sm text-base-content/70">
                  Delete all data and restore to factory settings
                </p>
              </div>
              <button
                className="btn btn-error btn-sm"
                onClick={handleResetAll}
              >
                Reset All Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card bg-base-200 shadow-md">
        <div className="card-body">
          <h2 className="card-title">About</h2>
          <p className="text-base-content/70">
            German Learning App - Learn German vocabulary with flashcards and quizzes.
          </p>
          <p className="text-sm text-base-content/50 mt-2">
            Version 1.0.0 | Built with React, Redux Toolkit, and daisyUI
          </p>
        </div>
      </div>
    </div>
  );
}
