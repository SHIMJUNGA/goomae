import React, { useState } from 'react';
import { QuoteRaw } from '../types';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';

interface ImportModalProps {
  onClose: () => void;
  onImportQuotes: (quotes: QuoteRaw[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  onClose,
  onImportQuotes,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const [pastedText, setPastedText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        parseAndImport(text);
      } catch (err: any) {
        setErrorMsg('파일 파싱 중 오류가 발생했습니다: ' + err.message);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handlePasteImport = () => {
    if (!pastedText.trim()) {
      setErrorMsg('붙여넣은 텍스트가 비어 있습니다.');
      return;
    }
    parseAndImport(pastedText);
  };

  const parseAndImport = (csvText: string) => {
    setErrorMsg(null);
    const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) {
      setErrorMsg('유효한 CSV 데이터가 부족합니다 (헤더 + 최소 1행 필요).');
      return;
    }

    // Detect separator (comma or tab)
    const firstLine = lines[0];
    const separator = firstLine.includes('\t') ? '\t' : ',';

    const headers = firstLine.split(separator).map(h => h.trim().replace(/^["']|["']$/g, ''));
    
    // Required headers check
    const required = ['quote_id', 'pr_no', 'item_code', 'item_name', 'supplier', 'unit', 'qty', 'status'];
    const missing = required.filter(r => !headers.includes(r));
    if (missing.length > 0) {
      setErrorMsg(`필수 컬럼이 누락되었습니다: ${missing.join(', ')}`);
      return;
    }

    const parsed: QuoteRaw[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (i > 1000) {
        // Limit to 1000 rows as per PRD
        break;
      }
      const row = lines[i].split(separator).map(val => val.trim().replace(/^["']|["']$/g, ''));
      if (row.length < headers.length) continue;

      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = row[idx] !== undefined ? row[idx] : '';
      });

      // Format types
      const quote: QuoteRaw = {
        quote_id: obj.quote_id || `QT-${i}`,
        pr_no: obj.pr_no || 'PR-UNKNOWN',
        item_code: obj.item_code || 'IT-001',
        item_name: obj.item_name || '품목명',
        supplier: obj.supplier || '공급사',
        unit: obj.unit || 'EA',
        qty: parseFloat(obj.qty) || 1,
        unit_price: obj.unit_price === '' || obj.unit_price === '-' || obj.unit_price === 'N/A' || obj.unit_price === undefined ? null : parseFloat(obj.unit_price),
        currency: obj.currency || 'KRW',
        quote_date: obj.quote_date || new Date().toISOString().split('T')[0],
        required_date: obj.required_date || new Date().toISOString().split('T')[0],
        promised_date: obj.promised_date === '' || obj.promised_date === '-' || obj.promised_date === undefined ? null : obj.promised_date,
        status: obj.status === '발주' ? '발주' : '견적',
        remark: obj.remark || '',
      };

      parsed.push(quote);
    }

    if (parsed.length === 0) {
      setErrorMsg('반입할 수 있는 유효한 데이터 행이 없습니다.');
      return;
    }

    onImportQuotes(parsed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900">견적 데이터 반입 (CSV / 텍스트)</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 pt-2 space-x-4 bg-slate-50/50 text-xs">
          <button
            onClick={() => { setActiveTab('file'); setErrorMsg(null); }}
            className={`pb-2.5 font-semibold border-b-2 transition-colors ${
              activeTab === 'file' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            CSV 파일 업로드
          </button>
          <button
            onClick={() => { setActiveTab('paste'); setErrorMsg(null); }}
            className={`pb-2.5 font-semibold border-b-2 transition-colors ${
              activeTab === 'paste' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            텍스트 붙여넣기
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'file' ? (
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50/50 transition-colors">
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="font-semibold text-slate-700 mb-1">CSV 파일을 선택하거나 여기에 드래그하세요</p>
              <p className="text-slate-400 mb-4 text-[11px]">UTF-8 인코딩, 첫 행 헤더 필수 (quote_id, pr_no 등)</p>
              <label className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg cursor-pointer transition-colors shadow-xs">
                <span>파일 찾아보기</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block font-medium text-slate-700">ERP 내보내기 CSV 또는 탭 구분 텍스트 붙여넣기</label>
              <textarea
                rows={8}
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder="quote_id,pr_no,item_code,item_name,supplier,unit,qty,unit_price,currency,quote_date,required_date,promised_date,status,remark&#10;QT-001,PR-2026-001,IT-001,MTBE 수입품,유진테크,t,5,,KRW,2026-08-05,2026-09-07,2026-08-29,견적,"
                className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <div className="flex justify-end">
                <button
                  onClick={handlePasteImport}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-xs"
                >
                  반입 및 적용
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
          <span>최대 1,000행 처리 지원</span>
          <button onClick={onClose} className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium">
            취소
          </button>
        </div>
      </div>
    </div>
  );
};
