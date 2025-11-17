// Script to fix Tony Bravo's ownership percent in Master Trust
// Run this in the browser console while on any Investment Manager page
//
// FORMULA: ownershipPercent = (commitment / structure.totalCommitment) * 100
// This is the COMMITMENT-BASED formula used for capital calls and investor management
//
// Note: There are 3 different ownership formulas in the codebase:
// 1. Commitment-based (this script) - for capital calls, investor lists
// 2. Called-capital-based - for Cap Table showing actual ownership
// 3. Capital-contributed-based - for waterfall distributions
//
// See docs/ownership-percent-calculation-analysis.md for details

console.log('=== Fixing Tony Bravo Ownership Percent ===\n')

// Get data from localStorage
const investors = JSON.parse(localStorage.getItem('polibit_investors') || '[]')
const structures = JSON.parse(localStorage.getItem('polibit_structures') || '[]')

console.log(`Found ${investors.length} investors in localStorage`)
console.log(`Found ${structures.length} structures in localStorage`)

// Find Tony Bravo
const tonyBravoIndex = investors.findIndex(inv =>
  inv.name === 'Tony Bravo' || inv.email?.toLowerCase().includes('tonybravo') || inv.id === 'tony-bravo'
)

if (tonyBravoIndex === -1) {
  console.error('❌ Tony Bravo not found in localStorage')
} else {
  const tonyBravo = investors[tonyBravoIndex]
  console.log(`✅ Found: ${tonyBravo.name} (${tonyBravo.id})`)

  if (!tonyBravo.fundOwnerships || tonyBravo.fundOwnerships.length === 0) {
    console.error('❌ No fund ownerships found for Tony Bravo')
  } else {
    let fixed = false

    // Process each fund ownership
    tonyBravo.fundOwnerships.forEach((fo, foIndex) => {
      console.log(`\nProcessing: ${fo.fundName}`)
      console.log(`   Current Ownership: ${fo.ownershipPercent}%`)
      console.log(`   Commitment: $${fo.commitment?.toLocaleString() || 0}`)

      // Check if ownership is 0 or undefined
      if (fo.ownershipPercent === 0 || fo.ownershipPercent === undefined) {
        console.log(`   ⚠️  ISSUE: Ownership percent is ${fo.ownershipPercent}`)

        // Find the structure to get total commitment
        const structure = structures.find(s => s.id === fo.fundId)

        if (!structure) {
          console.error(`   ❌ Structure not found: ${fo.fundId}`)
          return
        }

        console.log(`   Structure Total Commitment: $${structure.totalCommitment?.toLocaleString() || 0}`)

        // Calculate ownership percent
        if (structure.totalCommitment > 0 && fo.commitment > 0) {
          const calculatedOwnership = (fo.commitment / structure.totalCommitment) * 100
          console.log(`   ✅ Calculated Ownership: ${calculatedOwnership.toFixed(4)}%`)

          // Update the ownership percent
          tonyBravo.fundOwnerships[foIndex].ownershipPercent = calculatedOwnership

          fixed = true
        } else {
          console.error(`   ❌ Cannot calculate ownership: commitment or total commitment is 0`)
        }
      } else {
        console.log(`   ✅ Ownership percent is correct`)
      }
    })

    if (fixed) {
      // Save back to localStorage
      investors[tonyBravoIndex] = tonyBravo
      localStorage.setItem('polibit_investors', JSON.stringify(investors))

      console.log('\n✅ Changes saved to localStorage')
      console.log('🔄 Please refresh the page to see the changes')
      console.log('\n📝 What changed:')
      console.log('   - Ownership percent calculated from commitment / total commitment')
      console.log('   - Capital call wizard will now show correct ownership %')
    } else {
      console.log('\n✅ No issues found - ownership percents are correct')
    }
  }
}

console.log('\n=== Script Complete ===')
