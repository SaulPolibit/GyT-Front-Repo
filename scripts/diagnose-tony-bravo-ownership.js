// Diagnostic script to check Tony Bravo's ownership data
// Run this in the browser console while on any Investment Manager page

console.log('=== Diagnosing Tony Bravo Ownership Issue ===\n')

// Get investors from localStorage
const investors = JSON.parse(localStorage.getItem('polibit_investors') || '[]')
console.log(`Found ${investors.length} investors in localStorage`)

// Find Tony Bravo
const tonyBravo = investors.find(inv =>
  inv.name === 'Tony Bravo' || inv.email?.toLowerCase().includes('tonybravo') || inv.id === 'tony-bravo'
)

if (!tonyBravo) {
  console.error('❌ Tony Bravo not found in localStorage')
  console.log('Available investors:', investors.map(inv => `${inv.name} (${inv.email})`).join(', '))
} else {
  console.log(`✅ Found: ${tonyBravo.name}`)
  console.log(`   ID: ${tonyBravo.id}`)
  console.log(`   Email: ${tonyBravo.email}`)
  console.log(`   Global Status: ${tonyBravo.status}`)
  console.log(`   Fund Ownerships: ${tonyBravo.fundOwnerships?.length || 0}`)

  if (!tonyBravo.fundOwnerships || tonyBravo.fundOwnerships.length === 0) {
    console.log('\n⚠️  No fund ownerships found')
  } else {
    console.log('\n📋 Fund Ownership Details:\n')

    tonyBravo.fundOwnerships.forEach((fo, index) => {
      console.log(`${index + 1}. ${fo.fundName} (${fo.fundId})`)
      console.log(`   Commitment: $${fo.commitment?.toLocaleString() || 0}`)
      console.log(`   Ownership Percent: ${fo.ownershipPercent}%`)
      console.log(`   Called Capital: $${fo.calledCapital?.toLocaleString() || 0}`)
      console.log(`   Uncalled Capital: $${fo.uncalledCapital?.toLocaleString() || 0}`)
      console.log(`   Hierarchy Level: ${fo.hierarchyLevel || 'undefined'}`)
      console.log(`   Invested Date: ${fo.investedDate}`)
      console.log(`   Onboarding Status: ${fo.onboardingStatus || 'undefined'}`)

      // Check for zero ownership
      if (fo.ownershipPercent === 0 || fo.ownershipPercent === undefined) {
        console.log(`   ⚠️  ISSUE: Ownership percent is ${fo.ownershipPercent}`)
      }
      console.log('')
    })
  }

  // Get structures to see hierarchy
  const structures = JSON.parse(localStorage.getItem('polibit_structures') || '[]')
  console.log('\n📊 Related Structures:')

  const masterTrust = structures.find(s => s.name.includes('Master Trust'))
  if (masterTrust) {
    console.log(`\n   Master Trust: ${masterTrust.name}`)
    console.log(`   ID: ${masterTrust.id}`)
    console.log(`   Hierarchy Level: ${masterTrust.hierarchyLevel}`)
    console.log(`   Total Commitment: $${masterTrust.totalCommitment?.toLocaleString() || 0}`)
  }

  const investmentTrust = structures.find(s => s.name.includes('Investment Trust'))
  if (investmentTrust) {
    console.log(`\n   Investment Trust: ${investmentTrust.name}`)
    console.log(`   ID: ${investmentTrust.id}`)
    console.log(`   Hierarchy Level: ${investmentTrust.hierarchyLevel}`)
    console.log(`   Total Commitment: $${investmentTrust.totalCommitment?.toLocaleString() || 0}`)
    console.log(`   Parent Structure ID: ${investmentTrust.parentStructureId}`)
    console.log(`   Ownership of Parent: ${investmentTrust.ownershipOfParent}%`)
  }
}

console.log('\n=== Diagnosis Complete ===')
console.log('\nTo fix the issue, run: fix-tony-bravo-ownership.js')
