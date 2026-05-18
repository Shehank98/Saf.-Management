import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: any;
  iconColor?: string;
  iconBg?: string;
  sub?: string;
  highlight?: boolean;
  className?: string;
  trend?: string;
  trendDir?: 'up' | 'down';
}

export function StatCard({
  label, value, icon: Icon, iconColor = '#2D6A4F', iconBg = '#E3EFE9',
  sub, highlight, className, trend, trendDir = 'up',
}: StatCardProps) {
  return (
    <div className={cn('pwa-stat-card', className)} style={highlight ? { borderColor: '#C6DDD1', background: '#E3EFE9' } : {}}>
      <div className="pwa-stat-ico" style={{ background: iconBg }}>
        <Icon size={16} color={iconColor} strokeWidth={2} />
      </div>
      <div className="pwa-stat-label">{label}</div>
      <div className="pwa-stat-value tnum">{value}</div>
      {(trend || sub) && (
        <div className={cn('pwa-stat-trend', trendDir)}>{trend || sub}</div>
      )}
    </div>
  );
}
