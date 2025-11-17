// One-time script to fix Tony Bravo's Polibit Real Estate IV onboarding status
// Run this in the browser console while on any LP Portal or Investment Manager page

console.log('=== Fixing Tony Bravo Onboarding Status ===\n')

// Get investors from localStorage
const investors = JSON.parse(localStorage.getItem('polibit_investors') || '[]')
console.log(`Found ${investors.length} investors in localStorage`)

// Find Tony Bravo
const tonyBravoIndex = investors.findIndex(inv =>
  inv.name === 'Tony Bravo' || inv.id === 'tony-bravo'
)

if (tonyBravoIndex === -1) {
  console.error('❌ Tony Bravo not found in localStorage')
  console.log('Available investors:', investors.map(inv => inv.name).join(', '))
} else {
  const tonyBravo = investors[tonyBravoIndex]
  console.log(`\n✅ Found: ${tonyBravo.name} (${tonyBravo.id})`)
  console.log(`   Email: ${tonyBravo.email}`)
  console.log(`   Status: ${tonyBravo.status}`)
  console.log(`   Fund Ownerships: ${tonyBravo.fundOwnerships?.length || 0}`)

  if (!tonyBravo.fundOwnerships || tonyBravo.fundOwnerships.length === 0) {
    console.log('\n⚠️  No fund ownerships found')
  } else {
    console.log('\n📋 Current Fund Ownerships:')

    let fixed = false
    tonyBravo.fundOwnerships.forEach((fo, index) => {
      console.log(`\n${index + 1}. ${fo.fundName}`)
      console.log(`   Fund ID: ${fo.fundId}`)
      console.log(`   Commitment: $${fo.commitment?.toLocaleString() || 0}`)
      console.log(`   Onboarding Status: ${fo.onboardingStatus || 'undefined'}`)

      // Check if this is Real Estate IV with incorrect status
      const isRealEstateIV = fo.fundName && fo.fundName.toLowerCase().includes('real estate iv')
      const hasCommitment = fo.commitment && fo.commitment > 0
      const hasActiveStatus = fo.onboardingStatus === 'Active'

      if (isRealEstateIV && hasActiveStatus) {
        console.log(`   ⚠️  ISSUE DETECTED: Status is 'Active' - removing it`)
        // Remove the onboardingStatus field
        delete tonyBravo.fundOwnerships[index].onboardingStatus
        console.log(`   ✅ Fixed: Removed onboardingStatus (now undefined)`)
        fixed = true
      }
    })

    if (fixed) {
      // Save back to localStorage
      investors[tonyBravoIndex] = tonyBravo
      localStorage.setItem('polibit_investors', JSON.stringify(investors))

      console.log('\n✅ Changes saved to localStorage')
      console.log('🔄 Please refresh the page to see the changes')
      console.log('\n📝 What happens now:')
      console.log('   - Real Estate IV will show as "not started" or "pending"')
      console.log('   - Investor can complete onboarding through LP Portal')
      console.log('   - Status will be set correctly by the onboarding flow')
    } else {
      console.log('\n✅ No issues found - all statuses are correct')
    }
  }
}

console.log('\n=== Script Complete ===')
