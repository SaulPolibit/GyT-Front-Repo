// Script to fix missing onboardingStatus in investor fund ownerships
// Run this once to add onboardingStatus to existing fund ownerships

console.log('This script should be run from the browser console:');
console.log('');
console.log('Copy and paste this code into your browser console while on the app:');
console.log('');
console.log(`
// Fix missing onboardingStatus for investor fund ownerships
console.log('🔧 Fixing onboardingStatus for investor fund ownerships...');

// Get investors from localStorage
const investors = JSON.parse(localStorage.getItem('polibit_investors') || '[]');
let fixedCount = 0;

investors.forEach(investor => {
  if (investor.fundOwnerships && Array.isArray(investor.fundOwnerships)) {
    investor.fundOwnerships.forEach(ownership => {
      // If onboardingStatus is missing, set it to 'Active' for existing fund ownerships
      if (!ownership.onboardingStatus) {
        ownership.onboardingStatus = 'Active';
        fixedCount++;
        console.log('✅ Fixed ' + investor.name + ' - ' + ownership.fundName);
      }
    });
  }
});

// Save back to localStorage
if (fixedCount > 0) {
  localStorage.setItem('polibit_investors', JSON.stringify(investors));
  console.log('\\n✨ Fixed ' + fixedCount + ' fund ownership(s)');
  console.log('🔄 Please refresh the page to see the changes in LP Portal');
} else {
  console.log('✅ All fund ownerships already have onboardingStatus set');
}
`);
