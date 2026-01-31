import { CategoryList } from "../components/CategoryList";
import { SearchBar } from "../components/SearchBar";
import { useAppSelector } from "../hooks/useAppStore";
import { selectFilteredEntries, selectAllEntries } from "../store/entriesSlice";

export function CategoriesPage() {
  const allEntries = useAppSelector(selectAllEntries);
  const filteredEntries = useAppSelector(selectFilteredEntries);
  const hasSearch = filteredEntries.length !== allEntries.length;

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
        Categories
      </h1>

      {/* Search */}
      <div className="mb-4 sm:mb-6">
        <SearchBar placeholder="Search across all categories..." />
      </div>

      {/* Show search results if searching */}
      {hasSearch && (
        <div className="alert alert-info mb-4 sm:mb-6 text-sm sm:text-base">
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
