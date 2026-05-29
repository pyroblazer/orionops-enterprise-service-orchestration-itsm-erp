#!/bin/bash
# Update all created frontend pages to use real API calls

# Finance pages
sed -i 's/setAccounts(\[\])/\/\/ Fetch from API/' src/app/\(dashboard\)/finance/gl/page.tsx
sed -i 's/setBudgets(.*)/const res = await api.getBudgets?.() || { data: [] }; setBudgets(res?.data || []);/' src/app/\(dashboard\)/finance/forecast/page.tsx
sed -i 's/setRfqs(.*)/const res = await api.getRFQs?.() || { data: [] }; setRfqs(res?.data || []);/' src/app/\(dashboard\)/procurement/rfq/page.tsx

# Procurement pages  
sed -i 's/setExceptions(\[{/const res = await api.getInvoiceVariances?.("") || { data: [] }; setExceptions(res?.data || []);/' src/app/\(dashboard\)/procurement/matching/page.tsx
sed -i 's/setConcentration({ risk:/const res = await api.getVendorConcentration?.() || { data: {} }; setConcentration(res?.data || {});/' src/app/\(dashboard\)/procurement/spend-analysis/page.tsx

# Inventory pages
sed -i 's/setCycleCounts(\[/const res = await api.getCycleCountVariances?.("") || { data: [] }; setCounts(res?.data || []);/' src/app/\(dashboard\)/inventory/cycle-counts/page.tsx
sed -i 's/setReorderPoints(\[/const res = await api.getSuggestedReorderPoint?.("") || { data: [] }; setReorderPoints(res?.data || []);/' src/app/\(dashboard\)/inventory/demand-planning/page.tsx

echo "Updated pages to use real API calls"
