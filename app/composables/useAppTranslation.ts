/**
 * Cashier POS Translation & Localization Composable.
 *
 * Fast multi-language UI localization for English, Khmer (ភាសាខ្មែរ),
 * Chinese (中文), Japanese (日本語), and Korean (한국어).
 * Backed by backend response cache and local baseline dictionaries.
 */
import { API_ENDPOINTS } from '~/api/endpoints'
import { createCashierApiClient } from '~/api/client'

export type LocaleCode = 'en' | 'km' | 'cn' | 'jp' | 'kr'

export interface LocaleOption {
  code: LocaleCode
  name: string
  native: string
  flag: string
}

export const SUPPORTED_LOCALES: LocaleOption[] = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'km', name: 'Khmer', native: 'ភាសាខ្មែរ', flag: '🇰🇭' },
  { code: 'cn', name: 'Chinese', native: '中文', flag: '🇨🇳' },
  { code: 'jp', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'kr', name: 'Korean', native: '한국어', flag: '🇰🇷' },
]

// Baseline offline cache to guarantee zero-flash and sub-millisecond local rendering
const BASELINE_TRANSLATIONS: Record<LocaleCode, Record<string, string>> = {
  en: {
    'pos.search_placeholder': 'Scan barcode or search name / SKU (F2)',
    'pos.camera': 'Camera',
    'pos.parked': 'Parked',
    'pos.last_receipt': 'Last receipt',
    'pos.history': 'History',
    'pos.display': 'Display',
    'pos.shift': 'Shift',
    'pos.open_shift': 'Open Shift',
    'pos.stickers': 'Stickers',
    'pos.shortcuts': 'Shortcuts',
    'pos.register': 'Register',
    'pos.switch_register': 'Click to switch POS Station / Register',
    'pos.cart_title': 'Current Sale',
    'pos.clear_cart': 'Clear Cart',
    'pos.park_order': 'Park Order',
    'pos.customer': 'Customer',
    'pos.walk_in': 'Walk-in Customer',
    'pos.subtotal': 'Subtotal',
    'pos.discount': 'Discount',
    'pos.tax': 'Tax',
    'pos.total': 'Total',
    'pos.checkout': 'Checkout / Pay (Space)',
    'pos.empty_cart': 'Cart is empty. Scan products or select from catalog.',
    'pos.payment_title': 'Payment',
    'pos.cash': 'Cash',
    'pos.khqr': 'KHQR / ABA Pay',
    'pos.amount_due': 'Amount Due',
    'pos.amount_received': 'Amount Received',
    'pos.change_due': 'Change Due',
    'pos.complete_payment': 'Complete Payment',
    'pos.exact_amount': 'Exact Amount',
    'pos.open_register_title': 'Open Cash Register',
    'pos.close_register_title': 'Reconcile & Close Register',
    'pos.opening_cash': 'Opening Cash Amount',
    'pos.counted_cash': 'Actual Counted Cash',
    'pos.receipt_title': 'Sales Receipt',
    'pos.print_receipt': 'Print Receipt',
    'pos.done': 'Done',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.search': 'Search...',
    'common.loading': 'Loading...',
    'common.language': 'Language',
    'common.status': 'Status',
    'common.actions': 'Actions',
  },
  km: {
    'pos.search_placeholder': 'ស្កេនបាកូដ ឬស្វែងរកឈ្មោះ / SKU (F2)',
    'pos.camera': 'កាមេរ៉ា',
    'pos.parked': 'ផ្អាកទុក',
    'pos.last_receipt': 'វិក្កយបត្រចុងក្រោយ',
    'pos.history': 'ប្រវត្តិលក់',
    'pos.display': 'អេក្រង់អតិថិជន',
    'pos.shift': 'វេនគិតប្រាក់',
    'pos.open_shift': 'បើកវេន',
    'pos.stickers': 'បោះពុម្ពស្លាក',
    'pos.shortcuts': 'ផ្លូវកាត់ (F1)',
    'pos.register': 'បញ្ជរ',
    'pos.switch_register': 'ចុចដើម្បីប្តូរស្ថានីយ POS / បញ្ជរ',
    'pos.cart_title': 'ការលក់បច្ចុប្បន្ន',
    'pos.clear_cart': 'សម្អាតកន្ត្រក',
    'pos.park_order': 'ផ្អាកការបញ្ជាទិញ',
    'pos.customer': 'អតិថិជន',
    'pos.walk_in': 'អតិថិជនទូទៅ',
    'pos.subtotal': 'សរុបរង',
    'pos.discount': 'បញ្ចុះតម្លៃ',
    'pos.tax': 'ពន្ធ',
    'pos.total': 'សរុប',
    'pos.checkout': 'ទូទាត់ប្រាក់ (Space)',
    'pos.empty_cart': 'កន្ត្រកទទេស្អាត។ សូមស្កេនទំនិញ ឬជ្រើសរើសពីបញ្ជី។',
    'pos.payment_title': 'ការទូទាត់ប្រាក់',
    'pos.cash': 'សាច់ប្រាក់',
    'pos.khqr': 'ទូទាត់តាម KHQR / ABA',
    'pos.amount_due': 'ប្រាក់ត្រូវទូទាត់',
    'pos.amount_received': 'ប្រាក់ទទួល',
    'pos.change_due': 'ប្រាក់អាប់',
    'pos.complete_payment': 'បញ្ចប់ការទូទាត់',
    'pos.exact_amount': 'គ្រប់ចំនួន',
    'pos.open_register_title': 'បើកថតប្រាក់',
    'pos.close_register_title': 'ផ្ទៀងផ្ទាត់ & បិទវេន',
    'pos.opening_cash': 'ប្រាក់ដើមគ្រា',
    'pos.counted_cash': 'ប្រាក់រាប់បានជាក់ស្តែង',
    'pos.receipt_title': 'វិក្កយបត្រលក់',
    'pos.print_receipt': 'បោះពុម្ពវិក្កយបត្រ',
    'pos.done': 'រួចរាល់',
    'common.save': 'រក្សាទុក',
    'common.cancel': 'បោះបង់',
    'common.delete': 'លុប',
    'common.edit': 'កែប្រែ',
    'common.close': 'បិទ',
    'common.confirm': 'បញ្ជាក់',
    'common.back': 'ថយក្រោយ',
    'common.search': 'ស្វែងរក...',
    'common.loading': 'កំពុងដំណើរការ...',
    'common.language': 'ភាសា',
    'common.status': 'ស្ថានភាព',
    'common.actions': 'សកម្មភាព',
  },
  cn: {
    'pos.search_placeholder': '扫描条形码或搜索商品 (F2)',
    'pos.camera': '相机',
    'pos.parked': '挂单',
    'pos.last_receipt': '上一小票',
    'pos.history': '历史记录',
    'pos.display': '客显屏',
    'pos.shift': '交接班',
    'pos.open_shift': '开班',
    'pos.stickers': '标签打印',
    'pos.shortcuts': '快捷键',
    'pos.register': '收银台',
    'pos.switch_register': '切换POS机台',
    'pos.cart_title': '当前销售',
    'pos.clear_cart': '清空购物车',
    'pos.park_order': '挂单保存',
    'pos.customer': '客户',
    'pos.walk_in': '散客',
    'pos.subtotal': '小计',
    'pos.discount': '折扣',
    'pos.tax': '税费',
    'pos.total': '合计',
    'pos.checkout': '结算支付 (空格)',
    'pos.empty_cart': '购物车为空，请扫描商品或在左侧选择。',
    'pos.payment_title': '收银结算',
    'pos.cash': '现金',
    'pos.khqr': 'KHQR扫码支付',
    'pos.amount_due': '应收金额',
    'pos.amount_received': '实收金额',
    'pos.change_due': '找零',
    'pos.complete_payment': '确认完成支付',
    'pos.exact_amount': '正好付清',
    'pos.open_register_title': '开启钱箱 / 班次',
    'pos.close_register_title': '核对并结算交班',
    'pos.opening_cash': '开班备用金',
    'pos.counted_cash': '清点现金总额',
    'pos.receipt_title': '销售小票',
    'pos.print_receipt': '打印小票',
    'pos.done': '完成',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.close': '关闭',
    'common.confirm': '确认',
    'common.back': '返回',
    'common.search': '搜索...',
    'common.loading': '加载中...',
    'common.language': '语言',
    'common.status': '状态',
    'common.actions': '操作',
  },
  jp: {
    'pos.search_placeholder': 'バーコードスキャンまたは検索 (F2)',
    'pos.camera': 'カメラ',
    'pos.parked': '保留',
    'pos.last_receipt': '直前のレシート',
    'pos.history': '履歴',
    'pos.display': '客面表示',
    'pos.shift': 'シフト',
    'pos.open_shift': 'シフト開始',
    'pos.stickers': 'ラベル',
    'pos.shortcuts': 'ショートカット',
    'pos.register': 'レジ',
    'pos.switch_register': 'POS端末切り替え',
    'pos.cart_title': '現在のお会計',
    'pos.clear_cart': 'カートを空にする',
    'pos.park_order': '伝票保留',
    'pos.customer': 'お客様',
    'pos.walk_in': '一般顧客',
    'pos.subtotal': '小計',
    'pos.discount': '割引',
    'pos.tax': '消費税',
    'pos.total': '合計',
    'pos.checkout': 'お会計 (スペース)',
    'pos.empty_cart': 'カートは空です。商品をスキャンしてください。',
    'pos.payment_title': '決済',
    'pos.cash': '現金',
    'pos.khqr': 'KHQR決済',
    'pos.amount_due': 'お支払い合計',
    'pos.amount_received': 'お預かり金額',
    'pos.change_due': 'お釣り',
    'pos.complete_payment': '決済を完了する',
    'pos.exact_amount': 'ちょうど',
    'pos.open_register_title': 'レジ開け',
    'pos.close_register_title': 'レジ締め・精算',
    'pos.opening_cash': '釣準備金',
    'pos.counted_cash': '実有高',
    'pos.receipt_title': 'レシート',
    'pos.print_receipt': 'レシート印刷',
    'pos.done': '完了',
    'common.save': '保存',
    'common.cancel': 'キャンセル',
    'common.delete': '削除',
    'common.edit': '編集',
    'common.close': '閉じる',
    'common.confirm': '確認',
    'common.back': '戻る',
    'common.search': '検索...',
    'common.loading': '読み込み中...',
    'common.language': '言語',
    'common.status': '状態',
    'common.actions': '操作',
  },
  kr: {
    'pos.search_placeholder': '바코드 스캔 또는 상품 검색 (F2)',
    'pos.camera': '카메라',
    'pos.parked': '보류',
    'pos.last_receipt': '최근 영수증',
    'pos.history': '판매 내역',
    'pos.display': '고객 화면',
    'pos.shift': '교대',
    'pos.open_shift': '교대 시작',
    'pos.stickers': '라벨',
    'pos.shortcuts': '단축키',
    'pos.register': '포스기',
    'pos.switch_register': 'POS 단말기 전환',
    'pos.cart_title': '현재 결제',
    'pos.clear_cart': '장바구니 비우기',
    'pos.park_order': '주문 보류',
    'pos.customer': '고객',
    'pos.walk_in': '일반 고객',
    'pos.subtotal': '소계',
    'pos.discount': '할인',
    'pos.tax': '세금',
    'pos.total': '총액',
    'pos.checkout': '결제하기 (스페이스)',
    'pos.empty_cart': '장바구니가 비어 있습니다. 바코드를 스캔하세요.',
    'pos.payment_title': '결제',
    'pos.cash': '현금',
    'pos.khqr': 'KHQR 결제',
    'pos.amount_due': '결제 금액',
    'pos.amount_received': '받은 금액',
    'pos.change_due': '거스름돈',
    'pos.complete_payment': '결제 완료',
    'pos.exact_amount': '정액 결제',
    'pos.open_register_title': '개점 / 교대 시작',
    'pos.close_register_title': '마감 및 정산',
    'pos.opening_cash': '준비금',
    'pos.counted_cash': '정산 금액',
    'pos.receipt_title': '영수증',
    'pos.print_receipt': '영수증 출력',
    'pos.done': '완료',
    'common.save': '저장',
    'common.cancel': '취소',
    'common.delete': '삭제',
    'common.edit': '수정',
    'common.close': '닫기',
    'common.confirm': '확인',
    'common.back': '뒤로',
    'common.search': '검색...',
    'common.loading': '로딩 중...',
    'common.language': '언어',
    'common.status': '상태',
    'common.actions': '작업',
  },
}

export function useAppTranslation() {
  const currentLocale = useState<LocaleCode>('cashier_current_locale', () => {
    if (import.meta.client) {
      const stored = localStorage.getItem('cashier_locale') as LocaleCode
      if (stored && ['en', 'km', 'cn', 'jp', 'kr'].includes(stored)) {
        return stored
      }
    }
    return 'km' // Khmer default for cashier terminal in Cambodia
  })

  const translations = useState<Record<LocaleCode, Record<string, string>>>(
    'cashier_translations_registry',
    () => BASELINE_TRANSLATIONS,
  )

  const isLoaded = useState<boolean>('cashier_translations_loaded', () => false)

  function t(key: string, fallback?: string): string {
    const loc = currentLocale.value
    const dict = translations.value[loc]
    if (dict && dict[key]) {
      return dict[key]
    }
    // Fallback to English
    const enDict = translations.value['en']
    if (enDict && enDict[key]) {
      return enDict[key]
    }
    return fallback !== undefined ? fallback : key
  }

  function setLocale(locale: LocaleCode) {
    if (!['en', 'km', 'cn', 'jp', 'kr'].includes(locale)) return
    currentLocale.value = locale
    if (import.meta.client) {
      localStorage.setItem('cashier_locale', locale)
    }
  }

  const currentLocaleObj = computed<LocaleOption>(() => {
    const found = SUPPORTED_LOCALES.find(l => l.code === currentLocale.value)
    return found || SUPPORTED_LOCALES[0]!
  })

  /**
   * Fetch latest translations from backend TRANSLATE_MODEL (cached in Redis per response).
   */
  async function fetchTranslations() {
    try {
      const client = createCashierApiClient()
      const data = await client.fetch<any>(API_ENDPOINTS.translations.base, {
        params: { schema_name: 'pos' },
      })
      if (data?.locales) {
        for (const loc of ['en', 'km', 'cn', 'jp', 'kr'] as LocaleCode[]) {
          if (data.locales[loc]) {
            translations.value[loc] = {
              ...translations.value[loc],
              ...data.locales[loc],
            }
          }
        }
        if (import.meta.client) {
          localStorage.setItem('cashier_cached_translations', JSON.stringify(translations.value))
        }
      }
      isLoaded.value = true
    } catch {
      // Offline fallback: load from localStorage if available
      if (import.meta.client) {
        const cached = localStorage.getItem('cashier_cached_translations')
        if (cached) {
          try {
            const parsed = JSON.parse(cached)
            translations.value = { ...translations.value, ...parsed }
          } catch {}
        }
      }
    }
  }

  return {
    currentLocale,
    currentLocaleObj,
    supportedLocales: SUPPORTED_LOCALES,
    t,
    setLocale,
    fetchTranslations,
    isLoaded,
  }
}
