const fs = require('fs');
const text = fs.readFileSync('C:\\\\Users\\\\ovt57\\\\.gemini\\\\antigravity\\\\brain\\\\218c0962-5339-412f-bb1b-5d412044b9d4\\\\.system_generated\\\\steps\\\\345\\\\content.md', 'utf8');

const regex = /Name:\s*"([^"]+)"[\s\S]*?Html:\s*`([\s\S]*?)`/g;
let match;
while ((match = regex.exec(text)) !== null) {
  const name = match[1];
  const html = match[2];
  if (name.includes('הכנסה') || name.includes('Save') || html.includes('SaveAchnasot')) {
    console.log('=== ' + name + ' ===\n' + html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() + '\n');
  }
}
