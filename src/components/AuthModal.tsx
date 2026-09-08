import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Lock, Mail, KeyRound, AlertCircle, Database, CheckCircle, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  onLoginSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setErrorMsg('Supabase 환경 변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)가 설정되지 않았습니다.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMsg('회원가입이 완료되었습니다! 이메일 인증 후 로그인해주세요.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onLoginSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || '인증 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const sqlSchemaScript = `
-- 1. quotes 테이블 생성 (Supabase SQL Editor에서 실행)
create table if not exists public.quotes (
  quote_id text primary key,
  pr_no text not null,
  item_code text not null,
  item_name text not null,
  supplier text not null,
  unit text not null,
  qty numeric not null,
  unit_price numeric,
  currency text not null default 'KRW',
  quote_date date not null,
  required_date date not null,
  promised_date date,
  status text not null default '견적',
  remark text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. RLS 활성화
alter table public.quotes enable row level security;

-- 3. 인증된 사용자 접근 정책 생성
create policy "Enable all access for authenticated users" on public.quotes
  for all to authenticated using (true) with check (true);
  `.trim();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="bg-blue-600 px-6 py-6 text-white text-center">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">구매 견적 판정 시스템 로그인</h2>
          <p className="text-blue-100 text-xs mt-1">Supabase 인가된 사용자만 접근할 수 있습니다</p>
        </div>

        <div className="p-6 space-y-4">
          {!isSupabaseConfigured && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-2">
              <div className="flex items-center font-semibold">
                <AlertCircle className="w-4 h-4 mr-1.5 shrink-0 text-amber-600" />
                <span>Supabase 연결 설정 필요</span>
              </div>
              <p className="text-slate-600">
                .env 파일에 <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_URL</code>과 <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_ANON_KEY</code>를 입력해 주세요.
              </p>
              <button
                type="button"
                onClick={() => setShowSqlGuide(!showSqlGuide)}
                className="text-blue-600 hover:underline font-medium inline-flex items-center"
              >
                <Database className="w-3.5 h-3.5 mr-1" />
                {showSqlGuide ? 'SQL 스키마 숨기기' : 'Supabase SQL 가이드 보기'}
              </button>
            </div>
          )}

          {showSqlGuide && (
            <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto space-y-2">
              <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-1">
                <span>Supabase SQL Editor 실행 스크립트</span>
                <button
                  onClick={() => navigator.clipboard.writeText(sqlSchemaScript)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px]"
                >
                  복사하기
                </button>
              </div>
              <pre className="whitespace-pre-wrap">{sqlSchemaScript}</pre>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">이메일 주소</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="user@company.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">비밀번호</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isSupabaseConfigured}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2"
            >
              <span>{loading ? '처리 중...' : isSignUp ? '회원가입하기' : '로그인하기'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {isSignUp ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'}
            </span>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:underline font-semibold"
            >
              {isSignUp ? '로그인으로 전환' : '회원가입 하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
