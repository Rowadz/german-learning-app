import { CategoryList } from '../components/CategoryList';
import { SearchBar } from '../components/SearchBar';
import { useAppSelector } from '../hooks/useAppStore';
import { selectFilteredEntries, selectAllEntries } from '../store/entriesSlice';

export function CategoriesPage() {
  const allEntries = useAppSelector(selectAllEntries);
  const filteredEntries = useAppSelector(selectFilteredEntries);
  const hasSearch = filteredEntries.length !== allEntries.length;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Categories</h1>

      {/* Search */}
      <div className="mb-6">
        <SearchBar placeholder="Search across all categories..." />
      </div>

      {/* Show search results if searching */}
      {hasSearch && (
        <div className="alert alert-info mb-6">
          <span>
            Found {filteredEntries.length} entries matching your search
          </span>
        </div>
      )}

      {/* Category Grid */}
      <CategoryList />
    </div>
  );
}
