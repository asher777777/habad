"use server";

import { adminDb } from "@/lib/firebase-admin";

export async function getNedarimSettings() {
  try {
    const docRef = adminDb.collection("configs").doc("nedarim_settings");
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      const data = docSnap.data();
      return {
        mosadid: data?.mosadid || "",
        apivalid: data?.apivalid || "",
        group: data?.group || "",
        apipassword: data?.apipassword || "",
      };
    }
    return { mosadid: "", apivalid: "", group: "", apipassword: "" };
  } catch (error) {
    console.warn("Error fetching Nedarim settings:", (error as Error).message);
    return { mosadid: "", apivalid: "", group: "", apipassword: "" };
  }
}

export async function saveNedarimSettings(settings: { mosadid: string; apivalid: string; group: string; apipassword?: string }) {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const docRef = adminDb.collection("configs").doc("nedarim_settings");
    await docRef.set(settings, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error saving Nedarim settings:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function createNedarimTransaction(data: {
  amount: number;
  paymentType: "credit" | "bit";
  clientName: string;
  phone: string;
  mail: string;
  redirectUrl: string;
  receiptType?: string;
  isRecurring?: boolean;
  installments?: number;
}) {
  const settings = await getNedarimSettings();
  if (!settings?.mosadid || !settings?.apivalid) {
    throw new Error("לא הוגדרו פרטי חיבור לנדרים פלוס. נא להגדיר דרך לוח הבקרה.");
  }

  const endpoint = data.paymentType === "credit" ? "DebitIframe.aspx" : "DebitBit.aspx";
  const url = `https://www.matara.pro/nedarimplus/v6/Files/WebServices/${endpoint}?Action=CreateTransaction`;

  const body = new URLSearchParams();
  body.append("Mosad", settings.mosadid);
  body.append("ApiValid", settings.apivalid);
  body.append("Amount", data.amount.toString());
  
  if (data.isRecurring) {
    body.append("Tashlumim", (data.installments !== undefined && data.installments > 0) ? data.installments.toString() : "0");
    // Some Nedarim terminals use Tashlumim=0 for Keva, or require Keva=1
    // We send both to be safe depending on terminal configuration
    body.append("Keva", "1");
  } else {
    body.append("Tashlumim", (data.installments !== undefined && data.installments > 0) ? data.installments.toString() : "1");
  }

  body.append("Currency", "1"); // 1 is usually ILS
  body.append("Phone", data.phone);
  body.append("Mail", data.mail);
  
  if (data.receiptType) {
    body.append("TamalType", data.receiptType);
  } else if (settings.group) {
    body.append("Groupe", settings.group); // Fallback to global group if any
  }

  if (data.paymentType === "credit") {
    const [firstName = "", ...lastNameParts] = data.clientName.split(" ");
    body.append("FirstName", firstName);
    body.append("LastName", lastNameParts.join(" "));
    body.append("PaymentType", data.isRecurring ? "HK" : "Ragil");
    body.append("CallBack", data.redirectUrl); // Using redirect for callback in iframe
  } else {
    body.append("ClientName", data.clientName);
    body.append("CallBack", data.redirectUrl);
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
    },
    body: body.toString(),
  });

  const responseText = await response.text();
  try {
    const json = JSON.parse(responseText);
    return json;
  } catch (e) {
    console.error("Failed to parse Nedarim response", responseText);
    throw new Error("Invalid response from Nedarim");
  }
}

export async function checkBitTransaction(transactionId: string) {
  const settings = await getNedarimSettings();
  const url = `https://www.matara.pro/nedarimplus/v6/Files/WebServices/DebitBit.aspx?Action=CheckTransaction&MosadId=${settings?.mosadid}&TransactionId=${transactionId}`;
  const res = await fetch(url);
  const json = await res.json();
  return json;
}

export async function getNedarimKupot() {
  try {
    const settings = await getNedarimSettings();
    if (!settings?.mosadid || !settings?.apivalid) {
      return { success: false, error: "Nedarim connection not configured" };
    }

    const body = new URLSearchParams();
    body.append("Action", "GetStoresList");
    body.append("MosadId", settings.mosadid);
    body.append("ApiPassword", settings.apivalid);

    const res = await fetch("https://www.matara.pro/nedarimplus/Mechubad/Reports/ManageReports.aspx", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
      },
      body: body.toString(),
    });

    const text = await res.text();
    console.log("Nedarim GetStoresList Raw Response:", text);
    const data = JSON.parse(text);

    if (data.Result === "Error") {
      return { success: false, error: data.Message || "Error fetching Kupot" };
    }

    // Usually Nedarim returns an array directly if it's a list, or it's wrapped
    // The doc says it returns an array of objects with { StoreId, StoreName, Enabled }
    if (Array.isArray(data)) {
      return { success: true, data: data.filter(s => s.Enabled === "True" || s.Enabled === true) };
    } else if (data.Stores && Array.isArray(data.Stores)) {
      return { success: true, data: data.Stores };
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error("Error fetching Nedarim Kupot:", error);
    return { success: false, error: error.message };
  }
}

export async function createManualInvoice(data: {
  clientName: string;
  amount: number;
  paymentType: "Cash" | "Check" | "BankTransfer" | "Credit";
  receiptType: string;
  zeout?: string;
  phone?: string;
  details?: string;
  date?: string;
  checkNumber?: string;
  bankName?: string;
  branchNumber?: string;
  accountNumber?: string;
  transferRef?: string;
  cardType?: string;
  last4Digits?: string;
}) {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const settings = await getNedarimSettings();
    if (!settings?.mosadid || !settings?.apipassword) {
      return { success: false, error: "לא הוגדרה סיסמת API לדוחות בהגדרות נדרים פלוס." };
    }

    // --- STEP 1: Save External Income (SaveAchnasot) ---
    const saveBody = new URLSearchParams();
    saveBody.append("Action", "SaveAchnasot");
    saveBody.append("MosadNumber", settings.mosadid);
    saveBody.append("ApiPassword", settings.apipassword);

    const methodTypeMap: Record<string, string> = {
      "Cash": "1",
      "Check": "2",
      "BankTransfer": "3",
      "Credit": "4"
    };
    saveBody.append("Type", methodTypeMap[data.paymentType] || "1");
    saveBody.append("TypeName", methodTypeMap[data.paymentType] || "1"); // User requested TypeName instead of/in addition to Type
    saveBody.append("Zeout", data.zeout || "000000000"); // Zeout is mandatory for SaveAchnasot
    saveBody.append("Amount", data.amount.toString());

    // Format date as dd/mm/yyyy
    let dateStr = data.date || "01/01/2023"; // Fallback just in case
    if (dateStr.includes("-")) {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        dateStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    saveBody.append("Date", dateStr);

    saveBody.append("Currency", "1"); // Shekel
    
    // Set default empty Asmahta parameters as the API might expect the keys to exist
    let asmahta = "";
    let asmahta2 = "";

    if (data.paymentType === "Cash") {
      asmahta = "6"; // As requested by user
    } else if (data.paymentType === "Check") {
      if (data.checkNumber) asmahta = data.checkNumber;
      if (data.bankName && data.branchNumber && data.accountNumber) {
        asmahta2 = `${data.bankName}-${data.branchNumber}-${data.accountNumber}`;
      }
    } else if (data.paymentType === "BankTransfer") {
      if (data.transferRef) asmahta = data.transferRef;
      if (data.bankName && data.branchNumber && data.accountNumber) {
        asmahta2 = `${data.bankName}-${data.branchNumber}-${data.accountNumber}`;
      }
    } else if (data.paymentType === "Credit") {
      if (data.cardType) asmahta = data.cardType;
      if (data.last4Digits) asmahta2 = data.last4Digits;
    }

    saveBody.append("Asmahta", asmahta);
    saveBody.append("Asmahta2", asmahta2);

    function encodeToWindows1255Url(str: string): string {
      if (!str) return "";
      let result = "";
      for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        if (charCode >= 0x05D0 && charCode <= 0x05EA) {
          const win1255Code = charCode - 0x05D0 + 0xE0;
          result += "%" + win1255Code.toString(16).toUpperCase();
        } else if (charCode === 0x20) {
          result += "+";
        } else if (charCode < 128) {
          result += encodeURIComponent(str.charAt(i));
        } else {
          result += encodeURIComponent(str.charAt(i));
        }
      }
      return result;
    }

    let saveBodyString = saveBody.toString();
    saveBodyString += "&SpecialName=" + encodeToWindows1255Url(data.clientName);
    if (data.details) saveBodyString += "&Avour=" + encodeToWindows1255Url(data.details);

    const saveRes = await fetch("https://matara.pro/nedarimplus/Reports/Manage3.aspx", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: saveBodyString,
    });

    const saveText = await saveRes.text();
    const fs = require('fs');
    
    console.log("--- SAVE ACHNASOT REQUEST ---");
    console.log(saveBodyString);
    console.log("--- SAVE ACHNASOT RESPONSE ---");
    console.log(saveText);

    fs.appendFileSync('nedarim-log.txt', `\n--- SAVE ACHNASOT REQUEST ---\n${saveBodyString}\n--- SAVE ACHNASOT RESPONSE ---\n${saveText}\n`);

    let saveResponseData;
    try {
      saveResponseData = JSON.parse(saveText);
    } catch {
      return { success: false, error: "שגיאה בשמירת התנועה בנדרים פלוס (תשובה לא תקינה)." };
    }

    if (saveResponseData.Result === "Error" || saveResponseData.Status === "Error") {
      return { success: false, error: saveResponseData.Message || "שגיאה בשמירת התנועה." };
    }

    const achnasotId = saveResponseData.ID;
    if (!achnasotId) {
      return { success: false, error: "לא התקבל מזהה תנועה מנדרים פלוס." };
    }

    // --- STEP 2: Generate Invoice for the new Income ---
    const invoiceBody = new URLSearchParams();
    invoiceBody.append("Action", "CreateInvoice");
    invoiceBody.append("MosadNumber", settings.mosadid);
    invoiceBody.append("ApiPassword", settings.apipassword);
    invoiceBody.append("ID", achnasotId.toString());
    invoiceBody.append("Type", "Achnasot");
    invoiceBody.append("TamalType", data.receiptType); // 400 or 405

    // Initial delay to prevent replica lag
    await new Promise(resolve => setTimeout(resolve, 1500));

    let invResponseData;
    let invUrl = "";
    let invText = "";
    let retries = 3;
    while (retries > 0) {
      invUrl = "https://matara.pro/nedarimplus/Reports/Tamal3.aspx";
      const invRes = await fetch(invUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: invoiceBody.toString(),
      });

      invText = await invRes.text();
      
      console.log(`--- CREATE INVOICE REQUEST (Retry ${4 - retries}) ---`);
      console.log(invUrl);
      console.log("--- CREATE INVOICE RESPONSE ---");
      console.log(invText);

      fs.appendFileSync('nedarim-log.txt', `\n--- CREATE INVOICE REQUEST (Retry ${4 - retries}) ---\n${invUrl}\n--- CREATE INVOICE RESPONSE ---\n${invText}\n`);

      try {
        invResponseData = JSON.parse(invText);
      } catch {
        return { success: false, error: "שגיאה בהפקת הקבלה (תשובה לא תקינה)." };
      }

      if (invResponseData.Result === "Error" || invResponseData.Status === "Error") {
        if (invResponseData.Message === "שגיאה באיתור הכנסה. פנה לתמיכה." && retries > 1) {
          retries--;
          await new Promise(resolve => setTimeout(resolve, 1500));
          continue;
        }
        return { success: false, error: invResponseData.Message || "שגיאה בהפקת הקבלה.", debug: { saveRequest: saveBodyString, saveResponse: saveText, invoiceRequest: invUrl, invoiceResponse: invText } };
      }
      break;
    }

    return { success: true, message: invResponseData.Message || "הקבלה הופקה בהצלחה.", debug: { saveRequest: saveBodyString, saveResponse: saveText, invoiceRequest: invUrl, invoiceResponse: invText } };
  } catch (error: any) {
    console.error("Error creating manual invoice:", error);
    return { success: false, error: error.message };
  }
}


