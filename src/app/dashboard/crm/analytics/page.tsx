"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getCRMAnalytics, getFormSubmissionsAnalytics } from "@/features/crm/analyticsActions";
import { updateRecordField } from "@/features/crm/updateAction";
import { getContactById, handleBulkAction } from "@/features/crm/actions";
import { getSavedViews, saveView, deleteSavedView, SavedView } from "@/features/crm/savedViewsActions";
import * as XLSX from "xlsx";
import { ContactModal } from "../ContactModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RefreshCw, TrendingUp, Users, Tag, List, MapPin, Filter, Edit2, Trash2, Plus, Columns, PieChart as PieChartIcon, Download, ArrowUp, ArrowDown, ArrowUpDown, Printer, User, Building, Calendar, CreditCard } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { Contact } from "@/features/crm/types";

const COLORS = ['#4f46e5', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#3b82f6'];

export default function AnalyticsDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [dataSource, setDataSource] = useState<"contacts" | "forms">("contacts");
  
  // New States for Advanced Filtering & Dynamic Table
  const [showGraphs, setShowGraphs] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(["conta_name", "conta_phone", "total_spent", "mh_crm_city"]);
  const [filterSource, setFilterSource] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterForm, setFilterForm] = useState("");
  const [activeMetricFilter, setActiveMetricFilter] = useState<string | null>(null);
  const [activeTabFilter, setActiveTabFilter] = useState<string | null>(null);
  const [columnDataFilters, setColumnDataFilters] = useState<Record<string, 'all' | 'has_data' | 'no_data'>>({});
  const [showRowNumbering, setShowRowNumbering] = useState(true);
  const [showRowCheckboxes, setShowRowCheckboxes] = useState(true);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [showSummaries, setShowSummaries] = useState(false);
  const [splitChildrenRows, setSplitChildrenRows] = useState(false);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'} | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: string, field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // Saved Views State
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [isSavingView, setIsSavingView] = useState(false);
  
  const [data, setData] = useState<{
    totalContacts: number;
    totalSpent: number;
    tagsCount: Record<string, number>;
    leadSourcesCount: Record<string, number>;
    formsCount: Record<string, number>;
    numericFieldsAgg: Record<string, { 
      sum: number; 
      count: number; 
      entries: Array<{
        contactId: string;
        parentName: string;
        phone: string;
        childName?: string;
        totalSpent: number;
        hasPaid: boolean;
        value: number;
      }>;
    }>;
    textFieldsAgg: Record<string, Record<string, number>>;
    contacts: Contact[];
    customFields: Array<{id: string, label: string}>;
  } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (dataSource === "contacts") {
        const result = await getCRMAnalytics({ startDate, endDate });
        if ((result as any).error) {
          alert("שגיאה בטעינת הנתונים: " + (result as any).error);
        } else {
          setData(result as any);
        }
      } else {
        const result = await getFormSubmissionsAnalytics({ startDate, endDate });
        if ((result as any).error) {
          alert("שגיאה בטעינת הנתונים: " + (result as any).error);
        } else {
          setData({
            totalContacts: (result as any).totalSubmissions,
            totalSpent: 0,
            tagsCount: {},
            leadSourcesCount: {},
            formsCount: (result as any).formsCount,
            numericFieldsAgg: {},
            textFieldsAgg: {},
            contacts: (result as any).submissions,
            customFields: []
          });
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, dataSource]);

  const loadViews = useCallback(async () => {
    const views = await getSavedViews();
    setSavedViews(views);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadViews();
  }, [loadViews]);

  // Dynamically adjust columns when a form is selected
  useEffect(() => {
    if (filterForm && data) {
      const formContacts = data.contacts.filter((c: any) => 
        c.formName === filterForm || c.last_form_name === filterForm || (c.form_submissions || []).some((fs: any) => fs.name === filterForm)
      );
      
      if (formContacts.length > 0) {
        const formKeys = new Set<string>();
        formContacts.forEach((c: any) => {
          Object.keys(c).forEach(k => {
            if (c[k] !== null && c[k] !== undefined && c[k] !== "" && !["id", "ownerId", "events", "form_submissions", "children", "status", "createdAt", "updatedAt", "child_first_name", "child_last_name", "child_grade", "child_id_number"].includes(k)) {
              formKeys.add(k);
            }
          });
          if (c.children && Array.isArray(c.children)) {
            c.children.forEach((child: any) => {
              Object.keys(child).forEach(k => {
                if (child[k] !== null && child[k] !== undefined && child[k] !== "" && k !== "id") {
                  formKeys.add(k);
                }
              });
            });
          }
        });
        
        const baseColumns = ["conta_name", "conta_phone", "total_spent", "order_count", "last_order_date"];
        const newColumns = Array.from(new Set([...baseColumns, ...Array.from(formKeys)]));
        setSelectedColumns(newColumns);
      }
    }
  }, [filterForm, data]);

  // Formats data for Recharts Pie/Bar
  const formatForChart = (record: Record<string, number>) => {
    return Object.entries(record)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const toggleColumn = (col: string) => {
    setSelectedColumns(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };



  const getColumnLabel = (col: string) => {
    // English to Hebrew common fields map
    const map: Record<string, string> = {
      "conta_name": "שם חברה/לקוח",
      "conta_phone": "טלפון",
      "f_m": "שם פרטי",
      "email": "אימייל",
      "gender": "מין",
      "mh_crm_city": "עיר",
      "mh_crm_street": "רחוב",
      "company_name": "שם חברה",
      "job_title": "תפקיד",
      "work_phone": "טלפון בעבודה",
      "website": "אתר אינטרנט",
      "birth_date": "תאריך לידה",
      "status": "סטטוס",
      "total_spent": "סך הוצאות",
      "order_count": "כמות הזמנות",
      "last_order_date": "תאריך הזמנה אחרונה",
      "lead_source": "מקור הגעה",
      "tg1": "תגית 1",
      "tg2": "תגית 2",
      "tg3": "תגית 3",
      "last_form_name": "טופס אחרון",
      "last_form_page": "עמוד טופס אחרון",
      "last_form_submission_date": "תאריך מילוי טופס אחרון",
      "last_message_read_status": "סטטוס קריאת הודעה אחרונה",
      "notes": "הערות",
      "first_name": "שם הילד",
      "last_name": "משפחת הילד",
      "grade": "כיתה/גן",
      "id_number": "ת.ז. ילד",
      "allergies_has": "יש רגישות?",
      "allergies_details": "פירוט רגישות",
      "health_declaration": "הצהרת בריאות",
      "child_first_name": "שם הילד (ראשי)",
      "child_last_name": "משפחת הילד (ראשי)",
      "child_grade": "כיתה/גן (ראשי)",
      "child_id_number": "ת.ז. ילד (ראשי)",
      "father_name": "שם האב",
      "mother_name": "שם האם",
      "father_phone": "טלפון האב",
      "mother_phone": "טלפון האם",
      "createdAt": "תאריך יצירה",
      "updatedAt": "תאריך עדכון",
    };
    if (map[col]) return map[col];
    
    // Check custom fields
    if (data?.customFields) {
      const custom = data.customFields.find(f => f.id === col);
      if (custom) return custom.label;
    }
    return col;
  };

  const handleEditClick = async (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const realId = contactId.includes('_child_') ? contactId.split('_child_')[0] : contactId;
      const contact = await getContactById(realId);
      setSelectedContact(contact);
      setModalOpen(true);
    } catch (error: any) {
      alert("שגיאה בשליפת איש קשר: " + error.message);
    }
  };

  const handleDeleteClick = async (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isChildRow = contactId.includes('_child_');
    if (isChildRow) {
      alert("כדי למחוק רק את הילד הזה, לחץ על סמל העריכה (העיפרון), גלול ללשונית 'משפחה וקייטנה', ומחק אותו משם.");
      return;
    }
    
    if (!window.confirm("האם אתה בטוח שברצונך להעביר איש קשר זה לסל האשפה? (כל הילדים שלו יימחקו גם כן)")) return;
    try {
      await handleBulkAction([contactId], "trash");
      loadData(); // רענון הנתונים
    } catch (error: any) {
      alert("שגיאה במחיקה: " + error.message);
    }
  };

  const handleAddContact = () => {
    setSelectedContact(null);
    setModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCell) return;
    try {
      const res = await updateRecordField(dataSource, editingCell.id, editingCell.field, editValue);
      if (!res.success) throw new Error(res.error);
      
      // Update local data state
      setData(prev => {
        if (!prev) return prev;
        const newContacts = prev.contacts.map(c => {
          if (c.id === editingCell.id) {
            if (dataSource === "forms") {
              const topLevelFields = ["contactId", "ownerId", "formName", "formPage", "submissionDate", "isMigrated"];
              if (topLevelFields.includes(editingCell.field)) {
                return { ...c, [editingCell.field]: editValue };
              } else {
                return { ...c, [editingCell.field]: editValue, payload: { ...(c.payload || {}), [editingCell.field]: editValue } };
              }
            } else {
              return { ...c, [editingCell.field]: editValue };
            }
          }
          return c;
        });
        return { ...prev, contacts: newContacts };
      });
      setEditingCell(null);
    } catch (error: any) {
      alert("שגיאה בעדכון השדה: " + error.message);
    }
  };

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

  const tabFilters = useMemo(() => {
    if (!data) return [];
    return [
      {
        id: "camp",
        label: "קייטנה",
        icon: Users,
        filterFn: (c: any, customFields: any[]) => {
          if (c.tg1 === "קייטנה_תשסו") return true;
          if (c.tg2 === "שולם קייטנה" || c.tg2 === "ממתין לתשלום קייטנה") return true;
          if (c.events && Array.isArray(c.events) && c.events.some((e: any) => e.title?.includes("קייטנה") || e.title?.includes("הבטיחו את מקום"))) return true;
          if (c.form_submissions && Array.isArray(c.form_submissions) && c.form_submissions.some((fs: any) => fs.name?.includes("קייטנה") || fs.name?.includes("הבטיחו את מקום"))) return true;
          if (c.last_form_name && (c.last_form_name.includes("קייטנה") || c.last_form_name.includes("הבטיחו את מקום"))) return true;
          
          const campFields = [
            "child_first_name", "child_last_name", "child_grade", "child_id_number",
            "שם פרטי של הילד", "שם משפחה", "עולה לכיתה"
          ];
          const hasBase = campFields.some(
            field => c[field] !== null && c[field] !== undefined && c[field] !== ""
          );
          const hasChildren = c.children && Array.isArray(c.children) && c.children.length > 0;
          const campCustom = customFields.filter((f: any) => f.category === "camp").map((f: any) => f.id);
          const hasCustom = campCustom.some(
            (id: string) => c[id] !== null && c[id] !== undefined && c[id] !== ""
          );
          return hasBase || hasChildren || hasCustom;
        }
      },
      {
        id: "details",
        label: "פרטים כלליים",
        icon: User,
        filterFn: (c: any, customFields: any[]) => {
          const detailFields = ["f_m", "gender", "birth_date", "email", "mh_crm_city", "mh_crm_street", "work_phone"];
          const hasBase = detailFields.some(
            field => c[field] !== null && c[field] !== undefined && c[field] !== ""
          );
          const detailsCustom = customFields.filter((f: any) => f.category === "details").map((f: any) => f.id);
          const hasCustom = detailsCustom.some(
            (id: string) => c[id] !== null && c[id] !== undefined && c[id] !== ""
          );
          return hasBase || hasCustom;
        }
      },
      {
        id: "company",
        label: "חברה ומקור",
        icon: Building,
        filterFn: (c: any, customFields: any[]) => {
          const companyFields = ["company_name", "job_title", "work_phone", "website", "lead_source", "last_form_name"];
          const hasBase = companyFields.some(
            field => c[field] !== null && c[field] !== undefined && c[field] !== ""
          );
          const companyCustom = customFields.filter((f: any) => f.category === "company").map((f: any) => f.id);
          const hasCustom = companyCustom.some(
            (id: string) => c[id] !== null && c[id] !== undefined && c[id] !== ""
          );
          return hasBase || hasCustom;
        }
      },
      {
        id: "tags",
        label: "תיוגים והערות",
        icon: Tag,
        filterFn: (c: any, customFields: any[]) => {
          const tagsFields = ["tg1", "tg2", "tg3", "notes"];
          const hasBase = tagsFields.some(
            field => c[field] !== null && c[field] !== undefined && c[field] !== ""
          );
          const tagsCustom = customFields.filter((f: any) => f.category === "tags").map((f: any) => f.id);
          const hasCustom = tagsCustom.some(
            (id: string) => c[id] !== null && c[id] !== undefined && c[id] !== ""
          );
          return hasBase || hasCustom;
        }
      },
      {
        id: "events",
        label: "אירועים ומפגשים",
        icon: Calendar,
        filterFn: (c: any, customFields: any[]) => {
          const hasEvents = c.events && Array.isArray(c.events) && c.events.length > 0;
          const eventsCustom = customFields.filter((f: any) => f.category === "events").map((f: any) => f.id);
          const hasCustom = eventsCustom.some(
            (id: string) => c[id] !== null && c[id] !== undefined && c[id] !== ""
          );
          return hasEvents || hasCustom;
        }
      },
      {
        id: "payments",
        label: "תשלומים",
        icon: CreditCard,
        filterFn: (c: any) => {
          return (
            (c.total_spent !== undefined && Number(c.total_spent) > 0) ||
            (c.order_count !== undefined && Number(c.order_count) > 0) ||
            (c.last_order_date !== null && c.last_order_date !== undefined && c.last_order_date !== "")
          );
        }
      }
    ];
  }, [data]);

  const getContactValue = (c: any, col: string) => {
    let val = c[col];
    if (val === undefined || val === null || val === "") {
      if (col === "first_name") val = c["child_first_name"];
      else if (col === "last_name") val = c["child_last_name"];
      else if (col === "grade") val = c["child_grade"];
      else if (col === "id_number") val = c["child_id_number"];
    }
    return val;
  };

  const filteredContacts = data ? data.contacts.filter((c: any) => {
    if (filterSource && c.lead_source !== filterSource && c.mh_crm_city !== filterSource) return false;
    if (filterTag && c.tg1 !== filterTag && c.tg2 !== filterTag && c.tg3 !== filterTag) return false;
    if (filterForm && c.last_form_name !== filterForm && !(c.form_submissions || []).some((fs: any) => fs.name === filterForm)) return false;
    
    if (activeMetricFilter === 'has_spent' && !(Number(c.total_spent) > 0)) return false;
    if (activeMetricFilter && activeMetricFilter !== 'all' && activeMetricFilter !== 'has_spent') {
        if (!c[activeMetricFilter] || Number(c[activeMetricFilter]) === 0) return false;
    }

    // Apply column-level data filter (All / Has Data / No Data)
    for (const col of selectedColumns) {
      const filterVal = columnDataFilters[col] || 'all';
      if (filterVal === 'all') continue;
      
      const val = getContactValue(c, col);
      const isEmpty = val === null || val === undefined || val === "" || val === 0 || val === "0";
      
      if (filterVal === 'has_data' && isEmpty) return false;
      if (filterVal === 'no_data' && !isEmpty) return false;
    }

    if (activeTabFilter) {
      const matchedTab = tabFilters.find(t => t.id === activeTabFilter);
      if (matchedTab && !matchedTab.filterFn(c, data.customFields || [])) {
        return false;
      }
    }
    
    return true;
  }) : [];

  const processedContacts = useMemo(() => {
    let result = filteredContacts;
    
    if (splitChildrenRows) {
      const flattened: any[] = [];
      result.forEach((c: any) => {
        if (c.children && Array.isArray(c.children) && c.children.length > 0) {
          c.children.forEach((child: any, idx: number) => {
            flattened.push({
              ...c,
              ...child,
              id: `${c.id}_child_${idx}`,
              parentId: c.id,
              isChildRow: true,
            });
          });
        } else {
          flattened.push({
            ...c,
            first_name: c.first_name || c.child_first_name || c["שם פרטי של הילד"] || "",
            last_name: c.last_name || c.child_last_name || c["שם משפחה"] || "",
            grade: c.grade || c.child_grade || c["עולה לכיתה"] || "",
            id_number: c.id_number || c.child_id_number || c["תעודת זהות"] || ""
          });
        }
      });
      result = flattened;
    }

    if (sortConfig) {
      const isDate = (val: any) => {
        if (val instanceof Date) return true;
        if (typeof val === 'string') {
          return /^\d{4}-\d{2}-\d{2}/.test(val) || 
                 /^\d{2}\/\d{2}\/\d{4}/.test(val) || 
                 (!isNaN(Date.parse(val)) && isNaN(Number(val)));
        }
        return false;
      };
      
      const parseDate = (val: any) => {
        if (val instanceof Date) return val.getTime();
        if (typeof val === 'string') {
          if (/^\d{2}\/\d{2}\/\d{4}/.test(val)) {
            const [d, m, y] = val.split('/').map(Number);
            return new Date(y, m - 1, d).getTime();
          }
          const parsed = Date.parse(val);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };
      
      const parseNum = (val: any) => {
        if (typeof val === 'number') return val;
        if (val === true) return 1;
        if (val === false) return 0;
        const cleanStr = String(val).replace(/[^0-9.-]/g, '');
        const num = Number(cleanStr);
        return isNaN(num) || cleanStr === "" ? null : num;
      };

      result = [...result].sort((a: any, b: any) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        if (valA === undefined || valA === null) valA = "";
        if (valB === undefined || valB === null) valB = "";

        // 1. Sort by Date / Time
        if (isDate(valA) && isDate(valB)) {
          const timeA = parseDate(valA);
          const timeB = parseDate(valB);
          return sortConfig.direction === 'asc' ? timeA - timeB : timeB - timeA;
        }

        // 2. Sort by numbers (from smallest to largest / min to max)
        const numA = parseNum(valA);
        const numB = parseNum(valB);
        if (numA !== null && numB !== null) {
          return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
        }

        // 3. Sort by Alphabet / Hebrew (A-Z)
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();

        if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [filteredContacts, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return null; // Cancel sort
      }
      return { key, direction: 'asc' };
    });
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-indigo-600">
        <RefreshCw className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  const moveColumnUp = (col: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = selectedColumns.indexOf(col);
    if (idx > 0) {
      const newCols = [...selectedColumns];
      [newCols[idx - 1], newCols[idx]] = [newCols[idx], newCols[idx - 1]];
      setSelectedColumns(newCols);
    }
  };

  const moveColumnDown = (col: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = selectedColumns.indexOf(col);
    if (idx < selectedColumns.length - 1) {
      const newCols = [...selectedColumns];
      [newCols[idx + 1], newCols[idx]] = [newCols[idx], newCols[idx + 1]];
      setSelectedColumns(newCols);
    }
  };

  const exportToCsv = () => {
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
    XLSX.writeFile(workbook, `דוח_אנשי_קשר_${new Date().toLocaleDateString('he-IL').replaceAll('/', '-')}.xlsx`);
  };

  const allAvailableColumns = Array.from(new Set(
    (data?.contacts.flatMap((c: any) => {
      const keys = Object.keys(c);
      if (c.children && Array.isArray(c.children)) {
        c.children.forEach((child: any) => {
          keys.push(...Object.keys(child));
        });
      }
      return keys;
    }) || [])
  )).filter(k => !["id", "parentId", "isChildRow", "ownerId", "events", "form_submissions", "children", "child_first_name", "child_last_name", "child_grade", "child_id_number"].includes(k));

  const tagsData = formatForChart(data.tagsCount);
  const formsData = formatForChart(data.formsCount);
  const sourcesData = formatForChart(data.leadSourcesCount);

  const formatCellValue = (val: any) => {
    if (val === true) return "כן";
    if (val === false) return "לא";
    if (val === null || val === undefined || val === "") return "-";
    
    if (typeof val === 'string') {
      const isIso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val);
      const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(val);
      if (isIso || isDateOnly) {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString("he-IL", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: isIso ? "2-digit" : undefined,
            minute: isIso ? "2-digit" : undefined,
          });
        }
      }
    }
    
    return String(val);
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* Header & Data Source Toggle */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm print:hidden">
        <div className="flex bg-slate-100 p-1 rounded-2xl h-14">
          <button
            onClick={() => { setDataSource("contacts"); setFilterForm(""); }}
            className={`flex-1 rounded-xl font-bold px-6 transition-all ${dataSource === "contacts" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            אנשי קשר
          </button>
          <button
            onClick={() => { setDataSource("forms"); setFilterForm(""); }}
            className={`flex-1 rounded-xl font-bold px-6 transition-all ${dataSource === "forms" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            הגשות טפסים
          </button>
        </div>
        
        <div className="flex items-end gap-3 flex-wrap">
          <Button 
            onClick={() => setShowGraphs(!showGraphs)}
            className="rounded-xl h-11 font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-2"
          >
            <PieChartIcon className="w-4 h-4" />
            {showGraphs ? "הסתר תרשימים" : "הצג תרשימים"}
          </Button>

          <Button 
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-xl h-11 font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            סינון מתקדם
          </Button>

          <Button 
            onClick={handleAddContact}
            className="rounded-xl h-11 font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 ml-4"
          >
            <Plus className="w-4 h-4" />
            איש קשר חדש
          </Button>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">מתאריך</label>
            <Input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="rounded-xl h-11"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">עד תאריך</label>
            <Input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="rounded-xl h-11"
            />
          </div>
          <Button 
            onClick={loadData}
            className="rounded-xl h-11 font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
            disabled={loading}
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
            סנן
          </Button>
          {(startDate || endDate) && (
            <Button 
              onClick={() => { setStartDate(""); setEndDate(""); }}
              variant="outline"
              className="rounded-xl h-11 border-slate-200 text-slate-600"
            >
              נקה
            </Button>
          )}
        </div>
      </div>

      {/* Metric Cards - Clickable Filters (Moved above filters drawer) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div 
          onClick={() => { setDataSource("contacts"); setFilterForm(""); setActiveMetricFilter(null); }}
          className={`bg-white rounded-3xl p-6 shadow-sm flex items-center gap-4 cursor-pointer transition-all ${dataSource === 'contacts' && !filterForm ? 'ring-2 ring-indigo-500 bg-indigo-50/50' : 'border border-slate-100 hover:shadow-md'}`}
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
            <Users className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">סה"כ אנשי קשר</p>
            <h3 className="text-3xl font-black text-slate-800">{dataSource === 'contacts' ? data.totalContacts.toLocaleString() : "-"}</h3>
          </div>
        </div>
        
        <div 
          onClick={() => setActiveMetricFilter(activeMetricFilter === 'has_spent' ? null : 'has_spent')}
          className={`bg-white rounded-3xl p-6 shadow-sm flex items-center gap-4 cursor-pointer transition-all ${activeMetricFilter === 'has_spent' ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : 'border border-slate-100 hover:shadow-md'}`}
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
            <TrendingUp className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">סך הכנסות (₪)</p>
            <h3 className="text-3xl font-black text-slate-800">₪{data.totalSpent.toLocaleString()}</h3>
          </div>
        </div>
        
        {/* Render top custom numeric fields dynamically as cards if they exist */}
        {Object.entries(data.numericFieldsAgg).slice(0, 1).map(([key, agg]) => {
          const isActive = activeMetricFilter === key;
          return (
            <div 
              key={key} 
              onClick={() => setActiveMetricFilter(isActive ? null : key)}
              className={`bg-white rounded-3xl p-6 shadow-sm flex items-center gap-4 cursor-pointer transition-all ${isActive ? 'ring-2 ring-amber-500 bg-amber-50/50' : 'border border-slate-100 hover:shadow-md'}`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-amber-50 text-amber-600`}>
                <List className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 truncate max-w-[120px]" title={key}>{key}</p>
                <h3 className="text-3xl font-black text-slate-800">{agg.sum.toLocaleString()}</h3>
              </div>
            </div>
          );
        })}

        <div 
          onClick={() => { setDataSource("forms"); setFilterForm(""); setActiveMetricFilter(null); }}
          className={`bg-white rounded-3xl p-6 shadow-sm flex items-center gap-4 cursor-pointer transition-all ${dataSource === 'forms' && !filterForm ? 'ring-2 ring-pink-500 bg-pink-50/50' : 'border border-slate-100 hover:shadow-md'}`}
        >
          <div className="w-14 h-14 rounded-2xl bg-pink-50 flex items-center justify-center shrink-0">
            <List className="w-7 h-7 text-pink-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">הגשות טפסים</p>
            <h3 className="text-3xl font-black text-slate-800">{Object.values(data.formsCount).reduce((a, b) => a + b, 0).toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Advanced Filters Drawer/Section */}
      {showFilters && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4 fade-in print:hidden">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">מקור הגעה / עיר</label>
            <select 
              value={filterSource} 
              onChange={e => setFilterSource(e.target.value)}
              className="w-full rounded-xl border border-slate-200 h-11 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">הכל</option>
              {Object.keys(data.leadSourcesCount).map(s => <option key={s} value={s.replace("עיר: ", "")}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">תגית</label>
            <select 
              value={filterTag} 
              onChange={e => setFilterTag(e.target.value)}
              className="w-full rounded-xl border border-slate-200 h-11 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">הכל</option>
              {Object.keys(data.tagsCount).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">טופס אחרון / הרשמה</label>
            <select 
              value={filterForm} 
              onChange={e => setFilterForm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 h-11 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">הכל</option>
              {Object.keys(data.formsCount).map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      )}


      {/* Tab Quick Filters */}
      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm print:hidden">
        <p className="text-xs font-bold text-slate-500 mb-3">סינון מהיר לפי לשוניות כרטיס לקוח:</p>
        <div className="flex flex-wrap gap-2 items-center">
          {tabFilters.map((tab) => {
            const isActive = activeTabFilter === tab.id;
            const Icon = tab.icon;
            const count = data.contacts.filter((c) => tab.filterFn(c, data.customFields || [])).length;
            
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabFilter(isActive ? null : tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                  isActive 
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                    : "bg-slate-50 border-slate-200/60 text-slate-600 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-md font-mono ${isActive ? "bg-indigo-700 text-indigo-100" : "bg-slate-200/60 text-slate-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
          {activeTabFilter && (
            <button
              type="button"
              onClick={() => setActiveTabFilter(null)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-3 py-2 hover:underline"
            >
              נקה סינון לשוניות
            </button>
          )}
        </div>
      </div>

      {/* Charts Grid - Conditionally Rendered */}
      {showGraphs && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 print:hidden">
        
        {/* Lead Sources / Forms Pie Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-500" />
            מקורות הגעה (ערים / דפי נחיתה)
          </h3>
          <div className="h-72 w-full" dir="ltr">
            {sourcesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourcesData.slice(0, 10)} // Top 10
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {sourcesData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">אין נתונים להצגה</div>
            )}
          </div>
        </div>

        {/* Tags Bar Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <Tag className="w-5 h-5 text-pink-500" />
            התפלגות לפי תגיות וסטטוסים
          </h3>
          <div className="h-72 w-full" dir="ltr">
             {tagsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tagsData.slice(0, 10)} layout="vertical" margin={{ left: 50, right: 10 }}>
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill="#ec4899" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
             ) : (
              <div className="flex h-full items-center justify-center text-slate-400">אין נתונים להצגה</div>
             )}
          </div>
        </div>

        {/* Forms Submissions Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <List className="w-5 h-5 text-emerald-500" />
            מילוי טפסים / הרשמות
          </h3>
          <div className="h-80 w-full" dir="ltr">
             {formsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formsData.slice(0, 15)} margin={{ bottom: 50 }}>
                  <XAxis dataKey="name" angle={-45} textAnchor="end" tick={{fontSize: 12}} />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
             ) : (
              <div className="flex h-full items-center justify-center text-slate-400">אין נתונים להצגה</div>
             )}
          </div>
        </div>
        </div>
      )}



      {/* Dynamic Contacts Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col gap-2">
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
          </div>
          
          <div className="flex items-center gap-4 flex-wrap print:hidden">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 h-10 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors">
              <input 
                type="checkbox"
                checked={showSummaries}
                onChange={() => setShowSummaries(!showSummaries)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              הצג שורת סיכומים
            </label>

            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 h-10 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors">
              <input 
                type="checkbox"
                checked={showRowNumbering}
                onChange={() => {
                  setShowRowNumbering(!showRowNumbering);
                }}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              הצג מיספור שורות
            </label>

            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 h-10 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors">
              <input 
                type="checkbox"
                checked={showRowCheckboxes}
                onChange={() => {
                  setShowRowCheckboxes(!showRowCheckboxes);
                  setSelectedRowIds([]);
                }}
                className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500"
              />
              הצג תיבות בחירה
            </label>

            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 h-10 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors">
              <input 
                type="checkbox"
                checked={splitChildrenRows}
                onChange={() => setSplitChildrenRows(!splitChildrenRows)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              הצג ילדים בשורות נפרדות
            </label>

            <Button 
              onClick={exportToCsv}
              variant="outline" 
              className="rounded-xl h-10 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              ייצא לאקסל
            </Button>

            <Button 
              onClick={() => window.print()}
              variant="outline" 
              className="rounded-xl h-10 border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              הדפס
            </Button>
            
            <div className="relative">
              <Button 
                onClick={() => setShowColumnsMenu(!showColumnsMenu)}
                variant="outline" 
                className={`rounded-xl h-10 border-slate-200 flex items-center gap-2 ${showColumnsMenu ? 'bg-slate-100 ring-2 ring-indigo-500/20' : ''}`}
              >
                <Columns className="w-4 h-4" />
                בחר עמודות להצגה
              </Button>
              
              {showColumnsMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowColumnsMenu(false)}></div>
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 shadow-xl rounded-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                      {allAvailableColumns.map(col => {
                        const isSelected = selectedColumns.includes(col);
                        return (
                          <div key={col} className={`flex items-center justify-between p-1.5 rounded-lg transition-colors ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
                            <label className="flex items-center gap-2 cursor-pointer flex-grow min-w-0">
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => toggleColumn(col)}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
                              />
                              <span className="text-sm font-medium text-slate-700 truncate" title={getColumnLabel(col)}>{getColumnLabel(col)}</span>
                            </label>
                            {isSelected && (
                              <div className="flex flex-row-reverse items-center gap-0.5 shrink-0 ml-2">
                                <button onClick={(e) => moveColumnUp(col, e)} className="p-1 hover:bg-indigo-100 text-indigo-600 rounded" title="הזז למעלה/ימינה">
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={(e) => moveColumnDown(col, e)} className="p-1 hover:bg-indigo-100 text-indigo-600 rounded" title="הזז למטה/שמאלה">
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {selectedRowIds.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex justify-between items-center gap-4 text-xs font-bold text-indigo-900 mb-6 animate-in fade-in slide-in-from-top-1 print:hidden">
            <span className="text-sm font-bold text-indigo-750">נבחרו {selectedRowIds.length} רשומות מתוך {processedContacts.length}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm(`האם אתה בטוח שברצונך למחוק את ${selectedRowIds.length} אנשי הקשר שנבחרו?`)) return;
                  try {
                    await handleBulkAction(selectedRowIds, "trash");
                    setSelectedRowIds([]);
                    loadData();
                  } catch (error: any) {
                    alert("שגיאה במחיקת הרשומות: " + error.message);
                  }
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                מחק רשומות שנבחרו
              </button>
              <button
                type="button"
                onClick={() => setSelectedRowIds([])}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl cursor-pointer transition-colors"
              >
                ביטול בחירה
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                {showRowCheckboxes && (
                  <th className="px-4 py-3 text-center align-top w-10 whitespace-nowrap">
                    <input 
                      type="checkbox"
                      checked={processedContacts.length > 0 && selectedRowIds.length === processedContacts.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRowIds(processedContacts.map(c => c.id || ""));
                        } else {
                          setSelectedRowIds([]);
                        }
                      }}
                      className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                )}
                {showRowNumbering && (
                  <th className="px-4 py-3 text-right align-top w-12 text-xs font-bold text-slate-500">
                    #
                  </th>
                )}
                {selectedColumns.map(col => (
                  <th key={col} className="px-4 py-3 whitespace-nowrap align-top">
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => handleSort(col)}
                        className="flex items-center justify-end gap-1.5 text-slate-700 hover:text-indigo-600 transition-colors w-full"
                        title="לחץ למיון"
                      >
                        {sortConfig?.key === col ? (
                          sortConfig.direction === 'asc' ? <ArrowDown className="w-3.5 h-3.5 text-indigo-600" /> : <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                        <span>{getColumnLabel(col)}</span>
                      </button>
                      <div className="w-full mt-1">
                        <select
                          value={columnDataFilters[col] || 'all'}
                          onChange={(e) => {
                            const val = e.target.value as 'all' | 'has_data' | 'no_data';
                            setColumnDataFilters(prev => ({ ...prev, [col]: val }));
                          }}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none font-medium cursor-pointer"
                        >
                          <option value="all">הצג הכל</option>
                          <option value="has_data">עם נתון בלבד</option>
                          <option value="no_data">ללא נתון בלבד</option>
                        </select>
                      </div>
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center align-top print:hidden">פעולות</th>
              </tr>
              
              {showSummaries && filteredContacts.length > 0 && (
                <tr className="bg-indigo-50/40 border-t border-indigo-100 shadow-inner">
                  {showRowCheckboxes && <th className="px-4 py-3"></th>}
                  {showRowNumbering && <th className="px-4 py-3"></th>}
                  {selectedColumns.map(col => {
                    let sum = 0;
                    let count = 0;
                    let isNumeric = false;
                    filteredContacts.forEach((c: any) => {
                      const val = getContactValue(c, col);
                      if (val !== null && val !== undefined && val !== "") {
                        count++;
                        if (!isNaN(Number(val)) && typeof val !== "boolean") {
                          const strVal = String(val).replace(/[^0-9.-]/g, '');
                          if (strVal.length > 6 && col !== 'total_spent') {
                            // Too long, treat as text (like phone or ID) so we just count it
                          } else {
                            sum += Number(val);
                            isNumeric = true;
                          }
                        }
                      }
                    });
                    
                    return (
                      <th key={`summary-${col}`} className="px-4 py-3 whitespace-nowrap">
                        {isNumeric ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs font-medium text-slate-500">סה"כ:</span>
                            <span className="text-indigo-700 font-black">{sum.toLocaleString()}</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs font-medium text-slate-500">כמות:</span>
                            <span className="text-slate-700 font-bold">{count.toLocaleString()}</span>
                          </div>
                        )}
                      </th>
                    );
                  })}
                  <th className="px-4 py-3 print:hidden"></th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedContacts.slice(0, 50).map((contact: any, idx: number) => {
                const isSelected = selectedRowIds.includes(contact.id || "");
                return (
                  <tr key={contact.id || idx} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50/20' : ''}`}>
                    {showRowCheckboxes && (
                      <td className="px-4 py-3 text-center w-10 whitespace-nowrap">
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRowIds(prev => [...prev, contact.id || ""]);
                            } else {
                              setSelectedRowIds(prev => prev.filter(id => id !== (contact.id || "")));
                            }
                          }}
                          className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                    )}
                    {showRowNumbering && (
                      <td className="px-4 py-3 text-right text-slate-400 font-mono text-xs w-12">
                        {idx + 1}
                      </td>
                    )}
                    {selectedColumns.map(col => {
                      const val = getContactValue(contact, col);
                      const isEditing = editingCell?.id === contact.id && editingCell?.field === col;
                      
                      return (
                        <td 
                          key={col} 
                          className="px-4 py-3 text-slate-700 max-w-[200px] cursor-pointer hover:bg-slate-100 transition-colors group" 
                          title={String(val || "")}
                          onDoubleClick={() => {
                            setEditingCell({ id: contact.id || "", field: col });
                            setEditValue(String(val || ""));
                          }}
                        >
                          {isEditing ? (
                            <input
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit();
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                              className="w-full border border-indigo-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                            />
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="truncate">{formatCellValue(val)}</span>
                              <Edit2 className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 flex items-center justify-center gap-2 print:hidden">
                    <button 
                      onClick={(e) => handleEditClick(contact.id, e)}
                      className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500 transition-colors"
                      title="ערוך"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteClick(contact.id, e)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors"
                      title="מחק"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
              {processedContacts.length > 50 && (
                <tr>
                  <td colSpan={selectedColumns.length + 1 + (showRowCheckboxes ? 1 : 0) + (showRowNumbering ? 1 : 0)} className="px-4 py-4 text-center text-slate-500 bg-slate-50 font-medium">
                    מוצגות 50 הרשומות הראשונות (מתוך {processedContacts.length}). סנן נתונים כדי למצוא רשומות ספציפיות.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ContactModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        contact={selectedContact} 
        onSuccess={loadData} 
      />
    </div>
  );
}
