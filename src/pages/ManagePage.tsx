import { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../hooks/useAppStore';
import { selectAllEntries, deleteEntry, setSearchQuery, selectSearchQuery } from '../store/entriesSlice';
import { WordForm } from '../components/WordForm';
import { EntryCard } from '../components/EntryCard';
import type { VocabEntry, Category } from '../types';
import { CATEGORIES } from '../types';

type ViewMode = 'add' | 'list';

export function ManagePage() {
  const dispatch = useAppDispatch();
  const allEntries = useAppSelector(selectAllEntries);
  const searchQuery = useAppSelector(selectSearchQuery);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingEntry, setEditingEntry] = useState<VocabEntry | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [showCustomOnly, setShowCustomOnly] = useState(false);

  // Filter entries
  const filteredEntries = useMemo(() => {
    let entries = allEntries;

    if (categoryFilter !== 'all') {
      entries = entries.filter((e) => e.category === categoryFilter);
    }

    if (showCustomOnly) {
      entries = entries.filter((e) => e.isCustom);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      entries = entries.filter(
        (e) =>
          e.noun.toLowerCase().includes(query) ||
          e.phrase.toLowerCase().includes(query) ||
          e.example.toLowerCase().includes(query) ||
          e.translation.toLowerCase().includes(query)
      );
    }

    return entries;
  }, [allEntries, categoryFilter, showCustomOnly, searchQuery]);

  const customCount = allEntries.filter((e) => e.isCustom).length;

  const handleEdit = (entry: VocabEntry) => {
    setEditingEntry(entry);
    setViewMode('add');
  };

  const handleDelete = (entry: VocabEntry) => {
    if (confirm(`Are you sure you want to delete "${entry.noun}"?`)) {
      dispatch(deleteEntry(entry.id));
    }
  };

  const handleSave = () => {
    setEditingEntry(null);
    setViewMode('list');
  };

  const handleCancel = () => {
    setEditingEntry(null);
    setViewMode('list');
  };

  const handleAddNew = () => {
    setEditingEntry(null);
    setViewMode('add');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Manage Vocabulary</h1>
          <p className="text-base-content/70">
            {allEntries.length} total entries ({customCount} custom)
          </p>
        </div>

        <div className="flex gap-2">
          <button
            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => {
              setViewMode('list');
              setEditingEntry(null);
            }}
          >
            View All
          </button>
          <button
            className={`btn ${viewMode === 'add' ? 'btn-primary' : 'btn-outline'}`}
            onClick={handleAddNew}
          >
            + Add New
          </button>
        </div>
      </div>

      {viewMode === 'add' ? (
        <div className="card bg-base-200 shadow-xl max-w-2xl mx-auto">
          <div className="card-body">
            <h2 className="card-title">
              {editingEntry ? 'Edit Entry' : 'Add New Entry'}
            </h2>
            <WordForm
              entry={editingEntry || undefined}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="card bg-base-200 shadow-md mb-6">
            <div className="card-body">
              {/* Search */}
              <div className="form-control">
                <div className="input-group flex">
                  <input
                    type="text"
                    placeholder="Search entries..."
                    className="input input-bordered flex-1"
                    value={searchQuery}
                    onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                  />
                  {searchQuery && (
                    <button
                      className="btn btn-ghost"
                      onClick={() => dispatch(setSearchQuery(''))}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter */}
              <div className="mt-4">
                <label className="label">
                  <span className="label-text font-semibold">Filter by Category</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={`btn btn-sm ${categoryFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setCategoryFilter('all')}
                  >
                    All
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      className={`btn btn-sm ${categoryFilter === cat.id ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setCategoryFilter(cat.id)}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Only Toggle */}
              <div className="form-control mt-4">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={showCustomOnly}
                    onChange={(e) => setShowCustomOnly(e.target.checked)}
                  />
                  <span className="label-text">Show custom entries only</span>
                </label>
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="mb-4 text-sm text-base-content/70">
            Showing {filteredEntries.length} entries
          </div>

          {/* Entries Grid */}
          {filteredEntries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={handleEdit}
                  onDelete={entry.isCustom ? handleDelete : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="alert alert-info">
              <span>No entries found matching your filters.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
