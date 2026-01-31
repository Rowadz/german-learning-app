import { useState, useCallback } from 'react';
import type { VocabEntry, LearningStatus } from '../types';
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore';
import { toggleBookmark, selectIsBookmarked } from '../store/bookmarksSlice';
import { setEntryStatus, selectEntryStatus } from '../store/progressSlice';

interface FlashcardProps {
  entry: VocabEntry;
  onNext?: () => void;
  onPrevious?: () => void;
  showControls?: boolean;
}

export function Flashcard({ entry, onNext, onPrevious, showControls = true }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const dispatch = useAppDispatch();

  const isBookmarked = useAppSelector((state) => selectIsBookmarked(state, entry.id));
  const status = useAppSelector((state) => selectEntryStatus(state, entry.id));

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleBookmark = useCallback(() => {
    dispatch(toggleBookmark(entry.id));
  }, [dispatch, entry.id]);

  const handleStatusChange = useCallback(
    (newStatus: LearningStatus) => {
      dispatch(setEntryStatus({ entryId: entry.id, status: newStatus }));
    },
    [dispatch, entry.id]
  );

  const statusColors: Record<LearningStatus, string> = {
    new: 'badge-neutral',
    learning: 'badge-warning',
    known: 'badge-success',
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Flashcard */}
      <div
        className={`flip-card w-full h-80 cursor-pointer ${isFlipped ? 'flipped' : ''}`}
        onClick={handleFlip}
      >
        <div className="flip-card-inner">
          {/* Front */}
          <div className="flip-card-front card bg-base-200 shadow-xl h-full">
            <div className="card-body flex flex-col items-center justify-center">
              <div className="badge badge-outline mb-4">{entry.category}</div>
              <h2 className="card-title text-3xl text-center">{entry.noun}</h2>
              <p className="text-base-content/60 mt-4">Click to flip</p>
            </div>
          </div>

          {/* Back */}
          <div className="flip-card-back card bg-primary text-primary-content shadow-xl h-full">
            <div className="card-body flex flex-col items-center justify-center overflow-y-auto">
              <h3 className="text-xl font-bold mb-2">{entry.phrase}</h3>
              <div className="divider divider-primary-content/30 my-2"></div>
              <p className="text-sm italic mb-2">{entry.example}</p>
              <p className="text-sm opacity-80">{entry.translation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="mt-4 space-y-4">
          {/* Navigation and bookmark */}
          <div className="flex items-center justify-between gap-2">
            <button
              className="btn btn-outline"
              onClick={onPrevious}
              disabled={!onPrevious}
            >
              ← Previous
            </button>

            <button
              className={`btn ${isBookmarked ? 'btn-warning' : 'btn-outline'}`}
              onClick={handleBookmark}
            >
              {isBookmarked ? '★ Bookmarked' : '☆ Bookmark'}
            </button>

            <button
              className="btn btn-outline"
              onClick={onNext}
              disabled={!onNext}
            >
              Next →
            </button>
          </div>

          {/* Status buttons */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm mr-2">Mark as:</span>
            <button
              className={`btn btn-sm ${status === 'new' ? 'btn-neutral' : 'btn-outline'}`}
              onClick={() => handleStatusChange('new')}
            >
              New
            </button>
            <button
              className={`btn btn-sm ${status === 'learning' ? 'btn-warning' : 'btn-outline'}`}
              onClick={() => handleStatusChange('learning')}
            >
              Learning
            </button>
            <button
              className={`btn btn-sm ${status === 'known' ? 'btn-success' : 'btn-outline'}`}
              onClick={() => handleStatusChange('known')}
            >
              Known
            </button>
          </div>

          {/* Current status badge */}
          <div className="flex justify-center">
            <span className={`badge ${statusColors[status]}`}>
              Status: {status}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
