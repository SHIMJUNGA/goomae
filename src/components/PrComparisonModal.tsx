import React, { useState } from 'react';
import { ProcessedQuote } from '../types';
import { X, Copy, Check, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';

interface PrComparisonModalProps {
  prNo: string;
  quotes: ProcessedQuote[];
  onClose: () => void;
  onUpdateStatus: (quoteId: string, newStatus: '견적' | '발주') => void;
}

export const PrComparisonModal: React.FC<PrComparisonModalProps> = ({
  prNo,
  quotes,
  onClose,
  onUpdateStatus,
}) => {
  const [copied, setCopied] = useState(false);
  const prQuotes = quotes.filter(q => q.pr_no === prNo);

  if (prQuotes.length === 0) return null;

  const first = prQuotes[0];
  const orderQuotes = prQuotes.filter(q => q.status === '발주');
  const lowestQuote = prQuotes.find(q => q.isLowest);

  const handleCopyTable = () => {
    const headers = ['견적ID', '공급사', '단가(KRW)', '편차율', '상태', '약속납기', '납기판정', '비고'];
    const rows = prQuotes.map(q => [
      q.quote_id,
      q.supplier,
      q.unit_price !== null ? q.unit_price.toLocaleString() : '공란',
      q.deviationPercent !== null ? `${q.deviationPercent}%` : '-',
      q.status,
      q.promised_date || '공란',
      q.deliveryState,
      q.remark || ''
    ]);

    const text = [
      `[PR 비교표] ${prNo} (${first.item_code} / ${first.item_name}, 수량: ${first.qty} ${first.unit})`,
      headers.join('\t'),
      ...rows.map(r => r.join('\t'))
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-slate-900">{prNo}</span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                {first.item_code} / {first.item_name}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">요청 수량: {first.qty} {first.unit} | 필요일: {first.required_date}</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyTable}
              className="inline-flex items-center px-3 py-1.5 border border-slate-300 text-xs font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 mr-1 text-emerald-600" /> : <Copy className="w-4 h-4 mr-1 text-slate-500" />}
              {copied ? '복사 완료!' : '비교표 클립보드 복사'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notices */}
        <div className="px-6 py-3 bg-blue-50/50 border-b border-blue-100 text-xs text-blue-900 flex flex-col gap-1">
          {orderQuotes.length === 0 && (
            <div className="flex items-center text-amber-800">
              <AlertTriangle className="w-4 h-4 mr-1.5 shrink-0" />
              <span>현재 이 PR에 <strong>발주</strong> 상태인 견적이 없습니다. 공급사를 확정하고 상태를 변경해 주세요.</span>
            </div>
          )}
          {orderQuotes.length > 1 && (
            <div className="flex items-center text-rose-800">
              <ShieldAlert className="w-4 h-4 mr-1.5 shrink-0" />
              <span>경고: 이 PR에 <strong>발주</strong> 건이 2건 이상 존재합니다. 확인이 필요합니다.</span>
            </div>
          )}
          {lowestQuote && orderQuotes.length === 1 && orderQuotes[0].quote_id !== lowestQuote.quote_id && (
            <div className="flex items-center text-amber-800">
              <AlertTriangle className="w-4 h-4 mr-1.5 shrink-0" />
              <span>안내: 현재 발주 건({orderQuotes[0].supplier})이 최저가 후보({lowestQuote.supplier})와 다릅니다.</span>
            </div>
          )}
        </div>

        {/* Table content */}
        <div className="p-6 overflow-y-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
              <tr>
                <th className="py-2.5 px-3">견적ID</th>
                <th className="py-2.5 px-3">공급사</th>
                <th className="py-2.5 px-3 text-right">단가 (KRW)</th>
                <th className="py-2.5 px-3 text-center">중앙값 편차</th>
                <th className="py-2.5 px-3 text-center">최저가 여부</th>
                <th className="py-2.5 px-3">견적접수일</th>
                <th className="py-2.5 px-3">약속납기</th>
                <th className="py-2.5 px-3 text-center">납기판정</th>
                <th className="py-2.5 px-3 text-center">상태 관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prQuotes.map(q => (
                <tr key={q.quote_id} className={q.isLowest ? 'bg-blue-50/40' : ''}>
                  <td className="py-3 px-3 font-mono font-medium text-slate-700">{q.quote_id}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900">{q.supplier}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {q.unit_price !== null ? q.unit_price.toLocaleString() : <span className="text-slate-400 font-normal">공란</span>}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {q.priceState === '이상치' ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-700">
                        이상치 ({q.deviationPercent !== null && q.deviationPercent > 0 ? `+${q.deviationPercent}%` : `${q.deviationPercent}%`})
                      </span>
                    ) : (
                      <span>{q.deviationPercent !== null ? (q.deviationPercent > 0 ? `+${q.deviationPercent}%` : `${q.deviationPercent}%`) : '-'}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {q.isLowest ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                        최저가 후보
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">{q.quote_date}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">{q.promised_date || '공란'}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      q.deliveryState === '지연' ? 'bg-red-100 text-red-700 font-bold' :
                      q.deliveryState === '임박' ? 'bg-amber-100 text-amber-800 font-bold' :
                      q.deliveryState === '정상' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {q.deliveryState} {q.deliveryDays !== null ? `(D${q.deliveryDays >= 0 ? `-${q.deliveryDays}` : `+${Math.abs(q.deliveryDays)}`})` : ''}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <select
                      value={q.status}
                      onChange={e => onUpdateStatus(q.quote_id, e.target.value as '견적' | '발주')}
                      className={`py-1 px-2 rounded text-xs font-semibold border ${
                        q.status === '발주' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-slate-50 border-slate-300 text-slate-700'
                      }`}
                    >
                      <option value="견적">견적</option>
                      <option value="발주">발주</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
