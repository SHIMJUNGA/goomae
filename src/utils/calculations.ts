import { QuoteRaw, ProcessedQuote, PriceState, DeliveryState } from '../types';

export const BASE_DATE = '2026-08-27';

export function calculateDaysDiff(dateStr: string | null, baseDateStr: string): number | null {
  if (!dateStr) return null;
  const d1 = new Date(dateStr);
  const d2 = new Date(baseDateStr);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
  const diffTime = d1.getTime() - d2.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function processQuotes(rawQuotes: QuoteRaw[]): ProcessedQuote[] {
  // 1. Check naming variance per item_code across all quotes
  const itemCodeNamesMap = new Map<string, Set<string>>();
  rawQuotes.forEach(q => {
    if (!q.item_code) return;
    const cleanName = (q.item_name || '').trim();
    if (!itemCodeNamesMap.has(q.item_code)) {
      itemCodeNamesMap.set(q.item_code, new Set());
    }
    itemCodeNamesMap.get(q.item_code)!.add(cleanName);
  });

  const namingVarianceItems = new Set<string>();
  itemCodeNamesMap.forEach((names, code) => {
    if (names.size >= 2) {
      namingVarianceItems.add(code);
    }
  });

  // 2. Group by pr_no for median price calculation & lowest price determination
  const prGroups = new Map<string, QuoteRaw[]>();
  rawQuotes.forEach(q => {
    if (!q.pr_no) return;
    if (!prGroups.has(q.pr_no)) {
      prGroups.set(q.pr_no, []);
    }
    prGroups.get(q.pr_no)!.push(q);
  });

  const prMedianMap = new Map<string, number | null>();
  const prLowestMap = new Map<string, string>(); // pr_no -> quote_id of lowest

  prGroups.forEach((quotes, prNo) => {
    // Valid unit prices (not null/undefined)
    const validPrices = quotes
      .map(q => q.unit_price)
      .filter((p): p is number => p !== null && p !== undefined && !isNaN(p));

    let median: number | null = null;
    if (validPrices.length > 0) {
      const sorted = [...validPrices].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      if (sorted.length % 2 === 0) {
        median = (sorted[mid - 1] + sorted[mid]) / 2;
      } else {
        median = sorted[mid];
      }
    }
    prMedianMap.set(prNo, median);

    // Determine lowest price quote in PR (excluding outliers or blank prices?)
    // PRD 5.3: 후보 집합 = price_state ∈ {정상, 비교 불가} 인 행. 최저가 = min(unit_price).
    // Let's first pre-calculate outlier states per PR group.
    // Outlier condition: validPrices.length >= 3 and |deviation| > 30.
    const quotePriceStates = new Map<string, PriceState>();
    quotes.forEach(q => {
      if (q.unit_price === null || q.unit_price === undefined) {
        quotePriceStates.set(q.quote_id, '단가 미기재');
      } else if (validPrices.length < 3) {
        quotePriceStates.set(q.quote_id, '비교 불가');
      } else if (median !== null && median > 0) {
        const deviation = ((q.unit_price - median) / median) * 100;
        if (Math.abs(deviation) > 30) {
          quotePriceStates.set(q.quote_id, '이상치');
        } else {
          quotePriceStates.set(q.quote_id, '정상');
        }
      } else {
        quotePriceStates.set(q.quote_id, '정상');
      }
    });

    // Lowest candidate pool: price_state is '정상' or '비교 불가'
    const candidateQuotes = quotes.filter(q => {
      const st = quotePriceStates.get(q.quote_id);
      return q.unit_price !== null && (st === '정상' || st === '비교 불가');
    });

    if (candidateQuotes.length > 0) {
      // Sort by unit_price asc, then quote_date asc, then quote_id asc
      candidateQuotes.sort((a, b) => {
        if ((a.unit_price ?? 0) !== (b.unit_price ?? 0)) {
          return (a.unit_price ?? 0) - (b.unit_price ?? 0);
        }
        if (a.quote_date !== b.quote_date) {
          return a.quote_date.localeCompare(b.quote_date);
        }
        return a.quote_id.localeCompare(b.quote_id);
      });
      prLowestMap.set(prNo, candidateQuotes[0].quote_id);
    }
  });

  // 3. Process each quote fully
  return rawQuotes.map(q => {
    const median = prMedianMap.get(q.pr_no) ?? null;
    const validGroupPrices = (prGroups.get(q.pr_no) || [])
      .map(x => x.unit_price)
      .filter((p): p is number => p !== null && p !== undefined);

    let priceState: PriceState = '정상';
    let deviationPercent: number | null = null;

    if (q.unit_price === null || q.unit_price === undefined) {
      priceState = '단가 미기재';
    } else if (validGroupPrices.length < 3) {
      priceState = '비교 불가';
    } else if (median !== null && median > 0) {
      deviationPercent = Number((((q.unit_price - median) / median) * 100).toFixed(1));
      if (Math.abs(deviationPercent) > 30) {
        priceState = '이상치';
      } else {
        priceState = '정상';
      }
    }

    const isLowest = prLowestMap.get(q.pr_no) === q.quote_id;

    // Delivery calculation
    const deliveryDays = calculateDaysDiff(q.promised_date, BASE_DATE);
    let deliveryState: DeliveryState = '정상';
    let deliveryRank = 2; // default normal

    if (q.status === '견적') {
      deliveryState = '판정 대상 아님';
      deliveryRank = 4;
    } else if (deliveryDays === null) {
      deliveryState = '납기 미기재';
      deliveryRank = 3;
    } else if (deliveryDays < 0) {
      deliveryState = '지연';
      deliveryRank = 0;
    } else if (deliveryDays >= 0 && deliveryDays <= 7) {
      deliveryState = '임박';
      deliveryRank = 1;
    } else {
      deliveryState = '정상';
      deliveryRank = 2;
    }

    // Exceed required date check
    let isExceedRequired = false;
    if (q.promised_date && q.required_date) {
      isExceedRequired = new Date(q.promised_date).getTime() > new Date(q.required_date).getTime();
    }

    const hasNamingVariance = namingVarianceItems.has(q.item_code);

    return {
      ...q,
      medianPrice: median,
      deviationPercent,
      priceState,
      isLowest,
      deliveryDays,
      deliveryState,
      isExceedRequired,
      hasNamingVariance,
      deliveryRank
    };
  });
}
