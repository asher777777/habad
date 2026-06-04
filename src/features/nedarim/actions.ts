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
    body.append("Tashlumim", "0");
    // Some Nedarim terminals use Tashlumim=0 for Keva, or require Keva=1
    // We send both to be safe depending on terminal configuration
    body.append("Keva", "1");
  } else {
    body.append("Tashlumim", "1");
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
    body.append("PaymentType", "Ragil");
    body.append("CallBack", data.redirectUrl); // Using redirect for callback in iframe
  } else {
    body.append("ClientName", data.clientName);
    body.append("CallBack", data.redirectUrl);
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
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
        "Content-Type": "application/x-www-form-urlencoded",
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
  paymentType: "Cash" | "Check" | "BankTransfer";
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
}) {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const settings = await getNedarimSettings();
    if (!settings?.mosadid || !settings?.apipassword) {
      return { success: false, error: "לא הוגדרה סיסמת API לדוחות בהגדרות נדרים פלוס." };
    }

    const body = new URLSearchParams();
    body.append("Action", "CreateInvoice");
    body.append("MosadNumber", settings.mosadid);
    body.append("ApiPassword", settings.apipassword);
    body.append("Type", "Achnasot"); // External income
    body.append("TamalType", data.receiptType);
    body.append("Amount", data.amount.toString());
    body.append("ClientName", data.clientName);
    
    // PaymentMethod: Nedarim usually accepts these string values for Achnasot
    const methodMap = {
      "Cash": "מזומן",
      "Check": "שיק",
      "BankTransfer": "העברה בנקאית"
    };
    body.append("PaymentType", methodMap[data.paymentType]);

    if (data.zeout) body.append("Zeout", data.zeout);
    if (data.phone) body.append("Phone", data.phone);
    if (data.details) body.append("Details", data.details); // Check number / bank ref
    if (data.date) body.append("Date", data.date);

    if (data.paymentType === "Check") {
      if (data.checkNumber) body.append("Asmahta", data.checkNumber);
      if (data.bankName && data.branchNumber && data.accountNumber) {
        body.append("Asmahta2", `${data.bankName}-${data.branchNumber}-${data.accountNumber}`);
      }
    } else if (data.paymentType === "BankTransfer") {
      if (data.transferRef) body.append("Asmahta", data.transferRef);
      if (data.bankName && data.branchNumber && data.accountNumber) {
        body.append("Asmahta2", `${data.bankName}-${data.branchNumber}-${data.accountNumber}`);
      }
    }

    const res = await fetch("https://www.matara.pro/nedarimplus/Mechubad/Reports/ManageReports.aspx", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const text = await res.text();
    let responseData;
    try {
      responseData = JSON.parse(text);
    } catch {
      return { success: false, error: "שגיאה בתשובת השרת מנדרים פלוס." };
    }

    if (responseData.Result === "Error" || responseData.Status === "Error") {
      return { success: false, error: responseData.Message || "שגיאה בהפקת הקבלה." };
    }

    return { success: true, message: responseData.Message || "הקבלה הופקה בהצלחה." };
  } catch (error: any) {
    console.error("Error creating manual invoice:", error);
    return { success: false, error: error.message };
  }
}


