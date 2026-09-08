import React from 'react';
import { Search, Filter, Group, List } from 'lucide-react';
import { FilterState } from '../types';

interface FilterBarProps {
  filter: FilterState;
  onFilterChange: (updated: Partial<FilterState>) => void;
  uniqueItemCodes: string[];
  uniqueSuppliers: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onFilterChange,
  uniqueItemCodes,
  uniqueSuppliers,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 space-y-3">
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filter.searchQuery}
            onChange={e => onFilterChange({ searchQuery: e.target.value })}
            placeholder="PR번호, 품목명, 공급사 검색..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status filter */}
          <div className="flex items-center space-x-1">
            <span className="text-xs font-medium text-slate-500">상태:</span>
            <select
              value={filter.statusFilter}
              onChange={e => onFilterChange({ statusFilter: e.target.value as any })}
              className="py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">전체 상태</option>
              <option value="견적">견적</option>
              <option value="발주">발주</option>
            </select>
          </div>

          {/* Judgment filter */}
          <div className="flex items-center space-x-1">
            <span className="text-xs font-medium text-slate-500">판정:</span>
            <select
              value={filter.judgmentFilter}
              onChange={e => onFilterChange({ judgmentFilter: e.target.value as any })}
              className="py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">전체 판정</option>
              <option value="지연">지연</option>
              <option value="임박">임박</option>
              <option value="이상치">이상치</option>
              <option value="표기상이">표기 상이</option>
              <option value="단가미기재">단가 미기재</option>
              <option value="납기미기재">납기 미기재</option>
            </select>
          </div>

          {/* Item code filter */}
          <div className="flex items-center space-x-1">
            <span className="text-xs font-medium text-slate-500">품목:</span>
            <select
              value={filter.itemFilter}
              onChange={e => onFilterChange({ itemFilter: e.target.value })}
              className="py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">전체 품목</option>
              {uniqueItemCodes.map(code => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier filter */}
          <div className="flex items-center space-x-1">
            <span className="text-xs font-medium text-slate-500">공급사:</span>
            <select
              value={filter.supplierFilter}
              onChange={e => onFilterChange({ supplierFilter: e.target.value })}
              className="py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">전체 공급사</option>
              {uniqueSuppliers.map(sup => (
                <option key={sup} value={sup}>
                  {sup}
                </option>
              ))}
            </select>
          </div>

          {/* Group toggle */}
          <button
            onClick={() => onFilterChange({ groupByPr: !filter.groupByPr })}
            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filter.groupByPr
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {filter.groupByPr ? <Group className="w-3.5 h-3.5 mr-1" /> : <List className="w-3.5 h-3.5 mr-1" />}
            {filter.groupByPr ? 'PR별 그룹보기' : '전체 목록보기'}
          </button>
        </div>
      </div>
    </div>
  );
};
