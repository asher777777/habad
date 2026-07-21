import fs from 'fs';

let content = fs.readFileSync('src/app/dashboard/crm/analytics/page.tsx', 'utf8');

// --- 1. Imports ---
if (!content.includes('savedViewsActions')) {
  content = content.replace(
    'import { updateRecordField } from "@/features/crm/updateAction";',
    'import { updateRecordField } from "@/features/crm/updateAction";\nimport { getSavedViews, saveView, deleteSavedView, SavedView } from "@/features/crm/savedViewsActions";\nimport * as XLSX from "xlsx";'
  );
} else if (!content.includes('import * as XLSX')) {
  content = content.replace(
    'import { updateRecordField } from "@/features/crm/updateAction";',
    'import { updateRecordField } from "@/features/crm/updateAction";\nimport * as XLSX from "xlsx";'
  );
}

// --- 2. States ---
if (!content.includes('savedViews, setSavedViews')) {
  content = content.replace(
    'const [editValue, setEditValue] = useState<string>("");',
    `const [editValue, setEditValue] = useState<string>("");\n  \n  // Saved Views State\n  const [savedViews, setSavedViews] = useState<SavedView[]>([]);\n  const [activeViewId, setActiveViewId] = useState<string | null>(null);\n  const [isSavingView, setIsSavingView] = useState(false);`
  );
}

// --- 3. loadViews effect ---
if (!content.includes('loadViews = useCallback')) {
  content = content.replace(
    'useEffect(() => {\n    loadData();\n  }, [loadData]);',
    `const loadViews = useCallback(async () => {\n    const views = await getSavedViews();\n    setSavedViews(views);\n  }, []);\n\n  useEffect(() => {\n    loadData();\n  }, [loadData]);\n\n  useEffect(() => {\n    loadViews();\n  }, [loadViews]);`
  );
}

// --- 4. Handlers ---
if (!content.includes('handleSaveViewClick')) {
  const handlersCode = `
  const handleSaveViewClick = async () => {
    const viewName = window.prompt("הזן שם לתצוגה השמורה (לדוגמה: 'דוח קייטנה מלא'):");
    if (!viewName || viewName.trim() === "") return;
    
    setIsSavingView(true);
    try {
      const config = {
        dataSource,
        activeTabFilter,
        filterForm,
        selectedColumns,
        sortConfig,
        showSummaries,
        showRowNumbering,
        showRowCheckboxes,
        splitChildrenRows,
        columnDataFilters
      };
      const res = await saveView(viewName, config);
      if (res.success) {
        await loadViews();
        setActiveViewId(res.id || null);
        alert("התצוגה נשמרה בהצלחה!");
      } else {
        alert("שגיאה בשמירת התצוגה: " + res.error);
      }
    } finally {
      setIsSavingView(false);
    }
  };

  const handleApplyView = (viewId: string) => {
    if (!viewId) {
      setActiveViewId(null);
      return;
    }
    const view = savedViews.find(v => v.id === viewId);
    if (!view) return;
    
    setActiveViewId(view.id!);
    setDataSource(view.config.dataSource);
    setActiveTabFilter(view.config.activeTabFilter);
    setFilterForm(view.config.filterForm || "");
    setSelectedColumns(view.config.selectedColumns);
    setSortConfig(view.config.sortConfig);
    setShowSummaries(view.config.showSummaries);
    setShowRowNumbering(view.config.showRowNumbering);
    setShowRowCheckboxes(view.config.showRowCheckboxes);
    setSplitChildrenRows(view.config.splitChildrenRows);
    setColumnDataFilters(view.config.columnDataFilters || {});
  };

  const handleDeleteView = async (viewId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("האם אתה בטוח שברצונך למחוק תצוגה שמורה זו?")) return;
    const res = await deleteSavedView(viewId);
    if (res.success) {
      if (activeViewId === viewId) setActiveViewId(null);
      await loadViews();
    } else {
      alert("שגיאה במחיקת התצוגה: " + res.error);
    }
  };
`;
  content = content.replace(
    'const tabFilters = useMemo(() => {',
    handlersCode + '\n  const tabFilters = useMemo(() => {'
  );
}

// --- 5. UI elements ---
if (!content.includes('Saved Views Selector')) {
  const uiCode = `<div className="flex flex-col gap-2">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              טבלת נתונים מותאמת אישית ({processedContacts.length} רשומות)
            </h3>
            
            {/* Saved Views Selector */}
            <div className="flex items-center gap-3 print:hidden">
              <span className="text-xs font-bold text-slate-500">תצוגות שמורות:</span>
              <div className="relative flex items-center gap-2">
                <select 
                  value={activeViewId || ""}
                  onChange={(e) => handleApplyView(e.target.value)}
                  className="h-8 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[150px] pr-8"
                >
                  <option value="">-- בחר תצוגה שמורה --</option>
                  {savedViews.map(view => (
                    <option key={view.id} value={view.id}>{view.name}</option>
                  ))}
                </select>
                
                {activeViewId && (
                  <button 
                    onClick={(e) => handleDeleteView(activeViewId, e)}
                    className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="מחק תצוגה זו"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                
                <Button 
                  type="button"
                  onClick={handleSaveViewClick}
                  disabled={isSavingView}
                  className="h-8 px-3 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  שמור תצוגה
                </Button>
              </div>
            </div>
          </div>`;

  content = content.replace(
    `<h3 className="text-lg font-black text-slate-800 flex items-center gap-2">\n            <Users className="w-5 h-5 text-indigo-500" />\n            טבלת נתונים מותאמת אישית ({processedContacts.length} רשומות)\n          </h3>`,
    uiCode
  );
}

// --- Re-apply fixes ---
// 1. handleEditClick child id fix
if (!content.includes("contactId.includes('_child_')")) {
  content = content.replace(
    `const handleEditClick = async (contactId: string, e: React.MouseEvent) => {\n    e.stopPropagation();\n    try {\n      const contact = await getContactById(contactId);`,
    `const handleEditClick = async (contactId: string, e: React.MouseEvent) => {\n    e.stopPropagation();\n    try {\n      const realId = contactId.includes('_child_') ? contactId.split('_child_')[0] : contactId;\n      const contact = await getContactById(realId);`
  );
}

// 2. handleDeleteClick child fix
if (!content.includes("isChildRow")) {
  content = content.replace(
    `const handleDeleteClick = async (contactId: string, e: React.MouseEvent) => {\n    e.stopPropagation();\n    if (!window.confirm("האם אתה בטוח שברצונך להעביר איש קשר זה לסל האשפה?")) return;`,
    `const handleDeleteClick = async (contactId: string, e: React.MouseEvent) => {\n    e.stopPropagation();\n    const isChildRow = contactId.includes('_child_');\n    if (isChildRow) {\n      alert("כדי למחוק רק את הילד הזה, לחץ על סמל העריכה (העיפרון), גלול ללשונית 'משפחה וקייטנה', ומחק אותו משם.");\n      return;\n    }\n    \n    if (!window.confirm("האם אתה בטוח שברצונך להעביר איש קשר זה לסל האשפה? (כל הילדים שלו יימחקו גם כן)")) return;`
  );
}

// --- 6. EXCEL EXPORT ---
const newExportFunc = `const exportToCsv = () => {
    if (!processedContacts || processedContacts.length === 0) return;
    
    // Create headers
    const headers = selectedColumns.map(col => getColumnLabel(col));
    
    // Create rows
    const rows = processedContacts.map((contact: any) => {
      return selectedColumns.map(col => {
        let val = getContactValue(contact, col);
        return formatCellValue(val);
      });
    });
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    worksheet['!dir'] = 'rtl'; // RTL support
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "דוח");
    
    // Generate file and trigger download
    XLSX.writeFile(workbook, \`דוח_אנשי_קשר_\${new Date().toLocaleDateString('he-IL').replaceAll('/', '-')}.xlsx\`);
  };`;

// Find where exportToCsv currently is, and replace it completely
const exportMatch = content.match(/const exportToCsv = \(\) => \{[\s\S]*?document\.body\.removeChild\(link\);\s*\n\s*\};/);
if (exportMatch) {
  content = content.replace(exportMatch[0], newExportFunc);
} else {
  console.log("Could not find exportToCsv function!");
}

fs.writeFileSync('src/app/dashboard/crm/analytics/page.tsx', content);
console.log('All patches applied successfully.');
