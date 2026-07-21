const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/crm/analytics/page.tsx', 'utf8');

// 3. loadViews effect
if (!content.includes('loadViews = useCallback')) {
  const loadDataMatch = content.match(/const loadData = useCallback[\s\S]*?\}, \[startDate, endDate, dataSource\]\);/);
  if (loadDataMatch) {
    const replacement = loadDataMatch[0] + `

  const loadViews = useCallback(async () => {
    const views = await getSavedViews();
    setSavedViews(views);
  }, []);

  useEffect(() => {
    loadViews();
  }, [loadViews]);`;
    content = content.replace(loadDataMatch[0], replacement);
  }
}

// 5. UI elements
if (!content.includes('Saved Views Selector')) {
  const targetHeader = `<h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            טבלת נתונים מותאמת אישית ({processedContacts.length} רשומות)
          </h3>`;
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

  if (content.includes(targetHeader)) {
    content = content.replace(targetHeader, uiCode);
  } else {
    console.log("Could not find target header!");
  }
}

fs.writeFileSync('src/app/dashboard/crm/analytics/page.tsx', content);
