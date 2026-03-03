#!/bin/bash
FILE="/home/ubuntu/Alfi/RnD/Development/Product Configurator/app/(dashboard)/assemblies/page.tsx"
# Add Export Button to Tooltip Area
sed -i '/p>Delete Assembly<\/p>/i \
                                  <Tooltip> \
                                    <TooltipTrigger asChild> \
                                      <Button \
                                        variant="ghost" \
                                        size="sm" \
                                        onClick={() => exportSingleAssemblyExcel(assembly)} \
                                        className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" \
                                      > \
                                        <FileSpreadsheet className="h-4 w-4" /> \
                                      </Button> \
                                    </TooltipTrigger> \
                                    <TooltipContent> \
                                      <p>Export Detail Excel</p> \
                                    </TooltipContent> \
                                  </Tooltip>' "$FILE"

# Add Export Button to Context Menu
sed -i '/Delete Assembly<\/ContextMenuItem>/i \
                          <ContextMenuItem \
                            onClick={() => exportSingleAssemblyExcel(assembly)} \
                            className="text-emerald-600 focus:text-emerald-600" \
                          > \
                            <FileSpreadsheet className="mr-2 h-4 w-4" /> \
                            Export Detail Excel \
                          </ContextMenuItem> \
                          <ContextMenuSeparator />' "$FILE"
