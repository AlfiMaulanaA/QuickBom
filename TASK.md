## 🚀 **Alternatif UI/UX Profesional untuk Assemblies Page**

Selain DropdownMenu, berikut adalah berbagai pendekatan UI/UX profesional yang bisa meningkatkan pengalaman user secara signifikan:

### 🎯 **1. Context Menu (Right-Click Menu)**

**Implementasi:**
```tsx
// Tambahkan context menu ke table rows
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"

<TableRow>
  <ContextMenu>
    <ContextMenuTrigger asChild>
      <div className="cursor-context-menu">
        {/* Table row content */}
      </div>
    </ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuItem onClick={() => router.push(`/assemblies/edit/${assembly.id}`)}>
        <Edit className="mr-2 h-4 w-4" />
        Edit Assembly
      </ContextMenuItem>
      <ContextMenuItem onClick={() => handleDuplicate(assembly)}>
        <Copy className="mr-2 h-4 w-4" />
        Duplicate
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => handleDelete(assembly.id)} className="text-red-600">
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</TableRow>
```

**Keuntungan:** User bisa right-click untuk akses cepat actions.

### 📱 **2. Action Sheet/Drawer untuk Mobile**

**Implementasi:**
```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </SheetTrigger>
  <SheetContent side="bottom" className="h-auto">
    <SheetHeader>
      <SheetTitle>Assembly Actions</SheetTitle>
    </SheetHeader>
    <div className="grid gap-2 py-4">
      <Button variant="ghost" className="justify-start" onClick={() => router.push(`/assemblies/edit/${assembly.id}`)}>
        <Edit className="mr-2 h-4 w-4" />
        Edit Assembly
      </Button>
      <Button variant="ghost" className="justify-start" onClick={() => handleDuplicate(assembly)}>
        <Copy className="mr-2 h-4 w-4" />
        Duplicate
      </Button>
      <Button variant="ghost" className="justify-start text-red-600" onClick={() => handleDelete(assembly.id)}>
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>
    </div>
  </SheetContent>
</Sheet>
```

**Keuntungan:** Lebih touch-friendly untuk mobile/tablet.

### ⌨️ **3. Command Palette (Command Menu)**

**Implementasi:**
```tsx
import { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"

<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Search actions..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Assembly Actions">
      <CommandItem onSelect={() => router.push(`/assemblies/edit/${selectedAssembly.id}`)}>
        <Edit className="mr-2 h-4 w-4" />
        Edit Assembly
      </CommandItem>
      <CommandItem onSelect={() => handleDuplicate(selectedAssembly)}>
        <Copy className="mr-2 h-4 w-4" />
        Duplicate Assembly
      </CommandItem>
      <CommandItem onSelect={() => {
        setSelectedAssembly(selectedAssembly);
        setIsMaterialsDialogOpen(true);
      }}>
        <Eye className="mr-2 h-4 w-4" />
        View Materials
      </CommandItem>
    </CommandGroup>
  </CommandList>
</CommandDialog>
```

**Keuntungan:** Power user friendly dengan keyboard shortcuts.

### 🎯 **4. Inline Action Buttons dengan Tooltip**

**Implementasi:**
```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

<div className="flex items-center gap-1">
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/assemblies/edit/${assembly.id}`)}
          className="h-8 w-8 p-0"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Edit Assembly</p>
      </TooltipContent>
    </Tooltip>
    
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDuplicate(assembly)}
          className="h-8 w-8 p-0"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Duplicate Assembly</p>
      </TooltipContent>
    </Tooltip>
    
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDelete(assembly.id)}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Delete Assembly</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</div>
```

**Keuntungan:** Actions selalu visible, tooltips memberikan konteks.

### 🎨 **5. Floating Action Button (FAB) dengan Speed Dial**

**Implementasi:**
```tsx
import { motion, AnimatePresence } from "framer-motion"

const [fabOpen, setFabOpen] = useState(false);

<AnimatePresence>
  {fabOpen && (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed bottom-6 right-6 flex flex-col gap-2 z-50"
    >
      <motion.div whileHover={{ scale: 1.05 }}>
        <Button size="sm" onClick={() => router.push("/assemblies/create")}>
          <Plus className="h-4 w-4 mr-2" />
          New Assembly
        </Button>
      </motion.div>
      <motion.div whileHover={{ scale: 1.05 }}>
        <Button size="sm" variant="outline" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

<motion.button
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.9 }}
  className="fixed bottom-6 right-6 bg-primary text-primary-foreground rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-40"
  onClick={() => setFabOpen(!fabOpen)}
>
  <motion.div
    animate={{ rotate: fabOpen ? 45 : 0 }}
    transition={{ duration: 0.2 }}
  >
    <Plus className="h-6 w-6" />
  </motion.div>
</motion.button>
```

**Keuntungan:** Modern, space-efficient, engaging animations.

### 📊 **6. Status Indicators dan Progress Bars**

**Implementasi:**
```tsx
// Status badges dengan warna
<Badge variant={assembly.materials.length > 0 ? "default" : "secondary"}>
  {assembly.materials.length > 0 ? "Complete" : "Needs Materials"}
</Badge>

// Progress bar untuk completion
<div className="w-full bg-gray-200 rounded-full h-2">
  <div
    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
    style={{ width: `${(assembly.materials.length / 10) * 100}%` }}
  />
</div>
```

### ⌨️ **7. Keyboard Shortcuts**

**Implementasi:**
```tsx
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'n':
          event.preventDefault();
          router.push('/assemblies/create');
          break;
        case 'e':
          if (selectedAssemblies.length === 1) {
            event.preventDefault();
            router.push(`/assemblies/edit/${selectedAssemblies[0]}`);
          }
          break;
        case 'd':
          if (selectedAssemblies.length > 0) {
            event.preventDefault();
            handleBulkDelete();
          }
          break;
      }
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [selectedAssemblies]);
```

### 🔄 **8. Bulk Actions Panel**

**Implementasi:**
```tsx
{selectedAssemblies.length > 0 && (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white border rounded-lg shadow-lg p-4 z-50 flex items-center gap-4"
  >
    <span className="font-medium">{selectedAssemblies.length} selected</span>
    <Button variant="outline" size="sm" onClick={() => handleBulkDuplicate()}>
      <Copy className="h-4 w-4 mr-2" />
      Duplicate All
    </Button>
    <Button variant="outline" size="sm" onClick={exportSelectedToCSV}>
      <Download className="h-4 w-4 mr-2" />
      Export Selected
    </Button>
    <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
      <Trash2 className="h-4 w-4 mr-2" />
      Delete All
    </Button>
    <Button variant="ghost" size="sm" onClick={() => setSelectedAssemblies([])}>
      <X className="h-4 w-4" />
    </Button>
  </motion.div>
)}
```

### 🎨 **9. Advanced Data Visualization**

**Implementasi:**
```tsx
// Mini charts dalam table
<div className="flex items-center gap-2">
  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
    <div
      className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
      style={{ width: `${Math.min((calculateTotalCost(assembly) / 100000) * 100, 100)}%` }}
    />
  </div>
  <span className="text-xs text-muted-foreground">
    {((calculateTotalCost(assembly) / 100000) * 100).toFixed(0)}%
  </span>
</div>
```

### 📱 **10. Swipe Actions untuk Mobile**

**Implementasi:**
```tsx
// Menggunakan react-swipeable atau custom swipe handler
const [swipeOffset, setSwipeOffset] = useState(0);

<div
  className="relative overflow-hidden"
  onTouchStart={handleSwipeStart}
  onTouchMove={handleSwipeMove}
  onTouchEnd={handleSwipeEnd}
>
  {/* Main content */}
  <div style={{ transform: `translateX(${swipeOffset}px)` }}>
    {/* Table row content */}
  </div>
  
  {/* Swipe actions */}
  <div className="absolute right-0 top-0 h-full flex">
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.push(`/assemblies/edit/${assembly.id}`)}
      className="bg-blue-500 text-white rounded-none h-full px-4"
    >
      <Edit className="h-4 w-4" />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleDelete(assembly.id)}
      className="bg-red-500 text-white rounded-none h-full px-4"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
</div>
```

### 🎯 **Rekomendasi Implementasi:**

1. **Context Menu** + **Inline Tooltips** = UX terbaik untuk desktop
2. **Action Sheet** + **FAB** = UX terbaik untuk mobile
3. **Command Palette** = Untuk power users
4. **Bulk Actions Panel** = Untuk productivity
5. **Status Indicators** = Untuk visual feedback

**Kombinasi terbaik:** Context Menu + Inline Tooltips + Bulk Actions + Status Indicators untuk pengalaman profesional yang luar biasa! 🚀