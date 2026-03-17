import { TranslationKeys } from './en'

export const es: TranslationKeys = {
  // Account Settings Page
  account: {
    title: "Configuración de Cuenta",
    subtitle: "Administra la información y preferencias de tu cuenta",
    backToDashboard: "Volver al Panel",

    // Profile Picture
    profilePicture: {
      title: "Foto de Perfil",
      subtitle: "Sube una foto de perfil para personalizar tu cuenta",
      uploadButton: "Subir Foto",
      fileInfo: "JPG, PNG o GIF. Tamaño máximo 5MB.",
    },

    // Personal Information
    personalInfo: {
      title: "Información Personal",
      subtitle: "Actualiza tus datos personales e información de contacto",
      firstName: "Nombre",
      lastName: "Apellido",
      email: "Correo Electrónico",
      emailDescription: "Este correo se utilizará para notificaciones de cuenta e inicio de sesión",
    },

    // Language Preferences
    language: {
      title: "Preferencias de Idioma",
      subtitle: "Elige tu idioma preferido para la interfaz de la plataforma",
      platformLanguage: "Idioma de la Plataforma",
      languageDescription: "Todo el texto de la interfaz, etiquetas y comunicaciones se mostrarán en tu idioma seleccionado",
      noteTitle: "Nota:",
      noteEnglish: "Cambiar tu preferencia de idioma actualizará todo el texto de la plataforma para mostrarse solo en inglés. Esto asegura consistencia en toda tu experiencia.",
      noteSpanish: "Cambiar tu preferencia de idioma actualizará todo el texto de la plataforma para mostrarse solo en español. Esto asegura consistencia en toda tu experiencia.",
    },

    // Password Management
    password: {
      title: "Administración de Contraseña",
      subtitle: "Actualiza tu contraseña para mantener tu cuenta segura",
      currentPassword: "Contraseña Actual",
      currentPasswordPlaceholder: "Ingresa contraseña actual",
      newPassword: "Nueva Contraseña",
      newPasswordPlaceholder: "Ingresa nueva contraseña",
      confirmPassword: "Confirmar Nueva Contraseña",
      confirmPasswordPlaceholder: "Confirma nueva contraseña",
      passwordRequirement: "La contraseña debe tener al menos 8 caracteres",
      passwordMismatch: "Las contraseñas no coinciden. Por favor asegúrate de que ambas contraseñas sean idénticas.",
    },

    // Actions
    actions: {
      cancel: "Cancelar",
      saveChanges: "Guardar Cambios",
      successMessage: "La configuración de tu cuenta se ha actualizado exitosamente.",
    },

    // Support
    support: {
      needHelp: "¿Necesitas más ayuda?",
      contactText: "Si necesitas actualizar otras configuraciones de cuenta o tienes preguntas sobre tu cuenta, por favor contacta a nuestro equipo de soporte en",
    },
  },

  // Navigation
  nav: {
    account: "Cuenta",
    billing: "Facturación",
    notifications: "Notificaciones",
    logout: "Cerrar sesión",
    dashboard: "Panel",
    structures: "Estructuras",
    investments: "Activos",
    investors: "Inversionistas",
    reports: "Reportes",
    settings: "Configuración",
    getHelp: "Obtener Ayuda",
    search: "Buscar",

    // Main Navigation
    capital: "Capital",
    commitments: "Compromisos",
    activity: "Actividad",
    operations: "Operaciones",
    capitalCalls: "Llamadas de Capital",
    distributions: "Distribuciones",
    analytics: "Analítica",
    performance: "Rendimiento",

    // Documents
    documents: "Documentos",
    documentCenter: "Centro de Documentos",
    financialReports: "Reportes Financieros",
    legalDocuments: "Documentos Legales",

    // Chat
    chat: "Chat",
  },

  // Structure Types
  structures: {
    fund: "Fondo",
    sa: "SA / SRL",
    fideicomiso: "Fideicomiso",
    privateDebt: "Deuda Privada",
  },

  // Dashboard
  dashboard: {
    title: "Panel",
    welcome: "Bienvenido de nuevo",
    overview: "Resumen",
    totalInvestmentValue: "Valor Total de Inversión",
    totalInvestedCapital: "Capital Total Invertido",
    ytdPerformance: "Rendimiento del Año",
    currentPortfolioValue: "Valor actual del portafolio",
    totalCommitment: "Compromiso total",
    originalInvestmentAmount: "Monto de inversión original",
    totalDistributions: "Distribuciones Totales",
    toInvestors: "A inversionistas",
    totalCashFlowDistributed: "Flujo de efectivo total distribuido",
    averageIRR: "TIR Promedio",
    acrossInvestments: "A través de 7 inversiones",
    portfolioPerformance: "Rendimiento del portafolio",
    portfolioNetAssetValue: "Valor Neto de Activos del Portafolio (NAV)",
    asOfDate: "Al 15 de octubre de 2025",
    currentNAV: "NAV Actual",
    navPerShare: "NAV por Acción",
    ytdReturn: "Retorno del Año",
    navTrend: "Tendencia NAV (12 Meses)",
    navComponents: "Componentes NAV",
    totalAssets: "Activos Totales",
    cash: "Efectivo",
    investments: "Inversiones",
    other: "Otros",
    initial: "Inicial",
    lifetime: "Acumulado",
    portfolio: "Portafolio",
  },

  // Investments Page
  investments: {
    title: "Inversiones",
    count: "7 inversiones",
    addInvestment: "Agregar Inversión",
    totalValue: "Valor Total",
    totalCost: "Costo Total",
    unrealizedGain: "Ganancia No Realizada",
    return: "Retorno",
    searchPlaceholder: "Buscar inversiones...",
    all: "Todas",
    realEstate: "Bienes Raíces",
    privateEquity: "Capital Privado",
    privateDebt: "Deuda Privada",
    active: "Activa",
    currentValue: "Valor Actual",
    totalInvested: "Total Invertido",
    irr: "TIR",
    multiple: "Múltiplo",
    investmentType: "Tipo de Inversión",
    externalDebt: "Deuda Externa",
    mixed: "MIXTO",
    equity: "CAPITAL",
    debt: "DEUDA",
  },

  // Investors Page
  investors: {
    title: "Inversionistas",
    count: "5 inversionistas",
    addInvestor: "Agregar Inversionista",
    totalCommitment: "Compromiso Total",
    totalContributed: "Total Contribuido",
    totalDistributed: "Total Distribuido",
    avgIRR: "TIR Promedio",
    searchPlaceholder: "Buscar inversionistas...",
    all: "Todos",
    individual: "Individual",
    institution: "Institución",
    familyOffice: "Oficina Familiar",
    fundOfFunds: "Fondo de Fondos",
    active: "Activo",
    commitment: "Compromiso",
    currentValue: "Valor Actual",
    calledCapital: "Capital Llamado",
    uncalled: "No Llamado",
    unrealizedGain: "Ganancia No Realizada",
    irr: "TIR",
    fundOwnership: "Propiedad del Fondo",
    k1Status: "Estado K-1",
    delivered: "Entregado",
  },

  // Reports Page
  reports: {
    title: "Reportes",
    count: "8 reportes",
    generateReport: "Generar Reporte",
    totalReports: "Reportes Totales",
    published: "Publicados",
    drafts: "Borradores",
    recipients: "Destinatarios",
    searchPlaceholder: "Buscar reportes...",
    type: "Tipo:",
    all: "Todos",
    quarterly: "Trimestral",
    annual: "Anual",
    monthly: "Mensual",
    capitalCall: "Llamada de Capital",
    distribution: "Distribución",
    status: "Estado:",
    inReview: "En Revisión",
    draft: "Borrador",
    quarterlyReport: "Reporte Trimestral",
    totalAUM: "AUM Total",
    avgIRR: "TIR Promedio",
    distributions: "Distribuciones",
    generated: "Generado",
    pdf: "PDF",
    excel: "Excel",
    viewDetails: "Ver Detalles",
  },

  // Onboarding
  onboarding: {
    title: "Configuración de Estructura",
    subtitle: "Configura tu estructura de inversión para comenzar con Polibit",
    step: "Paso",
    of: "de",
    complete: "Completado",
    selectStructureType: "Seleccionar Tipo de Estructura",
    selectStructureSubtitle: "Elige la estructura legal que mejor se adapte a tu estrategia de inversión",
    primaryStructureType: "Tipo de Estructura Principal",
    fund: "Fondo",
    fundDescription: "Fondo de inversión para uno o múltiples proyectos con llamadas de capital",
    saLLC: "SA / SRL",
    saLLCDescription: "Entidad legal de una sola propiedad para riesgo aislado",
    fideicomiso: "Fideicomiso",
    fideicomisoDescription: "Estructura de fideicomiso bancario con incentivos fiscales, puede contener múltiples propiedades",
    privateDebt: "Deuda Privada",
    privateDebtDescription: "Estructura de pagaré con garante",
    previous: "Anterior",
    next: "Siguiente",
    needHelp: "¿Necesitas ayuda?",
    contactSupport: "Contactar soporte",
    viewDocumentation: "ver documentación",
    maxInvestorRestriction: "Restricción Máxima de Inversionistas",
    maxInvestorRestrictionDesc: "Número máximo de inversionistas permitidos por regulación para esta estructura.",
    maxInvestorCount: "Número Máximo de Inversionistas",
    placeholderMaxInvestors: "ej., 99",
    investorRestrictionWarning: "Advertencia de Restricción de Inversionistas",
    investorRestrictionMsg: "Con {investors} inversionistas al ticket máximo de {currency} {max}, la recaudación máxima posible es {currency} {maxRaise} — lo cual está por debajo de tu meta de {currency} {target}.",
    shortfallMsg: "Déficit: {currency} {shortfall}. Considera aumentar el tamaño máximo de ticket o el límite de inversionistas.",
    ticketCanFulfill: "Con {investors} inversionistas máximo, el capital total de {currency} {total} puede ser cumplido.",
    ticketInvestorMinExceeds: "{investors} inversionistas al ticket mínimo ({currency} {min}) requerirían {currency} {minRaise} — excediendo el capital total de {currency} {total}.",
    ticketMaxExceedsError: "El tamaño máximo de ticket ({currency} {max}) no puede exceder el compromiso total de capital ({currency} {total}).",
    ticketIssueNum: "Problema {num}:",
    ticketAdjustSizes: "Por favor ajusta los tamaños de ticket o el límite de inversionistas para resolver",
    theseIssuesPlural: "estos problemas",
    thisIssueSingular: "este problema",
  },

  // LP Dashboard Page
  lpDashboard: {
    loading: "Cargando panel...",
    noData: "No hay datos disponibles",
    authRequired: "Autenticación requerida",
    filterByFund: "Filtrar por Fondo:",
    allFunds: "Todos los Fondos",
    addGraph: "Agregar Gráfico",
    totalCommitment: "Compromiso Total",
    activeFund: "fondo",
    activeFunds: "fondos",
    across: "En",
    active: "activo(s)",
    currentValue: "Valor Actual",
    calledCapital: "capital llamado",
    totalReturn: "Retorno Total",
    totalDistributed: "Total Distribuido",
    lifetimeDistributions: "Distribuciones recibidas de por vida",
    capitalDeployment: "Despliegue de Capital",
    commitmentVsCalled: "Tu compromiso vs. capital llamado",
    calledCapitalLabel: "Capital Llamado",
    uncalledCapital: "Capital No Llamado",
    deploymentRate: "Tasa de Despliegue",
    portfolioBreakdown: "Desglose del Portafolio",
    investmentsAcrossFunds: "Tus inversiones en todos los fondos",
    viewAll: "Ver Todo",
    noActiveInvestments: "Sin inversiones activas aún",
    commitment: "Compromiso",
    called: "Llamado",
    unrealizedGain: "Ganancia No Realizada",
    chartComingSoon: "Gráfico de Valor del Portafolio - Próximamente",
    portfolioPerformance: "Rendimiento del Portafolio",
    capitalFlowOverTime: "Llamadas de capital y distribuciones a lo largo del tiempo",
    allTime: "Todo el Tiempo",
    last12Months: "Últimos 12 Meses",
    last6Months: "Últimos 6 Meses",
    noActivityData: "No hay datos de actividad disponibles",
    cumulativeCalledCapital: "Capital Llamado Acumulado",
    cumulativeDistributions: "Distribuciones Acumuladas",
    recentActivity: "Actividad Reciente",
    latestTransactions: "Tus últimas llamadas de capital y distribuciones",
    noRecentActivity: "Sin actividad reciente",
    capitalCall: "Llamada de Capital",
    distribution: "Distribución",
    ownership: "Participación",
    capitalDeployed: "Capital Desplegado",
    emptyTitle: "Tu panel está vacío",
    emptyDescription: "Haz clic en \"Agregar Gráfico\" para añadir métricas, gráficos y plantillas a tu panel.",
  },

  // Structure Setup Wizard
  structureSetup: {
    // Common
    title: "Configuración de Estructura",
    subtitle: "Crea y configura tu estructura de inversión",
    step: "Paso",
    of: "de",
    previous: "Anterior",
    next: "Siguiente",
    finish: "Finalizar",
    cancel: "Cancelar",
    save: "Guardar",
    saveDraft: "Guardar Borrador",
    saveAndContinue: "Guardar y Continuar",
    required: "Requerido",
    optional: "Opcional",
    loading: "Cargando...",
    saving: "Guardando...",

    // Validation
    validation: {
      required: "Este campo es requerido",
      invalidEmail: "Por favor ingresa un correo electrónico válido",
      invalidNumber: "Por favor ingresa un número válido",
      minValue: "El valor debe ser al menos",
      maxValue: "El valor no puede exceder",
      minLength: "Debe tener al menos {min} caracteres",
      maxLength: "No puede exceder {max} caracteres",
      invalidPercentage: "El porcentaje debe estar entre 0 y 100",
      invalidDate: "Por favor ingresa una fecha válida",
      futureDate: "La fecha debe ser futura",
      pastDate: "La fecha debe ser pasada",
    },

    // Step 1: Basic Information
    step1: {
      title: "Información Básica",
      subtitle: "Configura los detalles fundamentales de tu estructura",
      structureType: "Tipo de Estructura",
      structureTypeLabel: "Selecciona el tipo de estructura",
      structureTypeDescription: "Elige la estructura legal que mejor se adapte a tu estrategia de inversión",

      // Structure Types (Private Debt removed)
      fund: "Fondo",
      fundDescription: "Fondo de inversión para uno o múltiples proyectos con llamadas de capital",
      saLLC: "SA / SRL",
      saLLCDescription: "Entidad legal de una sola propiedad para riesgo aislado",
      trust: "Fideicomiso / Trust",
      trustDescription: "Estructura de fideicomiso bancario con incentivos fiscales, puede contener múltiples propiedades",

      // Basic Fields
      structureName: "Nombre de la Estructura",
      structureNamePlaceholder: "Ingresa el nombre de la estructura",
      structureNameDescription: "El nombre legal de tu estructura de inversión",

      description: "Descripción",
      descriptionPlaceholder: "Ingresa una breve descripción",
      descriptionDescription: "Una breve descripción de la estructura de inversión y su propósito",

      inceptionDate: "Fecha de Inicio",
      inceptionDateDescription: "La fecha en que se estableció legalmente la estructura",

      currency: "Moneda",
      currencyDescription: "La moneda principal para reportes financieros",

      fiscalYearEnd: "Cierre de Año Fiscal",
      fiscalYearEndDescription: "El mes en que termina el año fiscal",

      // Parent Structure
      parentStructure: "Estructura Padre",
      parentStructureDescription: "Selecciona una estructura padre si esta es una subsidiaria",
      noParent: "Ninguna (Estructura de nivel superior)",
      hierarchyLevel: "Nivel de Jerarquía",
    },

    // Step 2: Jurisdiction
    step2: {
      title: "Jurisdicción y Detalles Legales",
      subtitle: "Configura la jurisdicción e información legal",

      jurisdiction: "Jurisdicción",
      jurisdictionDescription: "El país donde está registrada la estructura",

      state: "Estado / Provincia",
      stateDescription: "El estado o provincia (si aplica)",

      city: "Ciudad",
      cityDescription: "La ciudad donde está registrada la estructura",

      legalEntityId: "ID de Entidad Legal",
      legalEntityIdPlaceholder: "Ingresa RFC o número de registro",
      legalEntityIdDescription: "RFC, EIN o número de registro",

      registrationDate: "Fecha de Registro",
      registrationDateDescription: "La fecha en que se registró la estructura con las autoridades",

      regulatoryBody: "Organismo Regulador",
      regulatoryBodyDescription: "La autoridad reguladora principal que supervisa esta estructura",

      complianceNotes: "Notas de Cumplimiento",
      complianceNotesPlaceholder: "Ingresa notas de cumplimiento",
      complianceNotesDescription: "Cualquier requisito especial de cumplimiento o notas",
    },

    // Step 3: Limited Partners / Investors
    step3: {
      title: "Socios Limitados",
      subtitle: "Configura requisitos y restricciones de inversionistas",

      minInvestors: "Inversionistas Mínimos",
      minInvestorsDescription: "Número mínimo de inversionistas requerido",

      maxInvestors: "Inversionistas Máximos",
      maxInvestorsDescription: "Número máximo de inversionistas permitido",

      minTicketSize: "Monto Mínimo de Inversión",
      minTicketSizeDescription: "Monto mínimo de inversión por inversionista",

      maxTicketSize: "Monto Máximo de Inversión",
      maxTicketSizeDescription: "Monto máximo de inversión por inversionista (0 = sin límite)",

      accreditationRequired: "Acreditación Requerida",
      accreditationRequiredDescription: "Solo permitir inversionistas acreditados",

      kycRequired: "KYC Requerido",
      kycRequiredDescription: "Requerir verificación KYC para todos los inversionistas",

      investorTypes: "Tipos de Inversionistas Permitidos",
      investorTypesDescription: "Selecciona qué tipos de inversionistas están permitidos",
      individual: "Individual",
      institution: "Institución",
      familyOffice: "Oficina Familiar",
      fundOfFunds: "Fondo de Fondos",

      geographicRestrictions: "Restricciones Geográficas",
      geographicRestrictionsDescription: "Restringir inversionistas por país",
      allowedCountries: "Países Permitidos",
      blockedCountries: "Países Bloqueados",

      // CSV Import
      csvImport: "Importar CSV",
      csvImportDescription: "Importar inversionistas desde un archivo CSV",
      uploadCSV: "Subir CSV",
      downloadTemplate: "Descargar Plantilla",
      csvInstructions: "Descarga la plantilla, completa los detalles de los inversionistas y sube",

      // Investor Table
      investorList: "Inversionistas Actuales",
      addInvestor: "Agregar Inversionista",
      editInvestor: "Editar Inversionista",
      removeInvestor: "Eliminar Inversionista",
      noInvestors: "No se han agregado inversionistas aún",
      investorName: "Nombre",
      investorEmail: "Correo Electrónico",
      investorCommitment: "Compromiso",
      investorOwnership: "Participación %",
    },

    // Step 4: Capital Calls
    step4: {
      title: "Llamadas de Capital",
      subtitle: "Configura el calendario y términos de llamadas de capital",

      hasCapitalCalls: "Habilitar Llamadas de Capital",
      hasCapitalCallsDescription: "Esta estructura usará llamadas de capital para financiar inversiones",

      totalCommitment: "Compromiso Total",
      totalCommitmentDescription: "Capital total comprometido por todos los inversionistas",

      commitmentPeriod: "Período de Compromiso",
      commitmentPeriodDescription: "Duración durante la cual se puede llamar capital (en meses)",
      commitmentPeriodMonths: "meses",

      defaultNoticePeriod: "Período de Aviso Predeterminado",
      defaultNoticePeriodDescription: "Número estándar de días de aviso para llamadas de capital",
      defaultNoticePeriodDays: "días",

      callSchedule: "Calendario de Llamadas",
      callScheduleDescription: "Cómo se llamará el capital",
      asNeeded: "Según Necesidad",
      asNeededDescription: "Llamar capital cuando surjan oportunidades de inversión",
      scheduled: "Programado",
      scheduledDescription: "Calendario de llamadas predeterminado",

      numberOfCalls: "Número de Llamadas Planificadas",
      numberOfCallsDescription: "Número esperado de llamadas de capital durante el período de compromiso",

      callFrequency: "Frecuencia de Llamadas",
      callFrequencyDescription: "Con qué frecuencia se realizarán las llamadas de capital",
      monthly: "Mensual",
      quarterly: "Trimestral",
      semiAnnually: "Semestral",
      annually: "Anual",

      // Payment Terms
      paymentTerms: "Términos de Pago",
      paymentTermsDescription: "Términos de pago estándar para llamadas de capital",
      paymentDueDays: "Vencimiento de Pago (Días)",
      paymentDueDaysDescription: "Número de días desde la fecha de llamada hasta la fecha de vencimiento del pago",

      lateFeePercentage: "Cargo por Mora (%)",
      lateFeePercentageDescription: "Porcentaje cobrado por pagos tardíos",

      defaultPaymentMethod: "Método de Pago Predeterminado",
      wire: "Transferencia Bancaria",
      ach: "ACH",
      check: "Cheque",
      polibit: "PoliBit",
      card: "Tarjeta de Crédito/Débito",
    },

    // Step 5: Economic Terms
    step5: {
      title: "Términos Económicos",
      subtitle: "Configura comisiones, interés diferido y estructura de cascada",

      // Management Fees
      managementFee: "Comisión de Administración",
      managementFeeRate: "Tasa de Comisión de Administración (%)",
      managementFeeRateDescription: "Comisión de administración anual como porcentaje del capital comprometido",
      managementFeeCalculation: "Base de Cálculo de Comisión",
      onCommitted: "Sobre Capital Comprometido",
      onInvested: "Sobre Capital Invertido",
      onNAV: "Sobre Valor Neto de Activos",

      managementFeeOffset: "Compensación de Comisión de Administración",
      managementFeeOffsetDescription: "Compensar comisiones de administración contra interés diferido",

      // Performance Fees
      carriedInterest: "Interés Diferido",
      carriedInterestRate: "Tasa de Interés Diferido (%)",
      carriedInterestRateDescription: "Participación del GP en utilidades después del retorno preferente",

      // Waterfall Structure (ILPA Standard)
      waterfallStructure: "Estructura de Cascada",
      waterfallDescription: "Niveles de cascada de distribución (estándar ILPA)",

      tier1: "Nivel 1: Retorno de Capital",
      tier1Description: "100% a LPs hasta que se devuelva todo el capital",

      tier2: "Nivel 2: Retorno Preferente",
      tier2Description: "100% a LPs hasta que se alcance el umbral de retorno preferente",
      preferredReturnRate: "Tasa de Retorno Preferente (%)",
      preferredReturnRateDescription: "Tasa de umbral de retorno preferente anual",

      tier3: "Nivel 3: Alcance del GP",
      tier3Description: "Distribución al GP para igualar la participación de utilidades",
      catchUpRate: "Tasa de Alcance del GP (%)",
      catchUpRateDescription: "Porcentaje de distribuciones al GP durante el alcance",

      tier4: "Nivel 4: Interés Diferido",
      tier4Description: "División de utilidades según tasa de interés diferido",
      carriedInterestSplit: "División de Interés Diferido",
      lpShare: "Participación LP (%)",
      gpShare: "Participación GP (%)",

      // Other Fees
      setupFee: "Comisión de Configuración",
      setupFeeAmount: "Monto de Comisión de Configuración",
      setupFeeDescription: "Comisión única cobrada al inicio de la estructura",

      transactionFees: "Comisiones de Transacción",
      transactionFeeRate: "Tasa de Comisión de Transacción (%)",
      transactionFeeDescription: "Comisión cobrada en cada transacción",

      performanceFee: "Comisión de Rendimiento",
      performanceFeeRate: "Tasa de Comisión de Rendimiento (%)",
      performanceFeeDescription: "Comisión adicional basada en el rendimiento",

      // Fee Periods
      feePaymentFrequency: "Frecuencia de Pago de Comisiones",
      feePaymentFrequencyDescription: "Con qué frecuencia se pagan las comisiones de administración",

      // Hurdle Rates
      hurdleRate: "Tasa de Umbral",
      hurdleRateDescription: "Retorno mínimo antes de que apliquen comisiones de rendimiento",
      hurdleType: "Tipo de Umbral",
      hard: "Umbral Duro",
      soft: "Umbral Blando",
    },

    // Step 6: Documents & Payment
    step6: {
      title: "Documentos y Métodos de Pago",
      subtitle: "Configura métodos de pago y documentos rectores",

      // Payment Methods
      paymentMethods: "Métodos de Pago Aceptados",
      paymentMethodsDescription: "Selecciona todos los métodos de pago que deseas aceptar",
      paymentMethodWire: "Transferencia Bancaria",
      paymentMethodInternational: "Transferencia Internacional",
      paymentMethodCrypto: "Criptomoneda",
      paymentMethodPoliBit: "PoliBit",
      paymentMethodCard: "Tarjeta de Crédito/Débito",

      // Bank Details
      bankDetails: "Detalles de Cuenta Bancaria",
      bankName: "Nombre del Banco",
      bankNameDescription: "Nombre del banco receptor",
      accountName: "Nombre de la Cuenta",
      accountNameDescription: "Nombre en la cuenta",
      accountNumber: "Número de Cuenta",
      accountNumberDescription: "Número de cuenta bancaria",
      routingNumber: "Número de Ruta",
      routingNumberDescription: "Número de ruta bancaria (ABA/ACH)",
      swiftCode: "Código SWIFT/BIC",
      swiftCodeDescription: "Identificador bancario internacional",
      iban: "IBAN",
      ibanDescription: "Número de Cuenta Bancaria Internacional",

      // Crypto Wallet
      cryptoWallet: "Billetera de Criptomoneda",
      cryptoWalletAddress: "Dirección de Billetera",
      cryptoWalletAddressDescription: "Dirección de billetera de criptomoneda para recibir pagos",
      cryptoNetwork: "Red",
      cryptoNetworkDescription: "Red blockchain (ej. Ethereum, Bitcoin)",

      // Governing Documents
      governingDocuments: "Documentos Rectores",
      governingDocumentsDescription: "Sube o enlaza documentos rectores clave",

      ppm: "Memorándum de Colocación Privada (PPM)",
      ppmDescription: "Documento principal de oferta",
      uploadPPM: "Subir PPM",

      lpa: "Acuerdo de Sociedad Limitada (LPA)",
      lpaDescription: "Acuerdo de asociación",
      uploadLPA: "Subir LPA",

      subscription: "Acuerdo de Suscripción",
      subscriptionDescription: "Documento de suscripción del inversionista",
      uploadSubscription: "Subir Acuerdo de Suscripción",

      sideLetters: "Cartas Laterales",
      sideLettersDescription: "Cualquier acuerdo de carta lateral",
      uploadSideLetter: "Subir Carta Lateral",

      // Document Management
      documentName: "Nombre del Documento",
      documentType: "Tipo de Documento",
      uploadDate: "Fecha de Subida",
      uploadedBy: "Subido por",
      actions: "Acciones",
      download: "Descargar",
      delete: "Eliminar",
      view: "Ver",
    },

    // Step 7: Review & Submit
    step7: {
      title: "Revisar y Enviar",
      subtitle: "Revisa todos los detalles antes de crear tu estructura",

      reviewInstructions: "Por favor revisa toda la información cuidadosamente. Puedes regresar para editar cualquier sección.",

      // Section Headers
      basicInfo: "Información Básica",
      jurisdictionInfo: "Jurisdicción y Legal",
      investorInfo: "Socios Limitados",
      capitalCallsInfo: "Llamadas de Capital",
      economicTermsInfo: "Términos Económicos",
      documentsInfo: "Documentos y Pago",

      // Actions
      createStructure: "Crear Estructura",
      goBack: "Volver para Editar",

      // Confirmation
      confirmTitle: "Confirmar Creación de Estructura",
      confirmMessage: "¿Estás seguro de que deseas crear esta estructura? Esta acción no se puede deshacer.",
      confirmYes: "Sí, Crear Estructura",
      confirmNo: "Cancelar",

      // Success
      successTitle: "¡Estructura Creada Exitosamente!",
      successMessage: "Tu estructura ha sido creada y está lista para usar.",
      viewStructure: "Ver Estructura",
      createAnother: "Crear Otra Estructura",
      goToDashboard: "Ir al Panel",

      // Error
      errorTitle: "Error al Crear Estructura",
      errorMessage: "Hubo un error al crear tu estructura. Por favor intenta de nuevo.",
      tryAgain: "Intentar de Nuevo",
    },

    // Progress Indicator
    progress: {
      notStarted: "No Iniciado",
      inProgress: "En Progreso",
      completed: "Completado",
      current: "Paso Actual",
    },

    // Help Text
    help: {
      needHelp: "¿Necesitas ayuda?",
      contactSupport: "Contactar soporte",
      viewDocumentation: "Ver documentación",
      chatWithUs: "Chatea con nosotros",
    },
  },

  // Contract Management
  contracts: {
    title: "Administración de Contratos",
    subtitle: "Administra plantillas de contratos, asignaciones de estructuras y contrafirmas",

    // Tabs
    templatesTab: "Plantillas",
    assignmentsTab: "Asignaciones de Estructura",
    countersignaturesTab: "Contrafirmas",

    // Templates
    createTemplate: "Crear Plantilla",
    editTemplate: "Editar Plantilla",
    deleteTemplate: "Eliminar Plantilla",
    noTemplates: "Sin Plantillas",
    noTemplatesDescription: "Comienza creando tu primera plantilla de contrato",
    templateName: "Nombre de Plantilla",
    templateNamePlaceholder: "ej., Acuerdo de Suscripción Estándar",
    docusealUrl: "URL de Plantilla DocuSeal",
    docusealUrlPlaceholder: "https://docuseal.co/templates/...",
    templateType: "Tipo de Plantilla",
    templateTypes: {
      subscription: "Suscripción",
      lpa: "LPA",
      sideLetter: "Carta Lateral",
      other: "Otro",
    },
    jurisdiction: "Jurisdicción",
    category: "Categoría",
    categories: {
      investor: "Inversionista",
      fund: "Fondo",
      general: "General",
    },
    status: "Estado",
    statuses: {
      active: "Activo",
      inactive: "Inactivo",
      draft: "Borrador",
    },
    templateCreated: "Plantilla creada exitosamente",
    templateUpdated: "Plantilla actualizada exitosamente",
    templateDeleted: "Plantilla eliminada exitosamente",

    // Assignments
    assignContract: "Asignar Contrato",
    assignContractTo: "Asignar Contrato a Estructura",
    assignContractDescription: "Selecciona una estructura y plantilla de contrato para crear una asignación",
    noAssignments: "Sin Asignaciones",
    noAssignmentsDescription: "Asigna contratos a estructuras para automatizar el flujo de firma",
    structure: "Estructura",
    selectStructure: "Seleccionar estructura",
    contractTemplate: "Plantilla de Contrato",
    selectTemplate: "Seleccionar plantilla",
    triggerPoint: "Punto de Activación",
    triggerPoints: {
      prePayment: "Pre-Pago",
      postPayment: "Post-Pago",
      postClosing: "Post-Cierre",
      onDemand: "Bajo Demanda",
    },
    required: "Requerido",
    requiredDescription: "El inversionista debe firmar este contrato",
    optional: "Opcional",
    blocking: "Bloqueante",
    blockingDescription: "Bloquear pago hasta que se firme",
    nonBlocking: "No Bloqueante",
    assignmentCreated: "Contrato asignado a estructura exitosamente",
    assignmentDeleted: "Asignación eliminada exitosamente",

    // Countersignatures
    noCountersignatures: "Sin Contrafirmas",
    noCountersignaturesDescription: "Las firmas de inversionistas que requieren contrafirma aparecerán aquí",
    investor: "Inversionista",
    contract: "Contrato",
    signedAt: "Firmado el",
    approve: "Aprobar",
    reject: "Rechazar",
    countersignatureApproved: "Contrafirma aprobada",
    countersignatureRejected: "Contrafirma rechazada",
    viewDocument: "Ver Documento",

    // Common
    actions: "Acciones",
    cancel: "Cancelar",
    create: "Crear",
    update: "Actualizar",
    delete: "Eliminar",
    assign: "Asignar",
    fillRequired: "Por favor completa todos los campos requeridos",
    selectBoth: "Por favor selecciona tanto estructura como plantilla",
    invalidSelection: "Estructura o plantilla inválida",

    // Table Headers
    name: "Nombre",
    type: "Tipo",
    createdAt: "Creado el",
    updatedAt: "Actualizado el",
  },
}
