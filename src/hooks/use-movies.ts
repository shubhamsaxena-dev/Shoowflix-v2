@@ .. @@
 export async function generateMagnetLink(hash: string, title: string): Promise<string> {
-  const response = await fetch('/api/magnet', {
+  const response = await fetch('/api/magnet', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
@@ .. @@
   
   if (!response.ok) {
     throw new Error('Failed to generate magnet link');
   }
   
   const data = await response.json();
   return data.magnetLink;
 }