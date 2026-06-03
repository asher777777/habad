"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { registerCampLead, markCampPaymentSuccess } from "./actions";
import { NedarimCheckout } from "@/features/nedarim/NedarimCheckout";

export function CampRegistrationForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [contactId, setContactId] = useState("");
  const [success, setSuccess] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    child_first_name: "",
    child_last_name: "",
    child_grade: "",
    child_id_number: "",
    gender: "",
    allergies_has: "לא",
    allergies_details: "",
    father_name: "",
    mother_name: "",
    father_phone: "",
    mother_phone: "",
  });

  const [paymentOption, setPaymentOption] = useState<"1300" | "1600" | null>(null);

  const paymentAmount = paymentOption === "1300" ? 980 : paymentOption === "1600" ? 1800 : 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleRegisterAndPay = async () => {
    if (!paymentOption) return;
    setLoading(true);
    
    // 1. Register lead in CRM
    const res = await registerCampLead(formData);
    
    if (res.success && res.contactId) {
      setContactId(res.contactId);
      setStep(4); // Move to Payment frame
    } else {
      alert("אירעה שגיאה בשמירת הפרטים. אנא נסה שנית.");
    }
    setLoading(false);
  };

  const handlePaymentSuccess = async () => {
    if (contactId) {
      await markCampPaymentSuccess(contactId, paymentAmount);
    }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-lg mx-auto border-t-4 border-green-500">
        <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
          ✓
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">הרשמה הושלמה בהצלחה!</h3>
        <p className="text-slate-600">תודה רבה, נתוני ההרשמה והתשלום התקבלו בהצלחה במערכת. נתראה בקייטנה!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 max-w-2xl mx-auto border border-slate-100">
      
      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 right-0 top-1/2 h-1 bg-slate-100 -z-10 -translate-y-1/2 rounded-full"></div>
        <div className="absolute right-0 top-1/2 h-1 bg-orange-400 -z-10 -translate-y-1/2 rounded-full transition-all duration-300" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
        
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s ? "bg-orange-400 text-white shadow-md" : "bg-white border-2 border-slate-200 text-slate-400"}`}>
            {s}
          </div>
        ))}
      </div>

      {/* Step 1: Child Details */}
      {step === 1 && (
        <form onSubmit={handleNextStep1} className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <h3 className="text-xl font-bold text-slate-800 mb-4">פרטי הילד/ה</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">שם פרטי</label>
              <input required type="text" name="child_first_name" value={formData.child_first_name} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">שם משפחה</label>
              <input required type="text" name="child_last_name" value={formData.child_last_name} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">ת.ז</label>
              <input required type="text" name="child_id_number" value={formData.child_id_number} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">לאיזו כיתה עולה?</label>
              <select required name="child_grade" value={formData.child_grade} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all bg-white">
                <option value="">בחר/י...</option>
                <option value="א">כיתה א'</option>
                <option value="ב">כיתה ב'</option>
                <option value="ג">כיתה ג'</option>
                <option value="ד">כיתה ד'</option>
                <option value="ה">כיתה ה'</option>
                <option value="ו">כיתה ו'</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">מגדר</label>
              <select required name="gender" value={formData.gender} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all bg-white">
                <option value="">בחר/י...</option>
                <option value="בן">בן</option>
                <option value="בת">בת</option>
              </select>
            </div>
          </div>
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <label className="block text-sm font-semibold text-slate-700 mb-2">האם קיימת רגישות כלשהי?</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="allergies_has" value="לא" checked={formData.allergies_has === "לא"} onChange={handleChange} className="w-4 h-4 text-orange-500" />
                <span>לא</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="allergies_has" value="כן" checked={formData.allergies_has === "כן"} onChange={handleChange} className="w-4 h-4 text-orange-500" />
                <span>כן</span>
              </label>
            </div>
            {formData.allergies_has === "כן" && (
              <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">פרט/י את הרגישות:</label>
                <textarea required name="allergies_details" value={formData.allergies_details} onChange={handleChange} rows={2} className="w-full p-3 rounded-xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"></textarea>
              </div>
            )}
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full md:w-auto px-8 h-12 text-lg rounded-xl bg-orange-400 hover:bg-orange-500 text-white shadow-lg hover:shadow-xl transition-all mr-auto block">המשך לפרטי הורים ←</Button>
          </div>
        </form>
      )}

      {/* Step 2: Parent Details */}
      {step === 2 && (
        <form onSubmit={handleNextStep2} className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <h3 className="text-xl font-bold text-slate-800 mb-4">פרטי ההורים</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">שם האם</label>
              <input required type="text" name="mother_name" value={formData.mother_name} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">טלפון האם</label>
              <input required type="tel" name="mother_phone" value={formData.mother_phone} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-left" dir="ltr" placeholder="05X-XXXXXXX" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">שם האב</label>
              <input required type="text" name="father_name" value={formData.father_name} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">טלפון האב</label>
              <input required type="tel" name="father_phone" value={formData.father_phone} onChange={handleChange} className="w-full p-3 rounded-xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-left" dir="ltr" placeholder="05X-XXXXXXX" />
            </div>
          </div>
          <div className="pt-4 flex justify-between gap-4">
            <Button type="button" variant="ghost" onClick={() => setStep(1)} className="px-6 h-12 text-slate-500 rounded-xl">→ חזור</Button>
            <Button type="submit" className="px-8 h-12 text-lg rounded-xl bg-orange-400 hover:bg-orange-500 text-white shadow-lg hover:shadow-xl transition-all">המשך לבחירת מסלול ←</Button>
          </div>
        </form>
      )}

      {/* Step 3: Payment Option */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <h3 className="text-xl font-bold text-slate-800 mb-4">בחירת מסלול</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Option 13:00 */}
            <label className={`relative flex flex-col p-6 rounded-2xl border-2 cursor-pointer transition-all ${paymentOption === "1300" ? "border-orange-400 bg-orange-50" : "border-slate-200 bg-white hover:border-orange-200"}`}>
              <input type="radio" name="paymentOption" className="sr-only" checked={paymentOption === "1300"} onChange={() => setPaymentOption("1300")} />
              <div className="flex justify-between items-start mb-4">
                <span className="text-lg font-bold text-slate-800">מסלול בוקר</span>
                <span className="text-2xl font-black text-orange-500">980 ₪</span>
              </div>
              <p className="text-slate-600 text-sm">קייטנה איכותית משעה 07:45 ועד השעה 13:00. כולל ארוחות בוקר, 3 טיולים ואת ימי שישי.</p>
              {paymentOption === "1300" && <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-orange-400 shadow-[0_0_0_4px_rgba(251,146,60,0.2)]"></div>}
            </label>

            {/* Option 16:00 */}
            <label className={`relative flex flex-col p-6 rounded-2xl border-2 cursor-pointer transition-all ${paymentOption === "1600" ? "border-orange-400 bg-orange-50" : "border-slate-200 bg-white hover:border-orange-200"}`}>
              <div className="absolute -top-3 left-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm">מומלץ!</div>
              <input type="radio" name="paymentOption" className="sr-only" checked={paymentOption === "1600"} onChange={() => setPaymentOption("1600")} />
              <div className="flex justify-between items-start mb-4">
                <span className="text-lg font-bold text-slate-800">מסלול צהרון</span>
                <span className="text-2xl font-black text-orange-500">1,800 ₪</span>
              </div>
              <p className="text-slate-600 text-sm">הקייטנה המלאה (עד 13:00) + שדרוג לצהרון עד השעה 16:00. כולל ארוחת צהריים חמה ומזינה.</p>
              {paymentOption === "1600" && <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-orange-400 shadow-[0_0_0_4px_rgba(251,146,60,0.2)]"></div>}
            </label>

          </div>
          <div className="pt-4 flex justify-between gap-4">
            <Button type="button" variant="ghost" onClick={() => setStep(2)} className="px-6 h-12 text-slate-500 rounded-xl">→ חזור</Button>
            <Button 
              type="button" 
              onClick={handleRegisterAndPay} 
              disabled={!paymentOption || loading}
              className="px-8 h-12 text-lg rounded-xl bg-orange-400 hover:bg-orange-500 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {loading ? "מייצר בקשת תשלום..." : "מעבר לתשלום המאובטח ←"}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Payment */}
      {step === 4 && (
        <div className="animate-in fade-in slide-in-from-right-4">
          <div className="mb-6 pb-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-slate-800">תשלום עבור הקייטנה</h3>
              <p className="text-slate-500 text-sm">{formData.child_first_name} {formData.child_last_name} | עולה לכיתה {formData.child_grade}</p>
            </div>
            <div className="text-2xl font-black text-orange-500">{paymentAmount} ₪</div>
          </div>
          
          <NedarimCheckout 
            amount={paymentAmount}
            clientName={`${formData.father_name || formData.mother_name} (${formData.child_first_name} קייטנה)`}
            phone={formData.mother_phone || formData.father_phone}
            mail=""
            receiptType="קייטנה תשסו"
            onSuccess={handlePaymentSuccess}
            onCancel={() => setStep(3)}
          />
        </div>
      )}

    </div>
  );
}
