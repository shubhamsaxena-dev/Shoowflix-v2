@@ .. @@
   const handleViewAll = () => {
-    window.location.href = `/genre/${genre.toLowerCase().replace(/\s+/g, '-')}`;
+    if (typeof window !== 'undefined') {
+      window.location.href = `/genre/${genre.toLowerCase().replace(/\s+/g, '-')}`;
+    }
   };