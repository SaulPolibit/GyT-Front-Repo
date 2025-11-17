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
    investments: "Inversiones",
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
    sa: "SA / SRL / SPV",
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
    saLLC: "SA / SRL / SPV",
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
  },
}
