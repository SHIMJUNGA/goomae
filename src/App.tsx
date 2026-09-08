import React, { useState, useEffect, useMemo } from 'react';
import { QuoteRaw, ProcessedQuote, FilterState } from './types';
import { DEFAULT_QUOTES } from './data/defaultQuotes';
import { processQuotes } from './utils/calculations';
import { Header } from './components/Header';
import { DashboardCards } from './components/DashboardCards';
import { FilterBar } from './components/FilterBar';
import { QuoteTable } from './components/QuoteTable';
import { PrComparisonModal } from './components/PrComparisonModal';
import { QuoteFormModal } from './components/QuoteFormModal';
import { ImportModal } from './components/ImportModal';

const STORAGE_KEY = 'exs02.quotes.v1';

export default function App() {
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

  // Save to localStorage whenever rawQuotes changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rawQuotes));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [rawQuotes]);

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

    // Search query
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

    // Status filter
    if (filter.statusFilter !== 'ALL') {
      list = list.filter(item => item.status === filter.statusFilter);
    }

    // Judgment filter
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

    // Item filter
    if (filter.itemFilter !== 'ALL') {
      list = list.filter(item => item.item_code === filter.itemFilter);
    }

    // Supplier filter
    if (filter.supplierFilter !== 'ALL') {
      list = list.filter(item => item.supplier === filter.supplierFilter);
    }

    // Default sorting (deliveryRank asc, deliveryDays asc, pr_no asc, unit_price asc)
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
  const handleResetDefault = () => {
    if (confirm('기본 샘플 데이터(80건)로 초기화하시겠습니까? 현재 수정된 내용이 초기화됩니다.')) {
      setRawQuotes(DEFAULT_QUOTES);
      localStorage.removeItem(STORAGE_KEY);
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

  const handleSaveQuote = (saved: QuoteRaw, isEdit: boolean) => {
    if (isEdit) {
      setRawQuotes(prev => prev.map(q => q.quote_id === saved.quote_id ? saved : q));
    } else {
      setRawQuotes(prev => [saved, ...prev]);
    }
    setEditingQuote(null);
    setIsAddModalOpen(false);
  };

  const handleDeleteQuote = (quoteId: string) => {
    setRawQuotes(prev => prev.filter(q => q.quote_id !== quoteId));
    setEditingQuote(null);
  };

  const handleUpdateStatus = (quoteId: string, newStatus: '견적' | '발주') => {
    setRawQuotes(prev => prev.map(q => q.quote_id === quoteId ? { ...q, status: newStatus } : q));
  };

  const handleImportQuotes = (imported: QuoteRaw[]) => {
    setRawQuotes(imported);
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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <Header
        totalCount={processedQuotes.length}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenAdd={() => setIsAddModalOpen(true)}
        onResetDefault={handleResetDefault}
        onExportCsv={handleExportCsv}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Warning Dashboard Cards */}
        <DashboardCards
          quotes={processedQuotes}
          activeFilter={filter.judgmentFilter}
          onSelectFilter={handleDashboardCardSelect}
        />

        {/* Filter & Search Bar */}
        <FilterBar
          filter={filter}
          onFilterChange={(updated) => setFilter(prev => ({ ...prev, ...updated }))}
          uniqueItemCodes={uniqueItemCodes}
          uniqueSuppliers={uniqueSuppliers}
        />

        {/* Main Quote Table */}
        <QuoteTable
          quotes={filteredQuotes}
          groupByPr={filter.groupByPr}
          onSelectPr={(prNo) => setSelectedPrNo(prNo)}
          onEditQuote={(q) => setEditingQuote(q)}
        />
      </main>

      {/* PR Comparison Detail Modal (S-03) */}
      {selectedPrNo && (
        <PrComparisonModal
          prNo={selectedPrNo}
          quotes={processedQuotes}
          onClose={() => setSelectedPrNo(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* Add / Edit Quote Modal (S-04) */}
      {(isAddModalOpen || editingQuote) && (
        <QuoteFormModal
          quoteToEdit={editingQuote}
          onClose={() => { setIsAddModalOpen(false); setEditingQuote(null); }}
          onSave={handleSaveQuote}
          onDelete={handleDeleteQuote}
        />
      )}

      {/* Import Modal (S-01) */}
      {isImportModalOpen && (
        <ImportModal
          onClose={() => setIsImportModalOpen(false)}
          onImportQuotes={handleImportQuotes}
        />
      )}
    </div>
  );
}
