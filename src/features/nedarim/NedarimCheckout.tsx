"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { createNedarimTransaction, checkBitTransaction } from "./actions";

interface NedarimCheckoutProps {
  amount: number;
  clientName: string;
  phone: string;
  mail: string;
  receiptType?: string;
  requireZehut?: boolean;
  isRecurring?: boolean;
  installments?: number;
  onMethodSelected?: (method: "credit" | "bit" | null) => void;
  onSuccess: () => void;
  onCancel: () => void;
}

export function NedarimCheckout({ amount, clientName, phone, mail, receiptType, requireZehut, isRecurring, installments, onMethodSelected, onSuccess, onCancel }: NedarimCheckoutProps) {
  const [paymentMethod, setPaymentMethod] = useState<"credit" | "bit" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactionData, setTransactionData] = useState<any>(null);
  
  // For Bit
  const [bitCheckCount, setBitCheckCount] = useState(0);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.Name === "Height") {
        const frame = document.getElementById("NedarimFrame") as HTMLIFrameElement;
        if (frame) frame.style.height = (parseInt(event.data.Value) + 80) + "px";
      } else if (event.data?.Name === "TransactionResponse") {
        if (event.data.Value?.Status === "Error") {
          setError(event.data.Value.Message || "שגיאה בתשלום");
          setLoading(false);
        } else {
          onSuccess();
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSuccess]);

  // Bit Polling
  useEffect(() => {
    if (paymentMethod === "bit" && transactionData?.PreTransactionId) {
      const interval = setInterval(async () => {
        try {
          const res = await checkBitTransaction(transactionData.PreTransactionId);
          setBitCheckCount((c) => c + 1);
          if (res.Status === "OK") {
            clearInterval(interval);
            onSuccess();
          } else if (res.Status === "Error" && res.Message === "העסקה לא אושרה") {
            clearInterval(interval);
            setError("פג תוקף העסקה");
          }
        } catch (e) {
          // ignore error while polling
        }
      }, 6000);

      if (bitCheckCount >= 20) {
        clearInterval(interval);
      }

      return () => clearInterval(interval);
    }
    return undefined;
  }, [paymentMethod, transactionData, bitCheckCount, onSuccess]);

  const initTransaction = async (type: "credit" | "bit") => {
    setLoading(true);
    setError("");
    setPaymentMethod(type);
    
    try {
      const data = await createNedarimTransaction({
        amount,
        paymentType: type,
        clientName,
        phone,
        mail,
        receiptType,
        isRecurring,
        installments,
        redirectUrl: window.location.origin + "/donate?success=true",
      });

      if (data.Status === "Error") {
        setError(data.Message);
        setPaymentMethod(null);
        if (onMethodSelected) onMethodSelected(null);
      } else {
        setTransactionData(data);
        if (onMethodSelected) onMethodSelected(type);
      }
    } catch (e: any) {
      setError(e.message || "שגיאה ביצירת העסקה");
      setPaymentMethod(null);
      if (onMethodSelected) onMethodSelected(null);
    }
    setLoading(false);
  };

  const handlePayClick = () => {
    if (!transactionData) return;
    setLoading(true);
    setError("");
    const iframeWin = (document.getElementById("NedarimFrame") as HTMLIFrameElement)?.contentWindow;
    if (iframeWin) {
      iframeWin.postMessage({ Name: "FinishTransaction", Value: transactionData.ID }, "*");
    }
  };

  if (!paymentMethod) {
    const showBit = !isRecurring && (!installments || installments <= 1);
    
    return (
      <div className="space-y-4">
        {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg font-bold animate-in fade-in">{error}</div>}
        <h3 className="text-xl font-bold text-center mb-6 text-slate-800">בחר שיטת תשלום</h3>
        <div className={`grid gap-4 ${showBit ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <button 
            onClick={() => initTransaction("credit")}
            className="flex flex-col items-center justify-center p-6 border-2 rounded-2xl hover:border-primary/50 transition-colors bg-white hover:bg-muted/10 text-slate-800"
          >
            <span className="text-3xl mb-2">💳</span>
            <span className="font-semibold">כרטיס אשראי</span>
          </button>
          {showBit && (
            <button 
              onClick={() => initTransaction("bit")}
              className="flex flex-col items-center justify-center p-6 border-2 rounded-2xl hover:border-primary/50 transition-colors bg-white hover:bg-muted/10 text-slate-800"
            >
              <span className="text-3xl mb-2">📱</span>
              <span className="font-semibold">Bit</span>
            </button>
          )}
        </div>
        <Button variant="ghost" className="w-full mt-4 text-slate-600 hover:text-slate-800" onClick={onCancel}>חזור</Button>
      </div>
    );
  }

  if (loading && !transactionData) {
    return <div className="text-center py-12 font-bold text-primary animate-pulse">מייצר עסקה, נא להמתין...</div>;
  }

  return (
    <div className="space-y-6 text-center">
      {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg font-bold">{error}</div>}
      
      {paymentMethod === "credit" && transactionData && (
        <div className="max-w-[380px] mx-auto bg-muted/20 p-4 rounded-xl">
          <iframe 
            id="NedarimFrame" 
            src={`https://matara.pro/nedarimplus/iframe?language=he${(isRecurring || (installments !== undefined && installments > 1)) ? "" : "&MaxPayments=1"}&NeedZeout=${(requireZehut || receiptType === "405") ? 1 : (transactionData.NeedZeout || 0)}`}
            className="w-full border-0 transition-all duration-300 min-h-[350px]"
            scrolling="no"
          />
          <Button 
            className="w-full mt-4 h-14 text-lg font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg"
            onClick={handlePayClick}
            disabled={loading}
          >
            {loading ? "מבצע תשלום..." : "שלם עכשיו"}
          </Button>
        </div>
      )}

      {paymentMethod === "bit" && transactionData && (
        <div className="max-w-[300px] mx-auto bg-muted/20 p-6 rounded-xl flex flex-col items-center gap-4">
          <span className="text-4xl">📱</span>
          <p className="font-semibold text-lg">מעבר לאפליקציית ביט</p>
          <a 
            href={transactionData.Message} 
            target="_blank" 
            rel="noreferrer"
            className="w-full p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-center block"
          >
            פתח אפליקציית ביט
          </a>
          <p className="text-sm text-muted-foreground mt-4">ממתין לאישור התשלום מאפליקציית ביט...</p>
        </div>
      )}

      {!loading && paymentMethod === "credit" && (
        <Button variant="ghost" className="w-full" onClick={() => { setPaymentMethod(null); if (onMethodSelected) onMethodSelected(null); }}>החלף שיטת תשלום</Button>
      )}
      {paymentMethod === "bit" && (
        <Button variant="ghost" className="w-full mt-2" onClick={() => { setPaymentMethod(null); if (onMethodSelected) onMethodSelected(null); }}>חזור</Button>
      )}
    </div>
  );
}
