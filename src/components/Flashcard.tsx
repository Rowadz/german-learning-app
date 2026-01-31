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
    <div className="w-full max-w-lg mx-auto px-2 sm:px-0">
      {/* Flashcard */}
      <div
        className={`flip-card w-full h-64 sm:h-80 cursor-pointer ${isFlipped ? 'flipped' : ''}`}
        onClick={handleFlip}
      >
        <div className="flip-card-inner">
          {/* Front */}
          <div className="flip-card-front card bg-base-200 shadow-xl h-full">
            <div className="card-body flex flex-col items-center justify-center p-4 sm:p-6">
              <div className="badge badge-outline mb-2 sm:mb-4 text-xs sm:text-sm">{entry.category}</div>
              <h2 className="card-title text-2xl sm:text-3xl text-center leading-tight">{entry.noun}</h2>
              <p className="text-base-content/60 mt-2 sm:mt-4 text-sm">Tap to flip</p>
            </div>
          </div>

          {/* Back */}
          <div className="flip-card-back card bg-primary text-primary-content shadow-xl h-full">
            <div className="card-body flex flex-col items-center justify-center overflow-y-auto p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-center">{entry.phrase}</h3>
              <div className="divider divider-primary-content/30 my-1 sm:my-2 w-full"></div>
              <p className="text-xs sm:text-sm italic mb-2 text-center">{entry.example}</p>
              <p className="text-xs sm:text-sm opacity-80 text-center">{entry.translation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="mt-4 space-y-3 sm:space-y-4">
          {/* Navigation and bookmark - stack on mobile */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <button
              className="btn btn-outline flex-1 sm:flex-none order-2 sm:order-1"
              onClick={onPrevious}
              disabled={!onPrevious}
            >
              <span className="sm:inline">←</span>
              <span className="ml-1">Previous</span>
            </button>

            <button
              className={`btn flex-1 sm:flex-none order-1 sm:order-2 ${isBookmarked ? 'btn-warning' : 'btn-outline'}`}
              onClick={handleBookmark}
            >
              {isBookmarked ? '★ Bookmarked' : '☆ Bookmark'}
            </button>

            <button
              className="btn btn-outline flex-1 sm:flex-none order-3"
              onClick={onNext}
              disabled={!onNext}
            >
              <span className="mr-1">Next</span>
              <span className="sm:inline">→</span>
            </button>
          </div>

          {/* Status buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <span className="text-sm mb-1 sm:mb-0 sm:mr-2">Mark as:</span>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                className={`btn btn-sm flex-1 sm:flex-none ${status === 'new' ? 'btn-neutral' : 'btn-outline'}`}
                onClick={() => handleStatusChange('new')}
              >
                New
              </button>
              <button
                className={`btn btn-sm flex-1 sm:flex-none ${status === 'learning' ? 'btn-warning' : 'btn-outline'}`}
                onClick={() => handleStatusChange('learning')}
              >
                Learning
              </button>
              <button
                className={`btn btn-sm flex-1 sm:flex-none ${status === 'known' ? 'btn-success' : 'btn-outline'}`}
                onClick={() => handleStatusChange('known')}
              >
                Known
              </button>
            </div>
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
