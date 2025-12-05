/**
 * Komprimiert ein Bild, bevor es hochgeladen wird
 * @param file - Das Original-Bildfile
 * @param maxWidth - Maximale Breite (Standard: 800px)
 * @param maxHeight - Maximale Höhe (Standard: 800px)
 * @param quality - Qualität für JPEG (0-1, Standard: 0.85)
 * @returns Komprimiertes File als Promise
 */
export const compressImage = async (
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.85
): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Nur JPEG und PNG komprimieren
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/i)) {
      resolve(file); // Andere Formate unverändert zurückgeben
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Berechne neue Dimensionen
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        // Erstelle Canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context nicht verfügbar'));
          return;
        }

        // Zeichne Bild auf Canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Konvertiere zu Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Blob-Konvertierung fehlgeschlagen'));
              return;
            }

            // Erstelle neues File mit Original-Namen
            const compressedFile = new File(
              [blob],
              file.name,
              {
                type: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
                lastModified: Date.now(),
              }
            );

            console.log(`Bild komprimiert: ${file.size} bytes → ${compressedFile.size} bytes (${Math.round((1 - compressedFile.size / file.size) * 100)}% reduziert)`);
            resolve(compressedFile);
          },
          file.type === 'image/png' ? 'image/png' : 'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Bild konnte nicht geladen werden'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Datei konnte nicht gelesen werden'));
    };

    reader.readAsDataURL(file);
  });
};

