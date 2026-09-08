export interface QuoteRaw {
  quote_id: string;
  pr_no: string;
  item_code: string;
  item_name: string;
  supplier: string;
  unit: string;
  qty: number;
  unit_price: number | null;
  currency: string;
  quote_date: string;
  required_date: string;
  promised_date: string | null;
  status: '견적' | '발주';
  remark?: string;
}

export type PriceState = '정상' | '이상치' | '비교 불가' | '단가 미기재';
export type DeliveryState = '지연' | '임박' | '정상' | '납기 미기재' | '판정 대상 아님';

export interface ProcessedQuote extends QuoteRaw {
  medianPrice?: number | null;
  deviationPercent?: number | null;
  priceState: PriceState;
  isLowest: boolean;
  deliveryDays: number | null; // D value
  deliveryState: DeliveryState;
  isExceedRequired: boolean;
  hasNamingVariance: boolean;
  deliveryRank: number;
  isLowestConflict?: boolean; // 발주건인데 최저가가 아닌 경우 등 안내
}

export interface FilterState {
  searchQuery: string;
  statusFilter: 'ALL' | '견적' | '발주';
  judgmentFilter: 'ALL' | '지연' | '임박' | '이상치' | '표기상이' | '단가미기재' | '납기미기재';
  itemFilter: string;
  supplierFilter: string;
  prFilter: string;
  groupByPr: boolean;
}

export interface WarningSummary {
  delayCount: number;
  imminentCount: number;
  outlierCount: number;
  namingVarianceCount: number;
  missingCount: number;
  totalCount: number;
}
