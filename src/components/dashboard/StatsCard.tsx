import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const variantStyles = {
  default: {
    bg: 'bg-card',
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
  },
  primary: {
    bg: 'bg-card',
    iconBg: 'bg-primary-light',
    iconColor: 'text-primary',
  },
  success: {
    bg: 'bg-card',
    iconBg: 'bg-success-light',
    iconColor: 'text-success',
  },
  warning: {
    bg: 'bg-card',
    iconBg: 'bg-warning-light',
    iconColor: 'text-warning',
  },
  danger: {
    bg: 'bg-card',
    iconBg: 'bg-danger-light',
    iconColor: 'text-danger',
  },
  info: {
    bg: 'bg-card',
    iconBg: 'bg-info-light',
    iconColor: 'text-info',
  },
};

const StatsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  variant = 'default',
  className 
}: StatsCardProps) => {
  const styles = variantStyles[variant];

  return (
    <div 
      className={cn(
        'rounded-xl border border-border p-6 shadow-card transition-all duration-200 hover:shadow-lg animate-fade-in',
        styles.bg,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-sm font-medium',
              trend.isPositive ? 'text-success' : 'text-danger'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground font-normal">vs mois dernier</span>
            </div>
          )}
        </div>
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          styles.iconBg
        )}>
          <Icon className={cn('w-6 h-6', styles.iconColor)} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
