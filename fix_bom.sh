#!/bin/bash
PROJECT_DIR="/home/ubuntu/Alfi/RnD/Development/Product Configurator"

# 1. Materials Page
sed -i 's/materials_catalog_\${new Date().toISOString().split('\''T'\'')\[0\]}/materials_catalog_\${new Date().toISOString().replace(\/[:.]\/g, "-").slice(0, 19)}/g' "$PROJECT_DIR/app/(dashboard)/materials/page.tsx"

# 2. Assemblies Page
sed -i 's/assemblies_full_export_\${new Date().toISOString().split('\''T'\'')\[0\]}/assemblies_full_export_\${new Date().toISOString().replace(\/[:.]\/g, "-").slice(0, 19)}/g' "$PROJECT_DIR/app/(dashboard)/assemblies/page.tsx"

# 3. Templates Page
sed -i 's/full_export\",/full_export_\${new Date().toISOString().replace(\/[:.]\/g, "-").slice(0, 19)}\",/g' "$PROJECT_DIR/app/(dashboard)/templates/page.tsx"
sed -i 's/templates_full_export_\${new Date().toISOString().split('\''T'\'')\[0\]}/templates_full_export_\${new Date().toISOString().replace(\/[:.]\/g, "-").slice(0, 19)}/g' "$PROJECT_DIR/app/(dashboard)/templates/page.tsx"

# 4. BOQ Template Page
sed -i 's/_BOQ\", \"BOQ\")/_BOQ_\${new Date().toISOString().replace(\/[:.]\/g, "-").slice(0, 19)}\", \"BOQ\")/g' "$PROJECT_DIR/app/(dashboard)/templates/[id]/boq/page.tsx"
# Hierarchy UI
sed -i 's/text-purple-100/text-purple-100 pl-4/g' "$PROJECT_DIR/app/(dashboard)/templates/[id]/boq/page.tsx"
sed -i "s/text-blue-100' : ''/text-blue-100 pl-8' : 'pl-12 text-muted-foreground'/g" "$PROJECT_DIR/app/(dashboard)/templates/[id]/boq/page.tsx"

# 5. BOQ Project Page
sed -i 's/_BOQ\", \"BOQ\")/_BOQ_\${new Date().toISOString().replace(\/[:.]\/g, "-").slice(0, 19)}\", \"BOQ\")/g' "$PROJECT_DIR/app/(dashboard)/projects/[id]/boq/page.tsx"
# Hierarchy UI
sed -i 's/text-purple-100/text-purple-100 pl-4/g' "$PROJECT_DIR/app/(dashboard)/projects/[id]/boq/page.tsx"
sed -i "s/text-blue-100 font-semibold : /text-blue-100 pl-8 font-semibold : 'pl-12 text-muted-foreground' +/g" "$PROJECT_DIR/app/(dashboard)/projects/[id]/boq/page.tsx"

