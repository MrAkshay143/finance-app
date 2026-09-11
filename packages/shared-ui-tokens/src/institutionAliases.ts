/**
 * Canonical domain -> array of lowercase aliases for institutions.
 * Covers Indian public sector banks, private banks, payments/SFBs, global banks,
 * NBFCs, and investment platforms.
 */
export const INSTITUTION_ALIASES: Record<string, string[]> = {
  // --------------------------------------------------------------------------
  // Indian Public Sector Banks
  // --------------------------------------------------------------------------
  'sbi.co.in': [
    'sbi',
    'state bank of india',
    'state bank',
    'statebankofindia',
    'sbi bank',
    'state bank of india sbi',
    'onlinesbi',
    'onlinesbi.sbi',
    'bank.sbi',
    'state bank of hyderabad',
    'state bank of patiala',
    'state bank of mysore',
    'state bank of bikaner and jaipur',
    'state bank of travancore',
  ],
  'pnbindia.in': [
    'pnb',
    'punjab national bank',
    'punjab national',
    'oriental bank of commerce',
    'united bank of india',
    'obc',
  ],
  'bankofbaroda.in': [
    'bob',
    'bank of baroda',
    'baroda',
    'dena bank',
    'vijaya bank',
    'baroda bank',
  ],
  'canarabank.com': [
    'canara',
    'canara bank',
    'syndicate bank',
  ],
  'unionbankofindia.co.in': [
    'union',
    'union bank',
    'union bank of india',
    'ubi',
    'andhra bank',
    'corporation bank',
  ],
  'indianbank.in': [
    'indian bank',
    'allahabad bank',
  ],
  'iob.in': [
    'iob',
    'indian overseas bank',
    'indian overseas',
  ],
  'centralbankofindia.co.in': [
    'central bank',
    'central bank of india',
    'cboi',
  ],
  'ucobank.com': [
    'uco',
    'uco bank',
  ],
  'bankofindia.co.in': [
    'boi',
    'bank of india',
  ],
  'bankofmaharashtra.in': [
    'bank of maharashtra',
    'mahabank',
    'bom',
  ],
  'punjabandsindbank.co.in': [
    'punjab and sind bank',
    'punjab & sind bank',
    'psb',
    'punjab and sind',
  ],

  // --------------------------------------------------------------------------
  // Indian Private Banks
  // --------------------------------------------------------------------------
  'hdfcbank.com': [
    'hdfc',
    'hdfc bank',
    'hdfcbank',
  ],
  'icicibank.com': [
    'icici',
    'icici bank',
    'icicibank',
  ],
  'axisbank.com': [
    'axis',
    'axis bank',
    'axisbank',
    'uti bank',
  ],
  'kotak.com': [
    'kotak',
    'kotak mahindra',
    'kotak mahindra bank',
    'kotak 811',
    'kotak bank',
  ],
  'yesbank.in': [
    'yes',
    'yes bank',
    'yesbank',
  ],
  'indusind.com': [
    'indusind',
    'indusind bank',
    'indus ind',
  ],
  'idfcfirstbank.com': [
    'idfc',
    'idfc first',
    'idfc first bank',
    'idfc bank',
    'idfc first bharat',
  ],
  'federalbank.co.in': [
    'federal',
    'federal bank',
  ],
  'southindianbank.com': [
    'south indian bank',
    'sib',
  ],
  'rblbank.com': [
    'rbl',
    'rbl bank',
    'ratnakar bank',
  ],
  'bandhanbank.com': [
    'bandhan',
    'bandhan bank',
  ],
  'dcbbank.com': [
    'dcb',
    'dcb bank',
    'development credit bank',
  ],
  'kvb.co.in': [
    'karur vysya',
    'karur vysya bank',
    'kvb',
  ],
  'cityunionbank.com': [
    'city union',
    'city union bank',
    'cub',
  ],
  'jkbank.com': [
    'j&k bank',
    'jk bank',
    'jammu and kashmir bank',
    'jammu & kashmir bank',
  ],
  'csb.co.in': [
    'csb',
    'csb bank',
    'catholic syrian bank',
  ],
  'tmb.in': [
    'tmb',
    'tamilnad mercantile bank',
    'tamilnad mercantile',
  ],

  // --------------------------------------------------------------------------
  // Small Finance & Payments Banks
  // --------------------------------------------------------------------------
  'aubank.in': [
    'au',
    'au bank',
    'au small finance',
    'au small finance bank',
    'aubank',
  ],
  'equitasbank.com': [
    'equitas',
    'equitas small finance',
    'equitas small finance bank',
    'equitas bank',
  ],
  'ujjivansfb.in': [
    'ujjivan',
    'ujjivan small finance bank',
    'ujjivan sfb',
    'ujjivan bank',
  ],
  'janabank.com': [
    'jana',
    'jana small finance bank',
    'jana sfb',
    'jana bank',
  ],
  'esafbank.com': [
    'esaf',
    'esaf small finance bank',
    'esaf bank',
  ],
  'suryodaybank.com': [
    'suryoday',
    'suryoday small finance bank',
    'suryoday bank',
  ],
  'paytmbank.com': [
    'paytm payments bank',
    'paytm bank',
    'paytm payments',
    'paytm payment bank',
  ],
  'airtel.in': [
    'airtel payments bank',
    'airtel bank',
    'airtel payments',
    'airtel money',
    'airtel payment bank',
  ],
  'ippbonline.com': [
    'india post payments bank',
    'ippb',
    'post office bank',
    'india post bank',
    'post office',
  ],
  'finobank.com': [
    'fino',
    'fino payments bank',
    'fino bank',
    'fino payment bank',
  ],
  'jiopaymentsbank.com': [
    'jio payments bank',
    'jio bank',
    'jio payments',
    'jio payment bank',
  ],

  // --------------------------------------------------------------------------
  // Global Banks
  // --------------------------------------------------------------------------
  'chase.com': [
    'chase',
    'jp morgan',
    'jpmorgan chase',
    'jpmorgan',
    'chase bank',
  ],
  'bankofamerica.com': [
    'bank of america',
    'bofa',
    'boa',
  ],
  'wellsfargo.com': [
    'wells fargo',
    'wellsfargo',
  ],
  'citi.com': [
    'citi',
    'citibank',
    'citigroup',
  ],
  'hsbc.com': [
    'hsbc',
    'hsbc bank',
  ],
  'sc.com': [
    'standard chartered',
    'standard chartered bank',
    'scb',
    'stanbic',
  ],
  'barclays.co.uk': [
    'barclays',
    'barclays bank',
  ],
  'db.com': [
    'deutsche bank',
    'deutsche',
  ],
  'dbs.com': [
    'dbs',
    'dbs bank',
    'digibank',
  ],
  'revolut.com': [
    'revolut',
  ],
  'wise.com': [
    'wise',
    'transferwise',
  ],

  // --------------------------------------------------------------------------
  // NBFCs
  // --------------------------------------------------------------------------
  'bajajfinserv.in': [
    'bajaj finance',
    'bajaj finserv',
    'bajaj',
    'bajaj financial',
  ],
  'tatacapital.com': [
    'tata capital',
    'tata',
    'tata finance',
  ],
  'muthootfinance.com': [
    'muthoot',
    'muthoot finance',
    'muthoot fincorp',
  ],
  'mahindrafinance.com': [
    'mahindra finance',
    'mahindra & mahindra financial services',
    'mahindra financial',
  ],
  'lichousing.com': [
    'lic housing',
    'lic housing finance',
    'lichfl',
  ],
  'piramalfinance.com': [
    'piramal',
    'piramal finance',
    'piramal enterprises',
  ],
  'cholamandalam.com': [
    'cholamandalam',
    'chola',
    'chola finance',
    'cholamandalam investment',
  ],
  'hdbfs.com': [
    'hdb',
    'hdb financial',
    'hdb financial services',
  ],
  'poonawallafincorp.com': [
    'poonawalla',
    'poonawalla fincorp',
    'poonawala',
  ],

  // --------------------------------------------------------------------------
  // Investment Platforms
  // --------------------------------------------------------------------------
  'zerodha.com': [
    'zerodha',
    'kite',
    'zerodha broking',
  ],
  'groww.in': [
    'groww',
    'groww app',
  ],
  'upstox.com': [
    'upstox',
    'rksv',
    'rksv securities',
  ],
  'angelone.in': [
    'angel one',
    'angel broking',
    'angel',
  ],
  'icicidirect.com': [
    'icici direct',
    'icicidirect',
  ],
  'hdfcsec.com': [
    'hdfc securities',
    'hdfc sec',
  ],
  'paytmmoney.com': [
    'paytm money',
  ],
  'dhan.co': [
    'dhan',
    'dhan app',
  ],
  'motilaloswal.com': [
    'motilal oswal',
    'mosl',
    'motilal',
  ],
};
