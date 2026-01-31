interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  className = '',
}: StatsCardProps) {
  const trendColors = {
    up: 'text-success',
    down: 'text-error',
    neutral: 'text-base-content',
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    neutral: '→',
  };

  return (
    <div className={`stat bg-base-200 rounded-lg ${className}`}>
      {icon && <div className="stat-figure text-3xl">{icon}</div>}
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
      {description && <div className="stat-desc">{description}</div>}
      {trend && trendValue && (
        <div className={`stat-desc ${trendColors[trend]}`}>
          {trendIcons[trend]} {trendValue}
        </div>
      )}
    </div>
  );
}

interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}

export function StatsGrid({ children, columns = 3 }: StatsGridProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid grid-cols-1 ${gridCols[columns]} gap-4`}>
      {children}
    </div>
  );
}
