import React, { useState, useEffect, useMemo } from 'react';
import { QuoteRaw, ProcessedQuote, FilterState } from './types';
import { DEFAULT_QUOTES } from './data/defaultQuotes';
import { processQuotes } from './utils/calculations';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import { Header } from './components/Header';
import { DashboardCards } from './components/DashboardCards';
import { FilterBar } from './components/FilterBar';
import { QuoteTable } from './components/QuoteTable';
import { PrComparisonModal } from './components/PrComparisonModal';
import { QuoteFormModal } from './components/QuoteFormModal';
import { ImportModal } from './components/ImportModal';
import { AuthModal } from './components/AuthModal';
import { Cloud, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'exs02.quotes.v1';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [rawQuotes, setRawQuotes] = useState<QuoteRaw[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load from localStorage', e);
    }
    return DEFAULT_QUOTES;
  });

  const [filter, setFilter] = useState<FilterState>({
    searchQuery: '',
    statusFilter: 'ALL',
    judgmentFilter: 'ALL',
    itemFilter: 'ALL',
    supplierFilter: 'ALL',
    prFilter: 'ALL',
    groupByPr: false,
  });

  const [selectedPrNo, setSelectedPrNo] = useState<string | null>(null);
  const [editingQuote, setEditingQuote] = useState<ProcessedQuote | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // 1. Supabase Auth state observer
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session) {
        fetchQuotesFromSupabase();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchQuotesFromSupabase();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch quotes from Supabase database
  const fetchQuotesFromSupabase = async () => {
    if (!isSupabaseConfigured) return;
    try {
      setSyncing(true);
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('quote_id', { ascending: true });

      if (error) {
        console.error('Error fetching quotes from Supabase:', error);
      } else if (data && data.length > 0) {
        setRawQuotes(data);
      }
    } catch (err) {
      console.error('Supabase fetch exception:', err);
    } finally {
      setSyncing(false);
    }
  };

  // Save to localStorage & Supabase
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rawQuotes));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [rawQuotes]);

  // Upsert data to Supabase cumulatively
  const saveToSupabaseCumulative = async (quotesToSave: QuoteRaw[]) => {
    if (!isSupabaseConfigured || !session) return;
    try {
      setSyncing(true);
      const { error } = await supabase
        .from('quotes')
        .upsert(quotesToSave, { onConflict: 'quote_id' });

      if (error) {
        console.error('Error upserting quotes to Supabase:', error);
      }
    } catch (err) {
      console.error('Supabase upsert exception:', err);
    } finally {
      setSyncing(false);
    }
  };

  // Process all quotes with business logic
  const processedQuotes = useMemo(() => {
    return processQuotes(rawQuotes);
  }, [rawQuotes]);

  // Unique filter options
  const uniqueItemCodes = useMemo(() => {
    return Array.from(new Set(rawQuotes.map(q => q.item_code))).sort();
  }, [rawQuotes]);

  const uniqueSuppliers = useMemo(() => {
    return Array.from(new Set(rawQuotes.map(q => q.supplier))).sort();
  }, [rawQuotes]);

  // Filtered and sorted quotes
  const filteredQuotes = useMemo(() => {
    let list = [...processedQuotes];

    if (filter.searchQuery.trim()) {
      const q = filter.searchQuery.toLowerCase();
      list = list.filter(item =>
        item.pr_no.toLowerCase().includes(q) ||
        item.item_name.toLowerCase().includes(q) ||
        item.item_code.toLowerCase().includes(q) ||
        item.supplier.toLowerCase().includes(q) ||
        item.quote_id.toLowerCase().includes(q)
      );
    }

    if (filter.statusFilter !== 'ALL') {
      list = list.filter(item => item.status === filter.statusFilter);
    }

    if (filter.judgmentFilter !== 'ALL') {
      if (filter.judgmentFilter === '지연') {
        list = list.filter(item => item.deliveryState === '지연');
      } else if (filter.judgmentFilter === '임박') {
        list = list.filter(item => item.deliveryState === '임박');
      } else if (filter.judgmentFilter === '이상치') {
        list = list.filter(item => item.priceState === '이상치');
      } else if (filter.judgmentFilter === '표기상이') {
        list = list.filter(item => item.hasNamingVariance);
      } else if (filter.judgmentFilter === '단가미기재') {
        list = list.filter(item => item.priceState === '단가 미기재');
      } else if (filter.judgmentFilter === '납기미기재') {
        list = list.filter(item => item.deliveryState === '납기 미기재');
      }
    }

    if (filter.itemFilter !== 'ALL') {
      list = list.filter(item => item.item_code === filter.itemFilter);
    }

    if (filter.supplierFilter !== 'ALL') {
      list = list.filter(item => item.supplier === filter.supplierFilter);
    }

    list.sort((a, b) => {
      if (a.deliveryRank !== b.deliveryRank) {
        return a.deliveryRank - b.deliveryRank;
      }
      if (a.deliveryDays !== null && b.deliveryDays !== null && a.deliveryDays !== b.deliveryDays) {
        return a.deliveryDays - b.deliveryDays;
      }
      if (a.pr_no !== b.pr_no) {
        return a.pr_no.localeCompare(b.pr_no);
      }
      const pA = a.unit_price ?? Number.MAX_SAFE_INTEGER;
      const pB = b.unit_price ?? Number.MAX_SAFE_INTEGER;
      return pA - pB;
    });

    return list;
  }, [processedQuotes, filter]);

  // Handlers
  const handleResetDefault = async () => {
    if (confirm('기본 샘플 데이터(80건)로 초기화하시겠습니까?')) {
      setRawQuotes(DEFAULT_QUOTES);
      localStorage.removeItem(STORAGE_KEY);
      if (isSupabaseConfigured && session) {
        await saveToSupabaseCumulative(DEFAULT_QUOTES);
      }
    }
  };

  const handleExportCsv = () => {
    const headers = ['quote_id', 'pr_no', 'item_code', 'item_name', 'supplier', 'unit', 'qty', 'unit_price', 'currency', 'quote_date', 'required_date', 'promised_date', 'status', 'remark'];
    const rows = filteredQuotes.map(q => [
      q.quote_id,
      q.pr_no,
      q.item_code,
      `"${q.item_name}"`,
      q.supplier,
      q.unit,
      q.qty,
      q.unit_price !== null ? q.unit_price : '',
      q.currency,
      q.quote_date,
      q.required_date,
      q.promised_date || '',
      q.status,
      `"${q.remark || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `purchase_quotes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveQuote = async (saved: QuoteRaw, isEdit: boolean) => {
    let updatedList: QuoteRaw[];
    if (isEdit) {
      updatedList = rawQuotes.map(q => q.quote_id === saved.quote_id ? saved : q);
    } else {
      updatedList = [saved, ...rawQuotes];
    }
    setRawQuotes(updatedList);
    setEditingQuote(null);
    setIsAddModalOpen(false);

    // Save to Supabase cumulatively
    if (isSupabaseConfigured && session) {
      await saveToSupabaseCumulative([saved]);
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    setRawQuotes(prev => prev.filter(q => q.quote_id !== quoteId));
    setEditingQuote(null);

    if (isSupabaseConfigured && session) {
      try {
        await supabase.from('quotes').delete().eq('quote_id', quoteId);
      } catch (err) {
        console.error('Error deleting from Supabase:', err);
      }
    }
  };

  const handleUpdateStatus = async (quoteId: string, newStatus: '견적' | '발주') => {
    let targetQuote: QuoteRaw | undefined;
    setRawQuotes(prev => prev.map(q => {
      if (q.quote_id === quoteId) {
        targetQuote = { ...q, status: newStatus };
        return targetQuote;
      }
      return q;
    }));

    if (isSupabaseConfigured && session && targetQuote) {
      await saveToSupabaseCumulative([targetQuote]);
    }
  };

  // Cumulative import: merges imported quotes into existing quotes by quote_id (upsert)
  const handleImportQuotes = async (imported: QuoteRaw[]) => {
    const existingMap = new Map(rawQuotes.map(q => [q.quote_id, q]));
    imported.forEach(q => {
      existingMap.set(q.quote_id, q); // cumulative upsert
    });
    const merged = Array.from(existingMap.values());
    setRawQuotes(merged);

    if (isSupabaseConfigured && session) {
      await saveToSupabaseCumulative(imported);
    }
  };

  const handleDashboardCardSelect = (cardId: string) => {
    if (cardId === 'ALL') {
      setFilter(prev => ({ ...prev, judgmentFilter: 'ALL', statusFilter: 'ALL' }));
    } else if (cardId === '지연') {
      setFilter(prev => ({ ...prev, judgmentFilter: '지연', statusFilter: '발주' }));
    } else if (cardId === '임박') {
      setFilter(prev => ({ ...prev, judgmentFilter: '임박', statusFilter: '발주' }));
    } else if (cardId === '이상치') {
      setFilter(prev => ({ ...prev, judgmentFilter: '이상치' }));
    } else if (cardId === '표기상이') {
      setFilter(prev => ({ ...prev, judgmentFilter: '표기상이' }));
    } else if (cardId === '단가미기재') {
      setFilter(prev => ({ ...prev, judgmentFilter: '단가미기재' }));
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setSession(null);
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium text-slate-300">사용자 인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // Require Login if Supabase is configured and user is not logged in
  if (isSupabaseConfigured && !session) {
    return <AuthModal onLoginSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <Header
        totalCount={processedQuotes.length}
        userEmail={session?.user?.email || (isSupabaseConfigured ? null : '데모 모드 (Supabase 미연결)')}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenAdd={() => setIsAddModalOpen(true)}
        onResetDefault={handleResetDefault}
        onExportCsv={handleExportCsv}
        onLogout={handleLogout}
      />

      {syncing && (
        <div className="bg-blue-600 text-white px-4 py-1 text-center text-xs flex items-center justify-center space-x-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Supabase 데이터베이스와 동기화 중...</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DashboardCards
          quotes={processedQuotes}
          activeFilter={filter.judgmentFilter}
          onSelectFilter={handleDashboardCardSelect}
        />

        <FilterBar
          filter={filter}
          onFilterChange={(updated) => setFilter(prev => ({ ...prev, ...updated }))}
          uniqueItemCodes={uniqueItemCodes}
          uniqueSuppliers={uniqueSuppliers}
        />

        <QuoteTable
          quotes={filteredQuotes}
          groupByPr={filter.groupByPr}
          onSelectPr={(prNo) => setSelectedPrNo(prNo)}
          onEditQuote={(q) => setEditingQuote(q)}
        />
      </main>

      {selectedPrNo && (
        <PrComparisonModal
          prNo={selectedPrNo}
          quotes={processedQuotes}
          onClose={() => setSelectedPrNo(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {(isAddModalOpen || editingQuote) && (
        <QuoteFormModal
          quoteToEdit={editingQuote}
          onClose={() => { setIsAddModalOpen(false); setEditingQuote(null); }}
          onSave={handleSaveQuote}
          onDelete={handleDeleteQuote}
        />
      )}

      {isImportModalOpen && (
        <ImportModal
          onClose={() => setIsImportModalOpen(false)}
          onImportQuotes={handleImportQuotes}
        />
      )}
    </div>
  );
}
