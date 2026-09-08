import React from 'react';
import { ProcessedQuote } from '../types';
import { AlertTriangle, Clock, AlertCircle, FileQuestion, CheckCircle2, ChevronRight, ExternalLink } from 'lucide-react';

interface QuoteTableProps {
  quotes: ProcessedQuote[];
  groupByPr: boolean;
  onSelectPr: (prNo: string) => void;
  onEditQuote: (quote: ProcessedQuote) => void;
}

export const QuoteTable: React.FC<QuoteTableProps> = ({
  quotes,
  groupByPr,
  onSelectPr,
  onEditQuote,
}) => {
  if (quotes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <FileQuestion className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-700 mb-1">조회된 견적 데이터가 없습니다</h3>
        <p className="text-xs text-slate-500">검색 조건을 변경하거나 새로운 견적 파일을 반입해 주세요.</p>
      </div>
    );
  }

  // If grouped by PR
  if (groupByPr) {
    const prGroups = new Map<string, ProcessedQuote[]>();
    quotes.forEach(q => {
      if (!prGroups.has(q.pr_no)) {
        prGroups.set(q.pr_no, []);
      }
      prGroups.get(q.pr_no)!.push(q);
    });

    const groupEntries = Array.from(prGroups.entries());

    return (
      <div className="space-y-4">
        {groupEntries.map(([prNo, groupQuotes]) => {
          const first = groupQuotes[0];
          const hasOrder = groupQuotes.some(q => q.status === '발주');
          const hasDelay = groupQuotes.some(q => q.deliveryState === '지연');
          const hasImminent = groupQuotes.some(q => q.deliveryState === '임박');
          const hasOutlier = groupQuotes.some(q => q.priceState === '이상치');

          return (
            <div key={prNo} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-slate-900 text-sm">{prNo}</span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-semibold">
                    {first.item_code} / {first.item_name}
                  </span>
                  <span className="text-xs text-slate-500">수량: {first.qty} {first.unit}</span>
                  {first.hasNamingVariance && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-100 text-purple-700 border border-purple-200" title="동일 품목코드 내 품목명 표기 상이">
                      표기 상이
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1.5">
                    {hasDelay && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-700">지연</span>
                    )}
                    {hasImminent && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-700">임박</span>
                    )}
                    {hasOutlier && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-700">이상치</span>
                    )}
                  </div>
                  <button
                    onClick={() => onSelectPr(prNo)}
                    className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
                  >
                    PR 비교 상세
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-100 font-medium">
                    <tr>
                      <th className="py-2.5 px-4">견적ID</th>
                      <th className="py-2.5 px-4">공급사</th>
                      <th className="py-2.5 px-4 text-right">단가 (KRW)</th>
                      <th className="py-2.5 px-4 text-center">중앙값 편차</th>
                      <th className="py-2.5 px-4 text-center">상태</th>
                      <th className="py-2.5 px-4">약속납기</th>
                      <th className="py-2.5 px-4 text-center">납기 판정</th>
                      <th className="py-2.5 px-4">비고</th>
                      <th className="py-2.5 px-4 text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {groupQuotes.map(q => renderQuoteRow(q, onSelectPr, onEditQuote))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Flat list view
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
            <tr>
              <th className="py-3 px-4">PR번호</th>
              <th className="py-3 px-4">품목코드 / 명칭</th>
              <th className="py-3 px-4">공급사</th>
              <th className="py-3 px-4 text-right">수량</th>
              <th className="py-3 px-4 text-right">단가 (KRW)</th>
              <th className="py-3 px-4 text-center">중앙값 편차</th>
              <th className="py-3 px-4 text-center">상태</th>
              <th className="py-3 px-4">약속납기</th>
              <th className="py-3 px-4 text-center">납기 판정</th>
              <th className="py-3 px-4">비고</th>
              <th className="py-3 px-4 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {quotes.map(q => renderQuoteRowFlat(q, onSelectPr, onEditQuote))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function renderQuoteRow(q: ProcessedQuote, onSelectPr: (pr: string) => void, onEdit: (q: ProcessedQuote) => void) {
  return (
    <tr key={q.quote_id} className="hover:bg-slate-50/80 transition-colors">
      <td className="py-3 px-4 font-mono font-medium text-slate-700">{q.quote_id}</td>
      <td className="py-3 px-4 font-medium text-slate-800 flex items-center space-x-1.5">
        <span>{q.supplier}</span>
        {q.isLowest && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200" title="PR 내 최저가 후보">
            최저가
          </span>
        )}
      </td>
      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
        {q.unit_price !== null ? q.unit_price.toLocaleString() : <span className="text-slate-400 font-normal">공란</span>}
      </td>
      <td className="py-3 px-4 text-center">
        {q.priceState === '이상치' ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-700">
            이상치 ({q.deviationPercent !== null && q.deviationPercent > 0 ? `+${q.deviationPercent}%` : `${q.deviationPercent}%`})
          </span>
        ) : q.priceState === '비교 불가' ? (
          <span className="text-slate-400">비교불가</span>
        ) : q.priceState === '단가 미기재' ? (
          <span className="text-slate-400">미기재</span>
        ) : (
          <span className="text-slate-600">
            {q.deviationPercent !== null ? (q.deviationPercent > 0 ? `+${q.deviationPercent}%` : `${q.deviationPercent}%`) : '-'}
          </span>
        )}
      </td>
      <td className="py-3 px-4 text-center">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
          q.status === '발주' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
        }`}>
          {q.status}
        </span>
      </td>
      <td className="py-3 px-4 font-mono text-slate-600">
        {q.promised_date || <span className="text-slate-400">공란</span>}
      </td>
      <td className="py-3 px-4 text-center">
        {q.deliveryState === '지연' && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700">
            지연 (D{q.deliveryDays})
          </span>
        )}
        {q.deliveryState === '임박' && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
            임박 ({q.deliveryDays === 0 ? 'D-DAY' : `D-${q.deliveryDays}`})
          </span>
        )}
        {q.deliveryState === '정상' && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
            정상 (D+{q.deliveryDays})
          </span>
        )}
        {q.deliveryState === '납기 미기재' && (
          <span className="text-slate-400">납기 미기재</span>
        )}
        {q.deliveryState === '판정 대상 아님' && (
          <span className="text-slate-400">-</span>
        )}
      </td>
      <td className="py-3 px-4 text-slate-500 truncate max-w-[140px]" title={q.remark}>
        {q.remark || '-'}
      </td>
      <td className="py-3 px-4 text-right">
        <button
          onClick={() => onEdit(q)}
          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
        >
          수정
        </button>
      </td>
    </tr>
  );
}

function renderQuoteRowFlat(q: ProcessedQuote, onSelectPr: (pr: string) => void, onEdit: (q: ProcessedQuote) => void) {
  return (
    <tr key={q.quote_id} className="hover:bg-slate-50/80 transition-colors">
      <td className="py-3 px-4 font-mono font-bold text-blue-600">
        <button onClick={() => onSelectPr(q.pr_no)} className="hover:underline flex items-center">
          {q.pr_no}
        </button>
      </td>
      <td className="py-3 px-4">
        <div className="font-medium text-slate-800">{q.item_name}</div>
        <div className="text-[11px] text-slate-400 font-mono">{q.item_code}</div>
      </td>
      <td className="py-3 px-4 font-medium text-slate-800 flex items-center space-x-1.5">
        <span>{q.supplier}</span>
        {q.isLowest && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200" title="PR 내 최저가 후보">
            최저가
          </span>
        )}
      </td>
      <td className="py-3 px-4 text-right font-mono text-slate-600">{q.qty} {q.unit}</td>
      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
        {q.unit_price !== null ? q.unit_price.toLocaleString() : <span className="text-slate-400 font-normal">공란</span>}
      </td>
      <td className="py-3 px-4 text-center">
        {q.priceState === '이상치' ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-700">
            이상치 ({q.deviationPercent !== null && q.deviationPercent > 0 ? `+${q.deviationPercent}%` : `${q.deviationPercent}%`})
          </span>
        ) : q.priceState === '비교 불가' ? (
          <span className="text-slate-400">비교불가</span>
        ) : q.priceState === '단가 미기재' ? (
          <span className="text-slate-400">미기재</span>
        ) : (
          <span className="text-slate-600">
            {q.deviationPercent !== null ? (q.deviationPercent > 0 ? `+${q.deviationPercent}%` : `${q.deviationPercent}%`) : '-'}
          </span>
        )}
      </td>
      <td className="py-3 px-4 text-center">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
          q.status === '발주' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
        }`}>
          {q.status}
        </span>
      </td>
      <td className="py-3 px-4 font-mono text-slate-600">
        {q.promised_date || <span className="text-slate-400">공란</span>}
      </td>
      <td className="py-3 px-4 text-center">
        {q.deliveryState === '지연' && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700">
            지연 (D{q.deliveryDays})
          </span>
        )}
        {q.deliveryState === '임박' && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
            임박 ({q.deliveryDays === 0 ? 'D-DAY' : `D-${q.deliveryDays}`})
          </span>
        )}
        {q.deliveryState === '정상' && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
            정상 (D+{q.deliveryDays})
          </span>
        )}
        {q.deliveryState === '납기 미기재' && (
          <span className="text-slate-400">납기 미기재</span>
        )}
        {q.deliveryState === '판정 대상 아님' && (
          <span className="text-slate-400">-</span>
        )}
      </td>
      <td className="py-3 px-4 text-slate-500 truncate max-w-[120px]" title={q.remark}>
        {q.remark || '-'}
      </td>
      <td className="py-3 px-4 text-right">
        <button
          onClick={() => onEdit(q)}
          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
        >
          수정
        </button>
      </td>
    </tr>
  );
}
