// utils/resizeImage.ts
export const resizeImage = (file: File, maxWidth = 1200): Promise<Blob | File> => {
  return new Promise((resolve) => {
    // ถ้าไม่ใช่รูปภาพ (เช่น PDF) ให้ข้ามเลย ส่งไฟล์เดิมกลับไป
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const currentWidth = img.width;
        const currentHeight = img.height;

        // ✅ เช็คตรงนี้: ถ้ารูปเล็กกว่า 1024px อยู่แล้ว ไม่ต้องทำอะไร ส่งไฟล์เดิมกลับเลย (เร็วสุด)
        if (currentWidth <= maxWidth) {
          resolve(file);
          return;
        }

        // คำนวณขนาดใหม่ (รักษา Aspect Ratio)
        const ratio = maxWidth / currentWidth;
        const newWidth = maxWidth;
        const newHeight = Math.round(currentHeight * ratio);

        // วาดลง Canvas
        const canvas = document.createElement("canvas");
        canvas.width = newWidth;
        canvas.height = newHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file); // ถ้า error ให้ส่งไฟล์เดิม
          return;
        }

        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // แปลงเป็น JPEG (ลดขนาดไฟล์ได้เยอะมาก)
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else resolve(file);
          },
          "image/jpeg",
          0.8 // คุณภาพ 85% (ชัดพอสำหรับ AI อ่าน)
        );
      };

      img.onerror = () => resolve(file); // ถ้าโหลดรูปไม่ขึ้น ส่งไฟล์เดิม
    };

    reader.onerror = () => resolve(file); // ถ้าอ่านไฟล์ไม่ได้ ส่งไฟล์เดิม
  });
};