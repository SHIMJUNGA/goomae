import React, { useState, useEffect } from 'react';
import { QuoteRaw, ProcessedQuote } from '../types';
import { X, Save, Trash2 } from 'lucide-react';

interface QuoteFormModalProps {
  quoteToEdit?: ProcessedQuote | null;
  onClose: () => void;
  onSave: (quote: QuoteRaw, isEdit: boolean) => void;
  onDelete?: (quoteId: string) => void;
}

export const QuoteFormModal: React.FC<QuoteFormModalProps> = ({
  quoteToEdit,
  onClose,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<QuoteRaw>({
    quote_id: `QT-${Math.floor(100 + Math.random() * 900)}`,
    pr_no: 'PR-2026-100',
    item_code: 'IT-001',
    item_name: 'MTBE 수입품',
    supplier: '신규공급사',
    unit: 't',
    qty: 10,
    unit_price: 800000,
    currency: 'KRW',
    quote_date: new Date().toISOString().split('T')[0],
    required_date: '2026-10-01',
    promised_date: '2026-09-25',
    status: '견적',
    remark: '',
  });

  useEffect(() => {
    if (quoteToEdit) {
      setFormData({
        quote_id: quoteToEdit.quote_id,
        pr_no: quoteToEdit.pr_no,
        item_code: quoteToEdit.item_code,
        item_name: quoteToEdit.item_name,
        supplier: quoteToEdit.supplier,
        unit: quoteToEdit.unit,
        qty: quoteToEdit.qty,
        unit_price: quoteToEdit.unit_price,
        currency: quoteToEdit.currency || 'KRW',
        quote_date: quoteToEdit.quote_date,
        required_date: quoteToEdit.required_date,
        promised_date: quoteToEdit.promised_date,
        status: quoteToEdit.status,
        remark: quoteToEdit.remark || '',
      });
    }
  }, [quoteToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, !!quoteToEdit);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900">
            {quoteToEdit ? `견적 수정 (${quoteToEdit.quote_id})` : '신규 견적 등록'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">견적 ID (고유키)</label>
              <input
                type="text"
                required
                disabled={!!quoteToEdit}
                value={formData.quote_id}
                onChange={e => setFormData({ ...formData, quote_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 disabled:text-slate-400 font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">PR 번호 (그룹키)</label>
              <input
                type="text"
                required
                value={formData.pr_no}
                onChange={e => setFormData({ ...formData, pr_no: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">품목 코드</label>
              <input
                type="text"
                required
                value={formData.item_code}
                onChange={e => setFormData({ ...formData, item_code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">품목명</label>
              <input
                type="text"
                required
                value={formData.item_name}
                onChange={e => setFormData({ ...formData, item_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">공급사</label>
              <input
                type="text"
                required
                value={formData.supplier}
                onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">수량</label>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                value={formData.qty}
                onChange={e => setFormData({ ...formData, qty: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">단위</label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">단가 (KRW, 공란 가능)</label>
              <input
                type="number"
                value={formData.unit_price !== null ? formData.unit_price : ''}
                onChange={e => setFormData({
                  ...formData,
                  unit_price: e.target.value === '' ? null : parseFloat(e.target.value)
                })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">상태</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as '견적' | '발주' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="견적">견적</option>
                <option value="발주">발주</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">견적 접수일</label>
              <input
                type="date"
                required
                value={formData.quote_date}
                onChange={e => setFormData({ ...formData, quote_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">요청 필요일</label>
              <input
                type="date"
                required
                value={formData.required_date}
                onChange={e => setFormData({ ...formData, required_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">약속 납기일 (공란 가능)</label>
              <input
                type="date"
                value={formData.promised_date || ''}
                onChange={e => setFormData({ ...formData, promised_date: e.target.value || null })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">비고</label>
            <input
              type="text"
              value={formData.remark || ''}
              onChange={e => setFormData({ ...formData, remark: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {quoteToEdit && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('정말 이 견적을 삭제하시겠습니까?')) {
                    onDelete(quoteToEdit.quote_id);
                  }
                }}
                className="inline-flex items-center px-3 py-2 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors font-medium"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                삭제
              </button>
            ) : <div />}

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
              >
                취소
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-xs"
              >
                <Save className="w-4 h-4 mr-1" />
                저장
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
