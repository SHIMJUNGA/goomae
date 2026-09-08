import React from 'react';
import { AlertTriangle, Clock, AlertCircle, FileQuestion, Layers, CheckCircle2 } from 'lucide-react';
import { ProcessedQuote } from '../types';

interface DashboardCardsProps {
  quotes: ProcessedQuote[];
  activeFilter: string;
  onSelectFilter: (filterKey: string) => void;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({
  quotes,
  activeFilter,
  onSelectFilter,
}) => {
  const delayCount = quotes.filter(q => q.deliveryState === '지연').length;
  const imminentCount = quotes.filter(q => q.deliveryState === '임박').length;
  const outlierCount = quotes.filter(q => q.priceState === '이상치').length;
  const namingVarianceCount = quotes.filter(q => q.hasNamingVariance).length;
  const missingCount = quotes.filter(q => q.priceState === '단가 미기재' || q.deliveryState === '납기 미기재').length;

  const cards = [
    {
      id: 'ALL',
      title: '전체 견적',
      count: quotes.length,
      icon: Layers,
      color: 'border-slate-200 bg-white text-slate-900',
      activeColor: 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/50',
      badgeBg: 'bg-slate-100 text-slate-700',
    },
    {
      id: '지연',
      title: '납기 지연 (발주건)',
      count: delayCount,
      icon: AlertTriangle,
      color: 'border-red-200 bg-white text-red-900',
      activeColor: 'ring-2 ring-red-500 border-red-500 bg-red-50/60',
      badgeBg: 'bg-red-100 text-red-700',
      highlight: delayCount > 0,
    },
    {
      id: '임박',
      title: '납기 임박 (0~7일)',
      count: imminentCount,
      icon: Clock,
      color: 'border-amber-200 bg-white text-amber-900',
      activeColor: 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/60',
      badgeBg: 'bg-amber-100 text-amber-700',
      highlight: imminentCount > 0,
    },
    {
      id: '이상치',
      title: '단가 이상치 (±30%초과)',
      count: outlierCount,
      icon: AlertCircle,
      color: 'border-rose-200 bg-white text-rose-900',
      activeColor: 'ring-2 ring-rose-500 border-rose-500 bg-rose-50/60',
      badgeBg: 'bg-rose-100 text-rose-700',
      highlight: outlierCount > 0,
    },
    {
      id: '표기상이',
      title: '품목명 표기 상이',
      count: namingVarianceCount,
      icon: FileQuestion,
      color: 'border-purple-200 bg-white text-purple-900',
      activeColor: 'ring-2 ring-purple-500 border-purple-500 bg-purple-50/60',
      badgeBg: 'bg-purple-100 text-purple-700',
      highlight: namingVarianceCount > 0,
    },
    {
      id: '단가미기재',
      title: '결측/미기재',
      count: missingCount,
      icon: CheckCircle2,
      color: 'border-slate-200 bg-white text-slate-800',
      activeColor: 'ring-2 ring-slate-500 border-slate-500 bg-slate-100/60',
      badgeBg: 'bg-slate-200 text-slate-800',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {cards.map(card => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;

        return (
          <button
            key={card.id}
            onClick={() => onSelectFilter(card.id)}
            className={`text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-sm ${
              isActive ? card.activeColor : card.color
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 truncate">{card.title}</span>
              <div className={`p-1.5 rounded-lg ${card.badgeBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight">{card.count}</span>
              <span className="text-[11px] text-slate-600 font-medium">건</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
