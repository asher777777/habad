const fs = require('fs');
const content = fs.readFileSync('C:\\\\Users\\\\ovt57\\\\.gemini\\\\antigravity\\\\brain\\\\218c0962-5339-412f-bb1b-5d412044b9d4\\\\.system_generated\\\\steps\\\\345\\\\content.md', 'utf8');

const match = content.match(/var Json = (\[[\s\S]*?\]);/);
if (match) {
  let arrStr = match[1];
  // Replace HTML template literals with stripped JSON strings
  arrStr = arrStr.replace(/Html:\s*`([\s\S]*?)`/g, (m, p1) => {
    return 'Html: ' + JSON.stringify(p1.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  });
  
  try {
    const arr = eval(arrStr);
    for (const item of arr) {
      if (item.Name) {
        if (item.Name.includes('הכנסה') || item.Name.includes('קבלה') || item.Name.includes('קבלות')) {
           console.log("=== " + item.Name + " ===");
           console.log(item.Html.substring(0, 500));
        }
      }
    }
  } catch(e) {
    console.error(e);
  }
}
