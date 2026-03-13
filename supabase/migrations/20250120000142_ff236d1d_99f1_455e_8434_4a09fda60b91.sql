-- Make the cvs bucket public to fix CV download 404 errors
UPDATE storage.buckets 
SET public = true 
WHERE id = 'cvs';