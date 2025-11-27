/**
 * Demo Data Seeder
 * This script creates realistic demo data for the Polibit platform
 * Run this once to populate localStorage with structures, investors, capital calls, and distributions
 */

import { saveStructure, clearStructures } from './structures-storage'
import { clearInvestments } from './investments-storage'
import { saveInvestor, clearInvestors } from './investors-storage'
import { saveCapitalCall } from './capital-calls-storage'
import { saveDistribution } from './distributions-storage'
import { clearInvestmentSubscriptions } from './investment-subscriptions-storage'
import { saveDashboardConfig, getDefaultDashboard } from './lp-dashboard-storage'
import type { Structure } from './structures-storage'

export function seedDemoData() {
  if (typeof window === 'undefined') {
    console.log('Demo data seeding only works in the browser')
    return
  }

  console.log('🌱 Starting demo data seeding...')

  // COMPREHENSIVE localStorage cleanup - clear ALL known storage keys
  const keysToRemove = [
    'polibit_structures',
    'polibit_investments',
    'polibit_investors',
    'polibit_investment_subscriptions',
    'polibit_capital_calls',
    'polibit_distributions',
    'polibit_firm_settings',
    'polibit_current_investor_email',
  ]

  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key)
      console.log(`  ✓ Cleared ${key}`)
    } catch (error) {
      console.error(`  ✗ Failed to clear ${key}:`, error)
    }
  })

  // Also call the explicit clear functions as backup
  clearStructures()
  clearInvestments()
  clearInvestors()
  clearInvestmentSubscriptions()
  localStorage.removeItem('polibit_capital_calls')
  localStorage.removeItem('polibit_distributions')

  console.log('✅ Cleared all existing data')

  // ==================== STRUCTURES ====================
  const fundAlpha = saveStructure({
    name: 'Alpha Real Estate Fund',
    type: 'fund',
    subtype: 'Multifamily',
    jurisdiction: 'United States',
    totalCommitment: 50000000,
    currency: 'USD',
    managementFee: '2.0',
    performanceFee: '20.0',
    hurdleRate: '8.0',
    preferredReturn: '8.0',
    plannedInvestments: '15',
    investors: 25,
    status: 'active',
    createdDate: new Date('2023-01-15'),
    inceptionDate: new Date('2023-01-15'),
  } as any)

  const fundBeta = saveStructure({
    name: 'Beta Technology Fund',
    type: 'fund',
    subtype: 'Software',
    jurisdiction: 'United States',
    totalCommitment: 100000000,
    currency: 'USD',
    managementFee: '2.5',
    performanceFee: '25.0',
    hurdleRate: '10.0',
    preferredReturn: '10.0',
    plannedInvestments: '12',
    investors: 30,
    status: 'active',
    createdDate: new Date('2022-06-01'),
    inceptionDate: new Date('2022-06-01'),
  } as any)

  const fundGamma = saveStructure({
    name: 'Gamma Private Debt Fund',
    type: 'fund',
    subtype: 'Senior Debt',
    jurisdiction: 'Panama',
    totalCommitment: 75000000,
    currency: 'USD',
    managementFee: '1.5',
    performanceFee: '15.0',
    hurdleRate: '6.0',
    preferredReturn: '6.0',
    plannedInvestments: '20',
    investors: 20,
    status: 'active',
    createdDate: new Date('2023-03-20'),
    inceptionDate: new Date('2023-03-20'),
  } as any)

  // Create a child structure under Alpha Real Estate Fund
  console.log('📝 Creating child structure with parent ID:', fundAlpha.id)
  const alphaProjectSA = saveStructure({
    name: 'Alpha Project 1 - Residential Complex',
    type: 'sa',
    subtype: '',
    jurisdiction: 'United States',
    usState: 'CA',
    totalCommitment: 12500000,
    currency: 'USD',
    plannedInvestments: '1',
    investors: 8,
    status: 'active',
    createdDate: new Date('2023-02-01'),
    inceptionDate: new Date('2023-02-01'),
    parentStructureId: fundAlpha.id,
    parentStructureOwnershipPercentage: 60,
    hierarchyLevel: 2,
  } as any)

  console.log('✅ Saved child structure:', {
    id: alphaProjectSA.id,
    name: alphaProjectSA.name,
    parentStructureId: alphaProjectSA.parentStructureId,
    parentStructureOwnershipPercentage: alphaProjectSA.parentStructureOwnershipPercentage
  })

  console.log('✅ Created 3 fund structures + 1 child structure')

  // ==================== INVESTORS ====================
  const investor1 = saveInvestor({
    name: 'Acme Capital Partners',
    email: 'contact@acmecap.com',
    type: 'institution',
    status: 'Active',
    entityName: 'Acme Capital Partners LLC',
    fundOwnerships: [
      {
        fundId: fundAlpha.id,
        fundName: fundAlpha.name,
        commitment: 5000000,
        ownershipPercent: 10,
        calledCapital: 3500000,
        uncalledCapital: 1500000,
        investedDate: new Date('2023-01-20').toISOString(),
      },
      {
        fundId: fundBeta.id,
        fundName: fundBeta.name,
        commitment: 10000000,
        ownershipPercent: 10,
        calledCapital: 8000000,
        uncalledCapital: 2000000,
        investedDate: new Date('2023-06-01').toISOString(),
      },
    ],
    currentValue: 18500000,
    unrealizedGain: 2100000,
    totalDistributed: 850000,
    netCashFlow: -14650000,
    irr: 14.2,
    phone: '+1 (212) 555-0101',
    address: {
      street: '100 Park Avenue',
      city: 'New York',
      state: 'NY',
      zipCode: '10017',
      country: 'United States',
    },
    preferredContactMethod: 'Email',
    notes: 'Long-term strategic partner. Prefers quarterly reports.',
    documents: [],
    investorSince: new Date('2023-01-20').toISOString(),
    createdAt: new Date('2023-01-20').toISOString(),
    updatedAt: new Date().toISOString(),
    k1Status: 'Not Started',
  } as any)

  const investor2 = saveInvestor({
    name: 'Global Wealth Management',
    email: 'investments@globalwealth.com',
    type: 'family-office',
    status: 'Active',
    entityName: 'Global Wealth Management Ltd',
    contactFirstName: 'Sarah',
    contactLastName: 'Chen',
    fundOwnerships: [
      {
        fundId: fundAlpha.id,
        fundName: fundAlpha.name,
        commitment: 8000000,
        ownershipPercent: 16,
        calledCapital: 6400000,
        uncalledCapital: 1600000,
        investedDate: new Date('2023-02-10').toISOString(),
      },
    ],
    currentValue: 8950000,
    unrealizedGain: 950000,
    totalDistributed: 0,
    netCashFlow: -6400000,
    irr: 11.8,
    phone: '+1 (212) 555-0102',
    address: {
      street: '1 Embarcadero Center',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94111',
      country: 'United States',
    },
    preferredContactMethod: 'Email',
    notes: 'Family office focused on RE. Active in board meetings.',
    documents: [],
    investorSince: new Date('2023-02-10').toISOString(),
    createdAt: new Date('2023-02-10').toISOString(),
    updatedAt: new Date().toISOString(),
    k1Status: 'In Progress',
  } as any)

  const investor3 = saveInvestor({
    name: 'Pacific Tech Ventures',
    email: 'team@pacifictech.vc',
    type: 'institution',
    status: 'Active',
    entityName: 'Pacific Tech Ventures Fund II',
    fundOwnerships: [
      {
        fundId: fundBeta.id,
        fundName: fundBeta.name,
        commitment: 25000000,
        ownershipPercent: 25,
        calledCapital: 18000000,
        uncalledCapital: 7000000,
        investedDate: new Date('2022-06-15').toISOString(),
      },
    ],
    currentValue: 31200000,
    unrealizedGain: 13200000,
    totalDistributed: 2100000,
    netCashFlow: -15900000,
    irr: 28.5,
    phone: '+1 (650) 555-0103',
    address: {
      street: '2560 Mission Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94110',
      country: 'United States',
    },
    preferredContactMethod: 'Email',
    notes: 'Early-stage investor, very active in portfolio companies.',
    documents: [],
    investorSince: new Date('2022-06-15').toISOString(),
    createdAt: new Date('2022-06-15').toISOString(),
    updatedAt: new Date().toISOString(),
    k1Status: 'Completed',
  } as any)

  const investor4 = saveInvestor({
    name: 'European Infrastructure Fund',
    email: 'info@euinfra.eu',
    type: 'fund-of-funds',
    status: 'Active',
    entityName: 'European Infrastructure & Debt Fund',
    fundOwnerships: [
      {
        fundId: fundGamma.id,
        fundName: fundGamma.name,
        commitment: 30000000,
        ownershipPercent: 40,
        calledCapital: 22500000,
        uncalledCapital: 7500000,
        investedDate: new Date('2023-03-25').toISOString(),
      },
    ],
    currentValue: 38750000,
    unrealizedGain: 16250000,
    totalDistributed: 3500000,
    netCashFlow: -19000000,
    irr: 19.3,
    phone: '+44 20 7946 0900',
    address: {
      street: '10 Downing Street',
      city: 'London',
      state: '',
      zipCode: 'SW1A 2AA',
      country: 'United Kingdom',
    },
    preferredContactMethod: 'Email',
    notes: 'European institutional investor, monthly reporting required.',
    documents: [],
    investorSince: new Date('2023-03-25').toISOString(),
    createdAt: new Date('2023-03-25').toISOString(),
    updatedAt: new Date().toISOString(),
    k1Status: 'Not Started',
  } as any)

  const investor5 = saveInvestor({
    name: 'Mexican Pension Fund',
    email: 'admin@mxpension.mx',
    type: 'institution',
    status: 'Active',
    entityName: 'Mexican Pension Fund Corporation',
    fundOwnerships: [
      {
        fundId: fundGamma.id,
        fundName: fundGamma.name,
        commitment: 15000000,
        ownershipPercent: 20,
        calledCapital: 11250000,
        uncalledCapital: 3750000,
        investedDate: new Date('2023-03-30').toISOString(),
      },
    ],
    currentValue: 18500000,
    unrealizedGain: 7250000,
    totalDistributed: 1250000,
    netCashFlow: -10000000,
    irr: 15.8,
    phone: '+52 55 5265 8500',
    address: {
      street: 'Paseo de la Reforma 505',
      city: 'Mexico City',
      state: '',
      zipCode: '06500',
      country: 'Mexico',
    },
    preferredContactMethod: 'Email',
    notes: 'Regulated investor, quarterly compliance reporting needed.',
    documents: [],
    investorSince: new Date('2023-03-30').toISOString(),
    createdAt: new Date('2023-03-30').toISOString(),
    updatedAt: new Date().toISOString(),
    k1Status: 'Delivered',
  } as any)

  console.log('✅ Created 5 investors')

  // ==================== CAPITAL CALLS ====================
  const capCall1 = saveCapitalCall({
    fundId: fundAlpha.id,
    fundName: fundAlpha.name,
    callNumber: 1,
    totalCallAmount: 15000000,
    currency: 'USD',
    callDate: new Date('2023-02-01').toISOString(),
    dueDate: new Date('2023-02-28').toISOString(),
    noticePeriodDays: 10,
    purpose: 'Capital deployment for fund operations and management fees',
    status: 'Fully Paid',
    sentDate: new Date('2023-02-01').toISOString(),
    investorAllocations: [
      {
        investorId: investor1.id,
        investorName: investor1.name,
        investorType: 'institution',
        commitment: 5000000,
        ownershipPercent: 10,
        callAmount: 1500000,
        status: 'Paid',
        amountPaid: 1500000,
        amountOutstanding: 0,
        paidDate: new Date('2023-02-15').toISOString(),
        paymentMethod: 'Wire Transfer',
        transactionReference: 'WT-2023-0152',
        noticeSent: true,
        noticeSentDate: new Date('2023-02-01').toISOString(),
        noticeOpenedDate: new Date('2023-02-02').toISOString(),
        calledCapitalToDate: 1500000,
        uncalledCapital: 3500000,
      },
      {
        investorId: investor2.id,
        investorName: investor2.name,
        investorType: 'family-office',
        commitment: 8000000,
        ownershipPercent: 16,
        callAmount: 2400000,
        status: 'Paid',
        amountPaid: 2400000,
        amountOutstanding: 0,
        paidDate: new Date('2023-02-20').toISOString(),
        paymentMethod: 'Wire Transfer',
        transactionReference: 'WT-2023-0201',
        noticeSent: true,
        noticeSentDate: new Date('2023-02-01').toISOString(),
        noticeOpenedDate: new Date('2023-02-03').toISOString(),
        calledCapitalToDate: 2400000,
        uncalledCapital: 5600000,
      },
    ],
    totalPaidAmount: 3900000,
    totalOutstandingAmount: 0,
    transactionType: 'Capital Contribution',
    useOfProceeds: 'Property Acquisition',
    managementFeeIncluded: false,
    createdBy: 'admin@polibit.io',
    createdAt: new Date('2023-02-01').toISOString(),
    updatedAt: new Date('2023-02-20').toISOString(),
  } as any)

  const capCall2 = saveCapitalCall({
    fundId: fundBeta.id,
    fundName: fundBeta.name,
    callNumber: 1,
    totalCallAmount: 75000000,
    currency: 'USD',
    callDate: new Date('2023-06-15').toISOString(),
    dueDate: new Date('2023-07-15').toISOString(),
    noticePeriodDays: 15,
    purpose: 'Capital deployment for portfolio expansion',
    status: 'Fully Paid',
    sentDate: new Date('2023-06-15').toISOString(),
    investorAllocations: [
      {
        investorId: investor1.id,
        investorName: investor1.name,
        investorType: 'institution',
        commitment: 10000000,
        ownershipPercent: 10,
        callAmount: 7500000,
        status: 'Paid',
        amountPaid: 7500000,
        amountOutstanding: 0,
        paidDate: new Date('2023-07-10').toISOString(),
        paymentMethod: 'Wire Transfer',
        transactionReference: 'WT-2023-0456',
        noticeSent: true,
        noticeSentDate: new Date('2023-06-15').toISOString(),
        noticeOpenedDate: new Date('2023-06-16').toISOString(),
        calledCapitalToDate: 7500000,
        uncalledCapital: 2500000,
      },
      {
        investorId: investor3.id,
        investorName: investor3.name,
        investorType: 'institution',
        commitment: 25000000,
        ownershipPercent: 25,
        callAmount: 18750000,
        status: 'Paid',
        amountPaid: 18750000,
        amountOutstanding: 0,
        paidDate: new Date('2023-07-05').toISOString(),
        paymentMethod: 'Wire Transfer',
        transactionReference: 'WT-2023-0420',
        noticeSent: true,
        noticeSentDate: new Date('2023-06-15').toISOString(),
        noticeOpenedDate: new Date('2023-06-17').toISOString(),
        calledCapitalToDate: 18750000,
        uncalledCapital: 6250000,
      },
    ],
    totalPaidAmount: 26250000,
    totalOutstandingAmount: 0,
    transactionType: 'Capital Contribution',
    useOfProceeds: 'Investment Deployment',
    managementFeeIncluded: false,
    createdBy: 'admin@polibit.io',
    createdAt: new Date('2023-06-15').toISOString(),
    updatedAt: new Date('2023-07-10').toISOString(),
  } as any)

  console.log('✅ Created 2 capital calls')

  // ==================== DISTRIBUTIONS ====================
  const distribution1 = saveDistribution({
    fundId: fundAlpha.id,
    fundName: fundAlpha.name,
    distributionNumber: 1,
    totalDistributionAmount: 2100000,
    currency: 'USD',
    distributionDate: new Date('2023-09-30').toISOString(),
    recordDate: new Date('2023-09-30').toISOString(),
    paymentDate: new Date('2023-10-15').toISOString(),
    source: 'Operating Income',
    sourceDescription: 'Quarterly distributions from fund operations',
    isReturnOfCapital: false,
    isIncome: true,
    isCapitalGain: false,
    incomeAmount: 2100000,
    status: 'Completed',
    processedDate: new Date('2023-10-15').toISOString(),
    investorAllocations: [
      {
        investorId: investor1.id,
        investorName: investor1.name,
        investorType: 'institution',
        ownershipPercent: 10,
        baseAllocation: 210000,
        finalAllocation: 210000,
        incomeAmount: 210000,
        status: 'Completed',
        processedDate: new Date('2023-10-15').toISOString(),
        dpi: 0.06,
      },
      {
        investorId: investor2.id,
        investorName: investor2.name,
        investorType: 'family-office',
        ownershipPercent: 16,
        baseAllocation: 336000,
        finalAllocation: 336000,
        incomeAmount: 336000,
        status: 'Completed',
        processedDate: new Date('2023-10-15').toISOString(),
        dpi: 0.052,
      },
    ],
    waterfallApplied: false,
    createdBy: 'admin@polibit.io',
    createdAt: new Date('2023-09-30').toISOString(),
    updatedAt: new Date('2023-10-15').toISOString(),
  } as any)

  const distribution2 = saveDistribution({
    fundId: fundBeta.id,
    fundName: fundBeta.name,
    distributionNumber: 1,
    totalDistributionAmount: 5200000,
    currency: 'USD',
    distributionDate: new Date('2023-11-01').toISOString(),
    recordDate: new Date('2023-11-01').toISOString(),
    paymentDate: new Date('2023-11-20').toISOString(),
    source: 'Operating Income',
    sourceDescription: 'Q3 operating distributions from portfolio companies',
    status: 'Completed',
    processedDate: new Date('2023-11-20').toISOString(),
    investorAllocations: [
      {
        investorId: investor1.id,
        investorName: investor1.name,
        investorType: 'institution',
        ownershipPercent: 10,
        baseAllocation: 520000,
        finalAllocation: 520000,
        incomeAmount: 520000,
        status: 'Completed',
        processedDate: new Date('2023-11-20').toISOString(),
        dpi: 0.065,
      },
      {
        investorId: investor3.id,
        investorName: investor3.name,
        investorType: 'institution',
        ownershipPercent: 25,
        baseAllocation: 1300000,
        finalAllocation: 1300000,
        incomeAmount: 1300000,
        status: 'Completed',
        processedDate: new Date('2023-11-20').toISOString(),
        dpi: 0.072,
      },
    ],
    waterfallApplied: false,
    createdBy: 'admin@polibit.io',
    createdAt: new Date('2023-11-01').toISOString(),
    updatedAt: new Date('2023-11-20').toISOString(),
  } as any)

  const distribution3 = saveDistribution({
    fundId: fundGamma.id,
    fundName: fundGamma.name,
    distributionNumber: 1,
    totalDistributionAmount: 4750000,
    currency: 'USD',
    distributionDate: new Date('2023-10-31').toISOString(),
    recordDate: new Date('2023-10-31').toISOString(),
    paymentDate: new Date('2023-11-15').toISOString(),
    source: 'Operating Income',
    sourceDescription: 'Interest income from debt positions',
    status: 'Completed',
    processedDate: new Date('2023-11-15').toISOString(),
    investorAllocations: [
      {
        investorId: investor4.id,
        investorName: investor4.name,
        investorType: 'fund-of-funds',
        ownershipPercent: 40,
        baseAllocation: 1900000,
        finalAllocation: 1900000,
        incomeAmount: 1900000,
        status: 'Completed',
        processedDate: new Date('2023-11-15').toISOString(),
        dpi: 0.084,
      },
      {
        investorId: investor5.id,
        investorName: investor5.name,
        investorType: 'institution',
        ownershipPercent: 20,
        baseAllocation: 950000,
        finalAllocation: 950000,
        incomeAmount: 950000,
        status: 'Completed',
        processedDate: new Date('2023-11-15').toISOString(),
        dpi: 0.084,
      },
    ],
    waterfallApplied: false,
    createdBy: 'admin@polibit.io',
    createdAt: new Date('2023-10-31').toISOString(),
    updatedAt: new Date('2023-11-15').toISOString(),
  } as any)

  console.log('✅ Created 3 distributions')

  // ==================== LP DASHBOARD ====================
  console.log('📊 Initializing LP Dashboard...')
  try {
    const defaultDashboard = getDefaultDashboard()
    saveDashboardConfig(defaultDashboard)
    console.log('✅ LP Dashboard configured')
  } catch (error) {
    console.error('⚠️ Error configuring LP Dashboard:', error)
  }

  // VALIDATION: Check for duplicate IDs
  console.log('🔍 Validating data integrity...')
  try {
    const investmentsData = localStorage.getItem('polibit_investments')
    if (investmentsData) {
      const investments = JSON.parse(investmentsData)
      const ids = investments.map((inv: any) => inv.id)
      const duplicates = ids.filter((id: string, index: number) => ids.indexOf(id) !== index)

      if (duplicates.length > 0) {
        console.error('⚠️ DUPLICATE INVESTMENT IDS FOUND:', duplicates)
        console.error('This may cause React key errors. Please refresh and reload demo data.')
      } else {
        console.log(`✓ All ${investments.length} investment IDs are unique`)
      }
    }
  } catch (error) {
    console.error('⚠️ Error validating investments:', error)
  }

  console.log('')
  console.log('🎉 Demo data seeding completed successfully!')
  console.log('')
  console.log('Summary:')
  console.log('  - 3 Funds/Structures')
  console.log('  - 5 Investors with fund ownerships')
  console.log('  - 2 Capital Calls with investor allocations')
  console.log('  - 3 Distributions with investor allocations')
  console.log('  - LP Dashboard configured with default widgets')
  console.log('')
  console.log('✨ Demo data setup complete!')
  console.log('')
  console.log('Try logging in as an investor:')
  console.log('  • Acme Capital Partners: contact@acmecap.com')
  console.log('  • Global Wealth Management: investments@globalwealth.com')
  console.log('  • Pacific Tech Ventures: team@pacifictech.vc')
  console.log('  • European Infrastructure Fund: info@euinfra.eu')
  console.log('  • Mexican Pension Fund: admin@mxpension.mx')
  console.log('')
  console.log('You will see your portfolio, capital calls, and distributions!')
}

// Verify demo data - includes duplicate detection
export function verifyDemoData() {
  if (typeof window === 'undefined') return

  const structures = localStorage.getItem('polibit_structures')
  const investments = localStorage.getItem('polibit_investments')
  const investors = localStorage.getItem('polibit_investors')
  const capitalCalls = localStorage.getItem('polibit_capital_calls')
  const distributions = localStorage.getItem('polibit_distributions')

  console.log('🔍 Demo Data Verification:')

  // Check structures
  const structuresArray = structures ? JSON.parse(structures) : []
  console.log('  Structures:', structuresArray.length)

  // Check investments for duplicates
  const investmentsArray = investments ? JSON.parse(investments) : []
  console.log('  Investments:', investmentsArray.length)
  const invIds = investmentsArray.map((inv: any) => inv.id)
  const invDuplicates = invIds.filter((id: string, index: number) => invIds.indexOf(id) !== index)
  if (invDuplicates.length > 0) {
    console.error('    ⚠️ DUPLICATE INVESTMENT IDS:', invDuplicates)
  } else {
    console.log('    ✓ All investment IDs are unique')
  }

  // Check investors for duplicates
  const investorsArray = investors ? JSON.parse(investors) : []
  console.log('  Investors:', investorsArray.length)
  const invstIds = investorsArray.map((inv: any) => inv.id)
  const invstDuplicates = invstIds.filter((id: string, index: number) => invstIds.indexOf(id) !== index)
  if (invstDuplicates.length > 0) {
    console.error('    ⚠️ DUPLICATE INVESTOR IDS:', invstDuplicates)
  } else {
    console.log('    ✓ All investor IDs are unique')
  }

  // Check capital calls
  const capitalCallsArray = capitalCalls ? JSON.parse(capitalCalls) : []
  console.log('  Capital Calls:', capitalCallsArray.length)

  // Check distributions
  const distributionsArray = distributions ? JSON.parse(distributions) : []
  console.log('  Distributions:', distributionsArray.length)
}
