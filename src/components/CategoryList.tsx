import { Link } from 'react-router-dom';
import { useAppSelector } from '../hooks/useAppStore';
import { selectCategoryCounts } from '../store/entriesSlice';
import { selectBookmarkCountByCategory } from '../store/bookmarksSlice';
import { selectProgressByCategory } from '../store/progressSlice';
import { CATEGORIES, type Category } from '../types';

interface CategoryCardProps {
  categoryId: Category;
}

function CategoryCard({ categoryId }: CategoryCardProps) {
  const category = CATEGORIES.find((c) => c.id === categoryId)!;
  const counts = useAppSelector(selectCategoryCounts);
  const bookmarkCount = useAppSelector((state) =>
    selectBookmarkCountByCategory(state, categoryId)
  );
  const progressCounts = useAppSelector((state) =>
    selectProgressByCategory(state, categoryId)
  );

  const totalCount = counts[categoryId];
  const progressPercentage =
    totalCount > 0 ? Math.round((progressCounts.known / totalCount) * 100) : 0;

  return (
    <Link
      to={`/categories/${categoryId}`}
      className="card bg-base-200 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
    >
      <div className="card-body">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{category.icon}</span>
          <div>
            <h2 className="card-title">{category.name}</h2>
            <p className="text-sm text-base-content/70">{category.description}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div className="bg-base-300 rounded-lg p-2">
            <div className="text-lg font-bold">{totalCount}</div>
            <div className="text-xs text-base-content/70">Total</div>
          </div>
          <div className="bg-base-300 rounded-lg p-2">
            <div className="text-lg font-bold text-warning">{bookmarkCount}</div>
            <div className="text-xs text-base-content/70">Bookmarked</div>
          </div>
          <div className="bg-base-300 rounded-lg p-2">
            <div className="text-lg font-bold text-success">{progressCounts.known}</div>
            <div className="text-xs text-base-content/70">Known</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <progress
            className="progress progress-success w-full"
            value={progressPercentage}
            max="100"
          ></progress>
        </div>

        {/* Learning status breakdown */}
        <div className="flex justify-between mt-3 text-xs">
          <span className="badge badge-sm badge-neutral">{progressCounts.new} new</span>
          <span className="badge badge-sm badge-warning">{progressCounts.learning} learning</span>
          <span className="badge badge-sm badge-success">{progressCounts.known} known</span>
        </div>
      </div>
    </Link>
  );
}

export function CategoryList() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {CATEGORIES.map((category) => (
        <CategoryCard key={category.id} categoryId={category.id} />
      ))}
    </div>
  );
}
