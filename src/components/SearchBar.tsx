import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore';
import { setSearchQuery, selectSearchQuery } from '../store/entriesSlice';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

export function SearchBar({ placeholder = 'Search entries...', className = '' }: SearchBarProps) {
  const dispatch = useAppDispatch();
  const searchQuery = useAppSelector(selectSearchQuery);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(setSearchQuery(e.target.value));
    },
    [dispatch]
  );

  const handleClear = useCallback(() => {
    dispatch(setSearchQuery(''));
  }, [dispatch]);

  return (
    <div className={`form-control ${className}`}>
      <div className="input-group flex">
        <input
          type="text"
          placeholder={placeholder}
          className="input input-bordered flex-1"
          value={searchQuery}
          onChange={handleChange}
        />
        {searchQuery && (
          <button className="btn btn-ghost" onClick={handleClear}>
            ✕
          </button>
        )}
        <button className="btn btn-square btn-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
