"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  getContacts, 
  getCRMStats, 
  getCRMFilters, 
  handleBulkAction, 
  importContacts,
  getCustomFields,
  addCustomField,
  updateCustomField,
  deleteCustomField,
  getCustomTabs,
  addCustomTab,
  updateCustomTab,
  deleteCustomTab
} from "@/features/crm/actions";
import { Contact } from "@/features/crm/types";
import { ContactModal } from "./ContactModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { 
  Plus, 
  Download, 
  Upload, 
  RefreshCw, 
  Search, 
  Users, 
  CheckSquare, 
  Square, 
  ChevronRight, 
  ChevronLeft, 
  ArrowUpDown,
  Trash2,
  MessageCircle,
  Mail,
  Clock,
  MoreVertical,
  TrendingUp,
  Settings
} from "lucide-react";
import * as XLSX from "xlsx";
import { MessageModal } from "./MessageModal";
import { Modal } from "@/components/ui/Modal";

const getInitials = (name: string, fm?: string) => {
  const first = name ? name.trim().charAt(0) : "";
  const last = fm ? fm.trim().charAt(0) : "";
  return `${first}${last}`.toUpperCase();
};

const getAvatarBg = (name: string) => {
  const colors = [
    "bg-red-500",
    "bg-pink-500",
    "bg-purple-500",
    "bg-indigo-500",
    "bg-blue-500",
    "bg-sky-500",
    "bg-teal-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-orange-500",
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return colors[sum % colors.length];
};

export default function CRMDashboardPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [status, setStatus] = useState<"active" | "trashed">("active");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [leadSourceFilter, setLeadSourceFilter] = useState("");
  
  // Sorting
  const [orderby, setOrderby] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Stats & Filters
  const [stats, setStats] = useState({ active: 0, trashed: 0 });
  const [filtersConfig, setFiltersConfig] = useState<{
    tags: string[];
    cities: string[];
    lead_sources: string[];
  }>({ tags: [], cities: [], lead_sources: [] });

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // CRM Dynamic Settings Modal
  const [isCrmModalOpen, setIsCrmModalOpen] = useState(false);
  const [newCrmFieldLabel, setNewCrmFieldLabel] = useState("");
  const [newCrmFieldType, setNewCrmFieldType] = useState("text");
  const [newCrmFieldCategory, setNewCrmFieldCategory] = useState("details");
  const [subFields, setSubFields] = useState<Array<{ label: string; type: string }>>([]);
  const [customTabs, setCustomTabs] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [crmSettingsTab, setCrmSettingsTab] = useState<"fields" | "tabs">("fields");
  const [newTabLabel, setNewTabLabel] = useState("");

  // Custom Field Edit states
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editFieldLabel, setEditFieldLabel] = useState("");
  const [editFieldType, setEditFieldType] = useState("text");
  const [editFieldCategory, setEditFieldCategory] = useState("details");
  const [editSubFields, setEditSubFields] = useState<Array<{ id?: string; label: string; type: string }>>([]);

  // Message Modal States
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageTargetContacts, setMessageTargetContacts] = useState<Contact[]>([]);
  const [messageModalType, setMessageModalType] = useState<"whatsapp" | "email" | "reminder" | null>(null);

  const openMessageModal = (contacts: Contact[], type: "whatsapp" | "email" | "reminder") => {
    setMessageTargetContacts(contacts);
    setMessageModalType(type);
    setMessageModalOpen(true);
  };

  const [activeDropdownContactId, setActiveDropdownContactId] = useState<string | null>(null);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to page 1 on search
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, statsRes, filtersRes] = await Promise.all([
        getContacts({
          status,
          search: debouncedSearch,
          tag_filter: tagFilter,
          city_filter: cityFilter,
          lead_source_filter: leadSourceFilter,
          orderby,
          order,
          page,
          per_page: perPage
        }),
        getCRMStats(),
        getCRMFilters()
      ]);

      if ((res as any).error) {
        alert("שגיאה בטעינת אנשי קשר: " + (res as any).error);
      }

      setContacts(res.contacts);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setStats(statsRes);
      setFiltersConfig(filtersRes);
      setSelectedIds([]); // clear selection on load
    } catch (error) {
      console.error("Failed to load CRM data:", error);
    } finally {
      setLoading(false);
    }
  }, [status, debouncedSearch, tagFilter, cityFilter, leadSourceFilter, orderby, order, page, perPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    getCustomFields().then(setCustomFields);
    getCustomTabs().then(setCustomTabs);
  }, [isCrmModalOpen]);

  // Sorting Handler
  const handleSort = (field: string) => {
    if (orderby === field) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setOrderby(field);
      setOrder("desc");
    }
    setPage(1);
  };

  // Selection Handlers
  const handleSelectAll = () => {
    if (selectedIds.length === contacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(contacts.map(c => c.id || ""));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Bulk Action Handler
  const handleExecuteBulkAction = async () => {
    if (selectedIds.length === 0 || !bulkAction) return;

    if (bulkAction === "whatsapp" || bulkAction === "email") {
      const selectedContacts = contacts.filter(c => selectedIds.includes(c.id || ""));
      openMessageModal(selectedContacts, bulkAction);
      setBulkAction("");
      return;
    }
    
    let confirmMsg = "";
    let actionType: "trash" | "restore" | "delete_permanent";

    if (bulkAction === "trash") {
      confirmMsg = `האם אתה בטוח שברצונך להעביר ${selectedIds.length} אנשי קשר לסל האשפה?`;
      actionType = "trash";
    } else if (bulkAction === "restore") {
      confirmMsg = `האם אתה בטוח שברצונך לשחזר ${selectedIds.length} אנשי קשר?`;
      actionType = "restore";
    } else if (bulkAction === "delete_permanent") {
      confirmMsg = `אזהרה! האם אתה בטוח שברצונך למחוק לצמיתות ${selectedIds.length} אנשי קשר? פעולה זו אינה הפיכה!`;
      actionType = "delete_permanent";
    } else {
      return;
    }

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      await handleBulkAction(selectedIds, actionType);
      alert("הפעולה הושלמה בהצלחה");
      setSelectedIds([]); // clear selection
      setBulkAction("");
      loadData();
    } catch (err) {
      console.error(err);
      alert("שגיאה בביצוע הפעולה");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    const actionType = status === "active" ? "trash" : "delete_permanent";
    const confirmMsg = status === "active" 
      ? "האם אתה בטוח שברצונך להעביר איש קשר זה לסל האשפה?" 
      : "אזהרה! האם אתה בטוח שברצונך למחוק לצמיתות איש קשר זה? פעולה זו אינה הפיכה!";
    
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      await handleBulkAction([id], actionType);
      alert("הפעולה הושלמה בהצלחה");
      loadData();
    } catch (err) {
      console.error(err);
      alert("שגיאה בביצוע הפעולה");
    } finally {
      setActionLoading(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (contacts.length === 0) {
      alert("אין נתונים לייצוא");
      return;
    }

    // Map contacts to flat spreadsheet structure
    const exportData = contacts.map(c => ({
      "מזהה (ID)": c.id || "",
      "שם פרטי": c.conta_name,
      "שם משפחה": c.f_m || "",
      "טלפון נייד": c.conta_phone,
      "דוא\"ל": c.email || "",
      "מגדר": c.gender || "",
      "עיר": c.mh_crm_city || "",
      "רחוב": c.mh_crm_street || "",
      "תג 1": c.tg1 || "",
      "תג 2": c.tg2 || "",
      "תג 3": c.tg3 || "",
      "שם חברה": c.company_name || "",
      "תפקיד": c.job_title || "",
      "מקור הליד": c.lead_source || "",
      "טלפון עבודה": c.work_phone || "",
      "אתר": c.website || "",
      "תאריך לידה": c.birth_date || "",
      "הערות": c.notes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "אנשי קשר");
    XLSX.writeFile(wb, `crm_contacts_${status}_${Date.now()}.xlsx`);
  };

  // Helper to safely get value from spreadsheet row keys
  const getValue = (row: any, keys: string[]): string => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null) {
        return String(row[key]).trim();
      }
    }
    return "";
  };

  // Helper to normalize phone numbers and restore leading zeros
  const sanitizePhone = (val: any): string => {
    let phone = String(val || "").trim();
    if (!phone) return "";
    // Remove dashes, spaces, and other separators
    phone = phone.replace(/[-\s]/g, "");
    // If it's a 9-digit Israeli mobile number (starts with 5/7), prepend '0'
    if (/^[57]\d{8}$/.test(phone)) {
      phone = "0" + phone;
    }
    // If it's an 8-digit Israeli landline number (starts with 2/3/4/8/9), prepend '0'
    if (/^[23489]\d{7}$/.test(phone)) {
      phone = "0" + phone;
    }
    return phone;
  };

  // Import from Excel/CSV
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setActionLoading(true);
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: "array" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawRows = XLSX.utils.sheet_to_json(ws, { raw: false }) as any[];

        if (rawRows.length === 0) {
          alert("קובץ ריק או לא תקין");
          return;
        }

        // Map spreadsheet columns to CRM field keys
        const mappedContacts: Partial<Contact>[] = rawRows.map(row => {
          return {
            id: getValue(row, ["מזהה (ID)", "מזהה", "ID", "id"]),
            conta_name: getValue(row, ["שם פרטי", "שם", "Name", "First Name"]),
            f_m: getValue(row, ["שם משפחה", "Last Name"]),
            conta_phone: sanitizePhone(getValue(row, ["טלפון נייד", "טלפון", "נייד", "Phone", "Mobile"])),
            email: getValue(row, ["דוא\"ל", "דואל", "דואר אלקטרוני", "אימייל", "Email"]),
            gender: getValue(row, ["מגדר", "Gender"]),
            mh_crm_city: getValue(row, ["עיר", "City"]),
            mh_crm_street: getValue(row, ["רחוב", "Street"]),
            tg1: getValue(row, ["תג 1", "תג1", "Tag 1"]),
            tg2: getValue(row, ["תג 2", "תג2", "Tag 2"]),
            tg3: getValue(row, ["תג 3", "תג3", "Tag 3"]),
            company_name: getValue(row, ["שם חברה", "חברה", "Company", "Company Name"]),
            job_title: getValue(row, ["תפקיד", "Job Title", "Role"]),
            lead_source: getValue(row, ["מקור הליד", "מקור", "Lead Source"]),
            work_phone: sanitizePhone(getValue(row, ["טלפון עבודה", "Work Phone"])),
            website: getValue(row, ["אתר", "Website"]),
            birth_date: getValue(row, ["תאריך לידה", "Birth Date", "Date of Birth"]),
            notes: getValue(row, ["הערות", "Notes"]),
          };
        });

        const importResult = await importContacts(mappedContacts);
        alert(`ייבוא אקסל הושלם בהצלחה!\nנוצרו: ${importResult.created}\nעודכנו: ${importResult.updated}\nדולגו: ${importResult.skipped}`);
        loadData();
      } catch (err: any) {
        console.error(err);
        alert("שגיאה בפענוח קובץ האקסל: " + err.message);
      } finally {
        setActionLoading(false);
        // Reset file input
        e.target.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const openEditModal = (contact: Contact) => {
    setSelectedContact(contact);
    setModalOpen(true);
  };

  const openAddModal = () => {
    setSelectedContact(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-600" />
            מערכת ניהול לקוחות ואנשי קשר (CRM)
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            נהל, סנן ותעד את נתוני חברי הקהילה של בית חב"ד בצורה נוחה ומאובטחת.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2.5">
          <Button 
            onClick={openAddModal} 
            className="rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 h-11 px-5"
          >
            <Plus className="w-4 h-4" />
            הוסף איש קשר
          </Button>

          <label className="flex items-center justify-center rounded-2xl border border-slate-200 hover:border-slate-300 bg-white shadow-sm hover:shadow-md cursor-pointer font-bold text-slate-700 text-sm h-11 px-5 transition-all gap-1.5">
            <Upload className="w-4 h-4 text-slate-500" />
            <span>ייבוא מאקסל</span>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleImportExcel} 
              className="hidden" 
              disabled={actionLoading}
            />
          </label>

          <Button 
            onClick={handleExportExcel} 
            variant="outline"
            className="rounded-2xl border-slate-200 hover:bg-slate-50 shadow-sm font-bold text-slate-700 flex items-center gap-1.5 h-11 px-5"
          >
            <Download className="w-4 h-4 text-slate-500" />
            ייצוא לאקסל
          </Button>

          <Button 
            onClick={() => setIsCrmModalOpen(true)} 
            variant="outline"
            className="rounded-2xl border-slate-200 hover:bg-slate-50 shadow-sm font-bold text-slate-700 flex items-center gap-1.5 h-11 px-5"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            הגדרות שדות ולשוניות
          </Button>

          <Button 
            onClick={loadData} 
            variant="outline"
            className="rounded-2xl border-slate-200 hover:bg-slate-50 shadow-sm p-0 w-11 h-11 flex items-center justify-center"
            title="טען מחדש"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => { setStatus("active"); setPage(1); }}
          className={`flex items-center gap-2 py-3 px-4 font-black text-sm border-b-2 transition-all ${
            status === "active" 
              ? "border-indigo-600 text-indigo-600" 
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          פעילים
          <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${status === "active" ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-600"}`}>
            {stats.active}
          </span>
        </button>

        <button
          onClick={() => { setStatus("trashed"); setPage(1); }}
          className={`flex items-center gap-2 py-3 px-4 font-black text-sm border-b-2 transition-all ${
            status === "trashed" 
              ? "border-indigo-600 text-indigo-600" 
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          סל אשפה
          <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${status === "trashed" ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-600"}`}>
            {stats.trashed}
          </span>
        </button>

        <div className="flex-grow"></div>

        <a
          href="/dashboard/crm/analytics"
          className="flex items-center gap-2 py-3 px-4 font-black text-sm border-b-2 border-transparent text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/50 transition-all rounded-t-xl"
        >
          <TrendingUp className="w-4 h-4" />
          לאנליטיקה ולדוחות
        </a>
      </div>

      {/* Filters Area */}
      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Search */}
        <div className="lg:col-span-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש לפי שם, טלפון, אימייל, עיר, תגים..."
            className="pr-10 rounded-xl"
          />
        </div>

        {/* Filters */}
        <div className="lg:col-span-5 flex flex-wrap md:flex-nowrap gap-3">
          {/* Tag Filter */}
          <select
            value={tagFilter}
            onChange={(e) => { setTagFilter(e.target.value); setPage(1); }}
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">כל התוויות</option>
            {filtersConfig.tags.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* City Filter */}
          <select
            value={cityFilter}
            onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">כל הערים</option>
            {filtersConfig.cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Lead Source Filter */}
          <select
            value={leadSourceFilter}
            onChange={(e) => { setLeadSourceFilter(e.target.value); setPage(1); }}
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">כל המקורות</option>
            {filtersConfig.lead_sources.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Bulk Actions */}
        <div className="lg:col-span-3 flex gap-2">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">פעולות על נבחרים...</option>
            {status === "active" ? (
              <option value="trash">העבר לסל אשפה</option>
            ) : (
              <>
                <option value="restore">שחזר</option>
                <option value="delete_permanent">מחק לצמיתות</option>
              </>
            )}
            <option value="whatsapp">שלח הודעת וואטסאפ מרוכזת</option>
            <option value="email">שלח מייל מרוכז</option>
          </select>
          <Button 
            onClick={handleExecuteBulkAction}
            disabled={!bulkAction || selectedIds.length === 0 || actionLoading}
            className="rounded-xl font-bold bg-slate-800 hover:bg-slate-900 text-white shrink-0"
          >
            ביצוע
          </Button>
        </div>
      </div>

      {/* Main WhatsApp-style List Container */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        )}

        {/* List Header */}
        <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between text-xs text-slate-500 font-bold px-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleSelectAll} 
              className="text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-2"
              type="button"
            >
              {selectedIds.length === contacts.length && contacts.length > 0 ? (
                <CheckSquare className="w-5 h-5 text-indigo-600" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              <span>בחר הכל ({selectedIds.length} מסומנים)</span>
            </button>

            <span className="text-slate-300">|</span>

            <div className="flex items-center gap-1.5 text-slate-500">
              <span>הצג:</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-transparent border border-slate-200 rounded-lg px-2 py-1 text-slate-600 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value={10}>10 שורות</option>
                <option value={25}>25 שורות</option>
                <option value={50}>50 שורות</option>
                <option value={100}>100 שורות</option>
                <option value={250}>250 שורות</option>
                <option value={0}>הצג הכל</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => handleSort("conta_name")}
              className={`hover:text-slate-800 transition-colors flex items-center gap-1 ${orderby === 'conta_name' ? 'text-indigo-600' : ''}`}
              type="button"
            >
              מיין לפי שם
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => handleSort("total_spent")}
              className={`hover:text-slate-800 transition-colors flex items-center gap-1 ${orderby === 'total_spent' ? 'text-indigo-600' : ''}`}
              type="button"
            >
              מיין לפי תרומות
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* List Items */}
        <div className="divide-y divide-slate-100">
          {contacts.map((c) => (
            <div 
              key={c.id}
              onClick={() => openEditModal(c)}
              className="flex items-center justify-between p-4 px-6 hover:bg-slate-50/50 active:bg-slate-100/30 cursor-pointer transition-all duration-200 group select-none"
            >
              {/* Right Side (Checkbox + Avatar + Info) */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Checkbox (Stop propagation!) */}
                <div 
                  onClick={(e) => { e.stopPropagation(); handleSelectOne(c.id || ""); }}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                >
                  {selectedIds.includes(c.id || "") ? (
                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </div>

                {/* Avatar */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105 ${getAvatarBg(c.conta_name)}`}>
                  {getInitials(c.conta_name, c.f_m)}
                </div>

                {/* Info details */}
                <div className="flex-grow min-w-0 text-right space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-slate-800 text-sm md:text-base group-hover:text-indigo-600 transition-colors">
                      {c.conta_name} {c.f_m}
                    </h4>
                    {c.gender && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border ${
                        c.gender === "זכר" ? "bg-blue-50/50 border-blue-100 text-blue-600" : "bg-pink-50/50 border-pink-100 text-pink-600"
                      }`}>
                        {c.gender}
                      </span>
                    )}
                    
                    {c.children && c.children.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        ילדים: {c.children.map(child => child.first_name).filter(Boolean).join(", ")}
                      </span>
                    )}

                    {/* Quick Actions - Desktop View */}
                    <div className="hidden md:flex items-center gap-1.5 mr-3 opacity-0 group-hover:opacity-100 transition-all duration-200" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openMessageModal([c], "whatsapp")}
                        title="שלח הודעת וואטסאפ"
                        className="p-1 rounded-lg hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors"
                        type="button"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                      {c.email && (
                        <button
                          onClick={() => openMessageModal([c], "email")}
                          title="שלח מייל"
                          className="p-1 rounded-lg hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 transition-colors"
                          type="button"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => openMessageModal([c], "reminder")}
                        title="כתוב תזכורת/פעילות"
                        className="p-1 rounded-lg hover:bg-amber-50 text-amber-600 hover:text-amber-700 transition-colors"
                        type="button"
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(c.id || "")}
                        title={status === "active" ? "העבר לאשפה" : "מחק לצמיתות"}
                        className="p-1 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-600 transition-colors"
                        type="button"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick Actions - Mobile View (Dropdown) */}
                    <div className="md:hidden block relative mr-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setActiveDropdownContactId(activeDropdownContactId === c.id ? null : c.id || null)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all flex items-center justify-center"
                        type="button"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {activeDropdownContactId === c.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10 bg-transparent" 
                            onClick={() => setActiveDropdownContactId(null)}
                          />
                          <div className="absolute left-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-2xl py-1.5 z-20 min-w-[130px] divide-y divide-slate-50/80">
                            <button
                              onClick={() => { openMessageModal([c], "whatsapp"); setActiveDropdownContactId(null); }}
                              className="w-full text-right px-3 py-2 text-xs font-bold hover:bg-emerald-50 text-slate-700 flex items-center gap-2 transition-colors"
                              type="button"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>וואטסאפ</span>
                            </button>
                            {c.email && (
                              <button
                                onClick={() => { openMessageModal([c], "email"); setActiveDropdownContactId(null); }}
                                className="w-full text-right px-3 py-2 text-xs font-bold hover:bg-indigo-50 text-slate-700 flex items-center gap-2 transition-colors"
                                type="button"
                              >
                                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                                <span>שליחת מייל</span>
                              </button>
                            )}
                            <button
                              onClick={() => { openMessageModal([c], "reminder"); setActiveDropdownContactId(null); }}
                              className="w-full text-right px-3 py-2 text-xs font-bold hover:bg-amber-50 text-slate-700 flex items-center gap-2 transition-colors"
                              type="button"
                            >
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>תזכורת</span>
                            </button>
                            <button
                              onClick={() => { handleDeleteContact(c.id || ""); setActiveDropdownContactId(null); }}
                              className="w-full text-right px-3 py-2 text-xs font-bold hover:bg-rose-50 text-rose-600 flex items-center gap-2 transition-colors"
                              type="button"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>מחיקה</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-600" dir="ltr">{c.conta_phone}</span>
                    {c.mh_crm_city && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>{c.mh_crm_city}</span>
                      </>
                    )}
                    {c.company_name && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400 italic">{c.company_name}</span>
                      </>
                    )}
                  </div>
                  {c.notes && (
                    <p className="text-slate-400 text-xs truncate max-w-sm md:max-w-md pt-0.5 leading-normal">
                      {c.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Left Side (Tags + Spent & Date) */}
              <div className="flex items-center gap-4 shrink-0 pl-1 text-left">
                {/* Tags (Hidden on mobile) */}
                <div className="hidden sm:flex items-center gap-1.5 flex-wrap max-w-xs justify-end">
                  {c.tg1 && <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200/50 rounded-lg text-[9px] font-bold">{c.tg1}</span>}
                  {c.tg2 && <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200/50 rounded-lg text-[9px] font-bold">{c.tg2}</span>}
                  {c.tg3 && <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200/50 rounded-lg text-[9px] font-bold">{c.tg3}</span>}
                </div>

                {/* Spent & Time */}
                <div className="flex flex-col items-end gap-1 text-left justify-center">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" }) : "-"}
                  </span>
                  <span className="text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">
                    ₪{(c.total_spent || 0).toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {contacts.length === 0 && !loading && (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2 bg-slate-50/20">
              <Users className="w-12 h-12 text-slate-300" />
              <span className="text-sm font-semibold">לא נמצאו אנשי קשר התואמים את הסינון.</span>
            </div>
          )}
        </div>

        {/* Pagination Section */}
        {(totalPages > 1 || perPage === 0) && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-bold">
              {perPage > 0 ? (
                `מציג ${(page - 1) * perPage + 1} עד ${Math.min(page * perPage, total)} מתוך ${total} אנשי קשר`
              ) : (
                `מציג את כל ${total} אנשי קשר`
              )}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-2 h-9 w-9 flex items-center justify-center rounded-xl"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? "primary" : "outline"}
                    onClick={() => setPage(p)}
                    className={`h-9 w-9 flex items-center justify-center rounded-xl p-0 font-bold ${
                      p === page ? "bg-indigo-600 text-white" : ""
                    }`}
                  >
                    {p}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-2 h-9 w-9 flex items-center justify-center rounded-xl"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      <ContactModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        contact={selectedContact}
        onSuccess={loadData}
      />

      {/* Message Modal */}
      <MessageModal
        isOpen={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        contacts={messageTargetContacts}
        type={messageModalType}
        onSuccess={loadData}
      />

      {/* Modal for CRM fields & tabs settings */}
      <Modal isOpen={isCrmModalOpen} onClose={() => setIsCrmModalOpen(false)}>
        <Modal.Content className="text-right font-sans max-w-2xl max-h-[85vh] overflow-y-auto">
          <Modal.Header title="ניהול שדות ולשוניות מותאמים אישית ל-CRM" description="הגדר את מבנה כרטיס הלקוח במערכת על ידי יצירת לשוניות ושדות חדשים." />
          
          {/* Settings Tabs Selector */}
          <div className="flex border-b border-slate-100 mb-4">
            <button
              type="button"
              onClick={() => setCrmSettingsTab("fields")}
              className={`flex-1 py-2 font-bold text-center border-b-2 text-xs transition-colors ${crmSettingsTab === "fields" ? "border-indigo-650 text-indigo-650" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              ניהול שדות
            </button>
            <button
              type="button"
              onClick={() => setCrmSettingsTab("tabs")}
              className={`flex-1 py-2 font-bold text-center border-b-2 text-xs transition-colors ${crmSettingsTab === "tabs" ? "border-indigo-650 text-indigo-650" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              ניהול לשוניות (קטגוריות)
            </button>
          </div>

          {crmSettingsTab === "tabs" ? (
            /* TAB: MANAGE TABS */
            <div className="space-y-4 py-2 text-xs">
              {/* Add New Tab form */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-2 items-end">
                <div className="flex-grow space-y-1">
                  <label className="font-bold text-slate-650">שם הלשונית החדשה</label>
                  <input
                    type="text"
                    value={newTabLabel}
                    onChange={(e) => setNewTabLabel(e.target.value)}
                    placeholder="למשל: פעילות קהילה, חוגים"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <Button
                  type="button"
                  onClick={async () => {
                    if (!newTabLabel.trim()) return;
                    const res = await addCustomTab({ label: newTabLabel.trim() });
                    if (res.success && res.tab) {
                      setCustomTabs(prev => [...prev, res.tab]);
                      setNewTabLabel("");
                    } else {
                      alert("שגיאה בהוספת לשונית");
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 shrink-0"
                >
                  הוסף לשונית
                </Button>
              </div>

              {/* List of Custom Tabs */}
              <div className="space-y-2">
                <span className="font-bold text-slate-400">לשוניות מותאמות אישית קיימות:</span>
                {customTabs.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 italic bg-white border border-dashed rounded-2xl">אין לשוניות מותאמות אישית. הלשוניות המובנות במערכת מוצגות כברירת מחדל.</div>
                ) : (
                  <div className="space-y-2">
                    {customTabs.map(tab => (
                      <div key={tab.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl">
                        <span className="font-bold text-slate-800 text-sm">{tab.label}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              const newLabel = window.prompt("הזן שם חדש ללשונית:", tab.label);
                              if (newLabel && newLabel.trim() && newLabel.trim() !== tab.label) {
                                const res = await updateCustomTab(tab.id, newLabel.trim());
                                if (res.success) {
                                  setCustomTabs(customTabs.map(t => t.id === tab.id ? { ...t, label: newLabel.trim() } : t));
                                }
                              }
                            }}
                            className="text-xs text-indigo-650 hover:underline font-bold px-2"
                          >
                            ערוך שם
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!window.confirm(`האם אתה בטוח שברצונך למחוק את הלשונית "${tab.label}"?`)) return;
                              const res = await deleteCustomTab(tab.id);
                              if (res.success) {
                                setCustomTabs(customTabs.filter(t => t.id !== tab.id));
                              }
                            }}
                            className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2"
                          >
                            מחק
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* TAB: MANAGE FIELDS */
            <div className="space-y-4 py-2 text-xs">
              {/* Add Custom Field Form */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <span className="font-bold text-slate-700 block border-b pb-1.5 text-xs">יצירת שדה מותאם אישית חדש:</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-655">שם השדה (תווית)</label>
                    <input
                      type="text"
                      value={newCrmFieldLabel}
                      onChange={(e) => setNewCrmFieldLabel(e.target.value)}
                      placeholder="למשל: מידת חולצה, שם מוסד"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-655">סוג השדה</label>
                    <select
                      value={newCrmFieldType}
                      onChange={(e) => {
                        setNewCrmFieldType(e.target.value);
                        if (e.target.value !== "repeater") {
                          setSubFields([]);
                        }
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none"
                    >
                      <option value="text">טקסט חופשי</option>
                      <option value="number">מספר</option>
                      <option value="date">תאריך</option>
                      <option value="textarea">אזור טקסט ארוך</option>
                      <option value="image">תמונה</option>
                      <option value="wysiwyg">עורך טקסט עשיר (WYSIWYG)</option>
                      <option value="repeater">שדה חוזר (Repeater - רשימה מרובת שדות)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-655">לשונית קטגוריה</label>
                    <select
                      value={newCrmFieldCategory}
                      onChange={(e) => setNewCrmFieldCategory(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none"
                    >
                      <option value="details">פרטים כלליים</option>
                      <option value="camp">משפחה וקייטנה</option>
                      <option value="company">חברה ומקור</option>
                      <option value="tags">תיוגים והערות</option>
                      <option value="events">אירועים ומפגשים</option>
                      {customTabs.map(t => (
                        <option key={t.id} value={t.id}>{t.label} (לשונית מותאמת)</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Subfields editor for Repeater field */}
                {newCrmFieldType === "repeater" && (
                  <div className="border border-slate-200 bg-white p-3 rounded-xl space-y-3 animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-indigo-650">הגדרת תתי-שדות לשדה החוזר:</span>
                      <button
                        type="button"
                        onClick={() => setSubFields([...subFields, { label: "", type: "text" }])}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        הוסף תת-שדה
                      </button>
                    </div>
                    
                    {subFields.length === 0 ? (
                      <div className="text-center py-4 text-slate-400 italic">לחץ על הוסף תת-שדה כדי להוסיף עמודות לשדה החוזר</div>
                    ) : (
                      <div className="space-y-2">
                        {subFields.map((sf, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={sf.label}
                              onChange={(e) => {
                                const updated = [...subFields];
                                updated[idx].label = e.target.value;
                                setSubFields(updated);
                              }}
                              placeholder="למשל: שם הילד, שנת לידה"
                              className="flex-grow rounded-lg border px-2.5 py-1.5"
                            />
                            <select
                              value={sf.type}
                              onChange={(e) => {
                                const updated = [...subFields];
                                updated[idx].type = e.target.value;
                                setSubFields(updated);
                              }}
                              className="rounded-lg border px-2.5 py-1.5 bg-white text-[11px]"
                            >
                              <option value="text">טקסט</option>
                              <option value="number">מספר</option>
                              <option value="date">תאריך</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => setSubFields(subFields.filter((_, i) => i !== idx))}
                              className="p-1.5 text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    onClick={async () => {
                      if (!newCrmFieldLabel.trim()) return;
                      
                      // Format sub-fields with generated IDs
                      let subFieldsWithIds: any[] = [];
                      if (newCrmFieldType === "repeater") {
                        const invalidSub = subFields.some(sf => !sf.label.trim());
                        if (invalidSub) {
                          alert("חובה למלא כותרת עבור כל תתי-השדות");
                          return;
                        }
                        subFieldsWithIds = subFields.map((sf, idx) => ({
                          id: `sf_${idx}_${Date.now().toString(36)}`,
                          label: sf.label.trim(),
                          type: sf.type
                        }));
                      }

                      const res = await addCustomField({
                        label: newCrmFieldLabel.trim(),
                        category: newCrmFieldCategory,
                        type: newCrmFieldType,
                        subFields: subFieldsWithIds
                      });
                      if (res.success && res.field) {
                        setCustomFields(prev => [...prev, res.field]);
                        setNewCrmFieldLabel("");
                        setNewCrmFieldType("text");
                        setNewCrmFieldCategory("details");
                        setSubFields([]);
                      } else {
                        alert("שגיאה בהוספת השדה: " + res.error);
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 px-6 font-bold"
                  >
                    הוסף שדה מותאם
                  </Button>
                </div>
              </div>

              {/* List of Custom Fields */}
              <div className="space-y-2">
                <span className="font-bold text-slate-400">שדות מותאמים אישית קיימות:</span>
                {customFields.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 italic bg-white border border-dashed rounded-2xl font-bold">אין שדות מותאמים אישית. הגדר שדות חדשים בממשק למעלה.</div>
                ) : (
                  <div className="space-y-2">
                    {customFields.map(field => {
                      const isEditing = editingFieldId === field.id;
                      if (isEditing) {
                        return (
                          <div key={field.id} className="p-4 bg-slate-50 border border-indigo-150 rounded-xl space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-550">כותרת השדה</label>
                                <input
                                  type="text"
                                  value={editFieldLabel}
                                  onChange={(e) => setEditFieldLabel(e.target.value)}
                                  className="w-full rounded-lg border border-slate-205 bg-white px-2.5 py-1.5 text-xs focus:outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-550">סוג השדה</label>
                                <select
                                  value={editFieldType}
                                  onChange={(e) => {
                                    setEditFieldType(e.target.value);
                                    if (e.target.value !== "repeater") {
                                      setEditSubFields([]);
                                    }
                                  }}
                                  className="w-full rounded-lg border border-slate-205 bg-white px-2.5 py-1.5 text-xs focus:outline-none"
                                >
                                  <option value="text">טקסט חופשי</option>
                                  <option value="number">מספר</option>
                                  <option value="date">תאריך</option>
                                  <option value="textarea">אזור טקסט ארוך</option>
                                  <option value="image">תמונה</option>
                                  <option value="wysiwyg">עורך טקסט עשיר (WYSIWYG)</option>
                                  <option value="repeater">שדה חוזר (Repeater)</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-550">העבר ללשונית</label>
                                <select
                                  value={editFieldCategory}
                                  onChange={(e) => setEditFieldCategory(e.target.value)}
                                  className="w-full rounded-lg border border-slate-205 bg-white px-2.5 py-1.5 text-xs focus:outline-none"
                                >
                                  <option value="details">פרטים כלליים</option>
                                  <option value="camp">משפחה וקייטנה</option>
                                  <option value="company">חברה ומקור</option>
                                  <option value="tags">תיוגים והערות</option>
                                  <option value="events">אירועים ומפגשים</option>
                                  {customTabs.map(t => (
                                    <option key={t.id} value={t.id}>{t.label} (לשונית מותאמת)</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {editFieldType === "repeater" && (
                              <div className="border border-slate-200 bg-white p-3 rounded-lg space-y-2.5 mt-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-bold text-indigo-650">תתי-שדות (עמודות):</span>
                                  <button
                                    type="button"
                                    onClick={() => setEditSubFields([...editSubFields, { label: "", type: "text" }])}
                                    className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                    הוסף תת-שדה
                                  </button>
                                </div>
                                
                                <div className="space-y-2">
                                  {editSubFields.map((sf, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                      <input
                                        type="text"
                                        value={sf.label}
                                        onChange={(e) => {
                                          const updated = [...editSubFields];
                                          updated[idx].label = e.target.value;
                                          setEditSubFields(updated);
                                        }}
                                        placeholder="למשל: שם הילד, שנת לידה"
                                        className="flex-grow rounded-md border px-2 py-1 text-xs"
                                      />
                                      <select
                                        value={sf.type}
                                        onChange={(e) => {
                                          const updated = [...editSubFields];
                                          updated[idx].type = e.target.value;
                                          setEditSubFields(updated);
                                        }}
                                        className="rounded-md border px-2 py-1 bg-white text-[10px]"
                                      >
                                        <option value="text">טקסט</option>
                                        <option value="number">מספר</option>
                                        <option value="date">תאריך</option>
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() => setEditSubFields(editSubFields.filter((_, i) => i !== idx))}
                                        className="p-1 text-slate-400 hover:text-red-500"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex justify-end gap-2 pt-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingFieldId(null)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold text-xs"
                              >
                                ביטול
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!editFieldLabel.trim()) return;
                                  
                                  let finalSubFields: any[] = [];
                                  if (editFieldType === "repeater") {
                                    const invalidSub = editSubFields.some(sf => !sf.label.trim());
                                    if (invalidSub) {
                                      alert("חובה למלא כותרת עבור כל תתי-השדות");
                                      return;
                                    }
                                    finalSubFields = editSubFields.map((sf, idx) => ({
                                      id: sf.id || `sf_${idx}_${Date.now().toString(36)}`,
                                      label: sf.label.trim(),
                                      type: sf.type
                                    }));
                                  }

                                  const res = await updateCustomField(field.id, {
                                    label: editFieldLabel.trim(),
                                    category: editFieldCategory,
                                    type: editFieldType,
                                    subFields: finalSubFields
                                  });
                                  if (res.success) {
                                    setCustomFields(customFields.map(f => f.id === field.id ? { 
                                      ...f, 
                                      label: editFieldLabel.trim(),
                                      category: editFieldCategory,
                                      type: editFieldType,
                                      subFields: finalSubFields
                                    } : f));
                                    setEditingFieldId(null);
                                  } else {
                                    alert("שגיאה בעדכון השדה");
                                  }
                                }}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs"
                              >
                                שמור שדה
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={field.id} className="p-3 bg-white border border-slate-100 rounded-xl space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-bold text-slate-800 text-sm">{field.label}</span>
                              <span className="text-[10px] text-slate-450 mr-2">
                                (סוג: {
                                  field.type === "text" ? "טקסט" :
                                  field.type === "number" ? "מספר" :
                                  field.type === "date" ? "תאריך" :
                                  field.type === "textarea" ? "אזור טקסט" :
                                  field.type === "image" ? "תמונה" :
                                  field.type === "wysiwyg" ? "עורך עשיר" :
                                  field.type === "repeater" ? "שדה חוזר" : field.type
                                } | קטגוריה: {
                                  field.category === "details" ? "פרטים כלליים" :
                                  field.category === "camp" ? "משפחה וקייטנה" :
                                  field.category === "company" ? "חברה ומקור" :
                                  field.category === "tags" ? "תיוגים" :
                                  field.category === "events" ? "אירועים" : 
                                  (customTabs.find(t => t.id === field.category)?.label || field.category)
                                })
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingFieldId(field.id);
                                  setEditFieldLabel(field.label);
                                  setEditFieldType(field.type);
                                  setEditFieldCategory(field.category);
                                  setEditSubFields(field.subFields ? [...field.subFields] : []);
                                }}
                                className="text-xs text-indigo-650 hover:underline font-bold px-2 cursor-pointer"
                              >
                                ערוך
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!window.confirm(`האם אתה בטוח שברצונך למחוק את השדה "${field.label}"?`)) return;
                                  const res = await deleteCustomField(field.id);
                                  if (res.success) {
                                    setCustomFields(customFields.filter(f => f.id !== field.id));
                                  }
                                }}
                                className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 cursor-pointer"
                              >
                                מחק
                              </button>
                            </div>
                          </div>

                          {field.type === "repeater" && field.subFields && Array.isArray(field.subFields) && (
                            <div className="bg-slate-50 p-2 rounded-lg text-[10px] text-slate-500 flex gap-2 flex-wrap">
                              <span className="font-bold text-slate-655 border-l pl-2">תתי-שדות:</span>
                              {field.subFields.map((sf: any, sfIdx: number) => (
                                <span key={sf.id || sfIdx} className="bg-white border rounded px-1.5 py-0.5">
                                  {sf.label} ({sf.type === "number" ? "מספר" : sf.type === "date" ? "תאריך" : "טקסט"})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <Modal.Footer>
            <div className="flex gap-2 justify-end w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCrmModalOpen(false);
                  setNewCrmFieldLabel("");
                  setNewCrmFieldType("text");
                  setNewCrmFieldCategory("details");
                  setSubFields([]);
                  setNewTabLabel("");
                }}
                className="rounded-xl h-10 px-5 font-bold"
              >
                סגור
              </Button>
            </div>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </div>
  );
}
