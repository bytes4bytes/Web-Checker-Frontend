// frontend/src/components/CategoryGrid.js
import CategoryCard from "./CategoryCard";

export default function CategoryGrid({ categories, onJump }) {
  if (!categories.length) return null;
  return (
    <section>
      <header className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Categories</h3>
        <p className="text-xs text-gray-500">Click to jump to findings</p>
      </header>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((c) => (
          <CategoryCard key={c.id} category={c} onJump={onJump} />
        ))}
      </div>
    </section>
  );
}