import type { VocabEntry } from "../types";
import { useAppDispatch, useAppSelector } from "../hooks/useAppStore";
import { toggleBookmark, selectIsBookmarked } from "../store/bookmarksSlice";
import { selectEntryStatus } from "../store/progressSlice";
import { getCategoryInfo } from "../types";

interface EntryCardProps {
  entry: VocabEntry;
  onEdit?: (entry: VocabEntry) => void;
  onDelete?: (entry: VocabEntry) => void;
  showCategory?: boolean;
  compact?: boolean;
}

export function EntryCard({
  entry,
  onEdit,
  onDelete,
  showCategory = true,
  compact = false,
}: EntryCardProps) {
  const dispatch = useAppDispatch();
  const isBookmarked = useAppSelector((state) =>
    selectIsBookmarked(state, entry.id),
  );
  const status = useAppSelector((state) => selectEntryStatus(state, entry.id));

  const categoryInfo = getCategoryInfo(entry.category);

  const statusColors = {
    new: "badge-neutral",
    learning: "badge-warning",
    known: "badge-success",
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleBookmark(entry.id));
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold truncate">{entry.noun}</span>
            <span className={`badge badge-xs ${statusColors[status]}`}>
              {status}
            </span>
          </div>
          <p className="text-sm text-base-content/70 truncate">
            {entry.phrase}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <button
            className={`btn btn-xs btn-ghost ${isBookmarked ? "text-warning" : ""}`}
            onClick={handleBookmark}
          >
            {isBookmarked ? "★" : "☆"}
          </button>
          {onEdit && (
            <button
              className="btn btn-xs btn-ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(entry);
              }}
            >
              ✏️
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
      <div className="card-body p-3 sm:p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {showCategory && (
                <span className="badge badge-outline badge-xs sm:badge-sm">
                  {categoryInfo.icon}{" "}
                  <span className="hidden xs:inline">{categoryInfo.name}</span>
                </span>
              )}
              <span
                className={`badge badge-xs sm:badge-sm ${statusColors[status]}`}
              >
                {status}
              </span>
              {entry.isCustom && (
                <span className="badge badge-info badge-xs">Custom</span>
              )}
            </div>
            <h3 className="card-title text-base sm:text-xl mt-1.5 sm:mt-2 break-words">
              {entry.noun}
            </h3>
          </div>
          <button
            className={`btn btn-xs sm:btn-sm btn-ghost flex-shrink-0 ${isBookmarked ? "text-warning" : ""}`}
            onClick={handleBookmark}
          >
            {isBookmarked ? "★" : "☆"}
          </button>
        </div>

        {/* Content */}
        <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
          <p className="font-medium text-primary text-sm sm:text-base break-words">
            {entry.phrase}
          </p>
          <p className="text-xs sm:text-sm italic break-words">
            {entry.example}
          </p>
          <p className="text-sm text-base-content/70">{entry.translation}</p>
        </div>

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {entry.tags.map((tag) => (
              <span key={tag} className="badge badge-sm badge-ghost">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        {(onEdit || onDelete) && (
          <div className="card-actions justify-end mt-3">
            {onEdit && (
              <button
                className="btn btn-sm btn-outline"
                onClick={() => onEdit(entry)}
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                className="btn btn-sm btn-outline btn-error"
                onClick={() => onDelete(entry)}
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
