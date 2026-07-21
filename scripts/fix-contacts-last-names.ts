import { adminDb } from "../src/lib/firebase-admin";

async function fixContactChildrenLastNames() {
  const contactsRef = adminDb.collection("contacts");
  
  // We fetch all contacts that have children
  const snap = await contactsRef.get();
  
  let fixedCount = 0;
  for (const doc of snap.docs) {
    const data = doc.data() as any;
    
    if (data.children && Array.isArray(data.children) && data.children.length > 0) {
      let changed = false;
      const updatedChildren = data.children.map((child: any) => {
        if (!child.last_name || child.last_name.trim() === "") {
            
          let lastName = data.child_last_name || data.last_name || "";
          
          if (!lastName) {
              const nameToSplit = data.mother_name || data.father_name || data.conta_name || "";
              const parts = nameToSplit.split(" ");
              if (parts.length > 1) {
                  lastName = parts.slice(1).join(" ");
              }
          }
          
          if (lastName) {
              changed = true;
              return { ...child, last_name: lastName };
          }
        }
        return child;
      });

      if (changed) {
        await doc.ref.update({ children: updatedChildren });
        fixedCount++;
        console.log(`Fixed children last names for contact: ${data.conta_name}`);
      }
    }
  }
  
  console.log(`Fixed ${fixedCount} contacts missing last names in children array.`);
}

fixContactChildrenLastNames().catch(console.error);
