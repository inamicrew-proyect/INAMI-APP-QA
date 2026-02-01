import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'public/inami.png');
const imageBase64 = fs.readFileSync(filePath, { encoding: 'base64' });

console.log(`data:image/png;base64,${imageBase64}`);
