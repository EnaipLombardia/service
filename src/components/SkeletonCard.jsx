export default function SkeletonCard() {
  return (
    <div className="p-3 border-b animate-pulse">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-1"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      </div>
    </div>
  );
}
