import React from 'react';
import { FileSpreadsheet, Plus, RotateCcw, Upload, FileText, LogOut, User } from 'lucide-react';

interface HeaderProps {
  totalCount: number;
  userEmail?: string | null;
  onOpenImport: () => void;
  onOpenAdd: () => void;
  onResetDefault: () => void;
  onExportCsv: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalCount,
  userEmail,
  onOpenImport,
  onOpenAdd,
  onResetDefault,
  onExportCsv,
  onLogout,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">구매 견적 비교·납기 판정기</h1>
            <p className="text-xs text-slate-500">PR별 복수 공급사 견적 최저가 선정 및 납기 자동 판정시스템</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {userEmail && (
            <span className="hidden lg:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <User className="w-3.5 h-3.5 mr-1 text-blue-500" />
              {userEmail}
            </span>
          )}

          <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            총 {totalCount}건
          </span>

          <button
            onClick={onOpenImport}
            className="inline-flex items-center px-3 py-2 border border-slate-300 text-xs font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs"
            title="CSV 파일 반입 또는 텍스트 붙여넣기"
          >
            <Upload className="w-4 h-4 mr-1.5 text-slate-500" />
            반입·파싱
          </button>

          <button
            onClick={onExportCsv}
            className="inline-flex items-center px-3 py-2 border border-slate-300 text-xs font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs"
            title="현재 목록 CSV 다운로드"
          >
            <FileText className="w-4 h-4 mr-1.5 text-slate-500" />
            내보내기
          </button>

          <button
            onClick={onResetDefault}
            className="inline-flex items-center px-3 py-2 border border-slate-200 text-xs font-medium rounded-lg text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
            title="기본 샘플 데이터(80건)로 초기화"
          >
            <RotateCcw className="w-4 h-4 mr-1.5 text-slate-500" />
            샘플 초기화
          </button>

          <button
            onClick={onOpenAdd}
            className="inline-flex items-center px-3.5 py-2 border border-transparent text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            견적 등록
          </button>

          <button
            onClick={onLogout}
            className="inline-flex items-center px-2.5 py-2 border border-slate-200 text-xs font-medium rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="로그아웃"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
