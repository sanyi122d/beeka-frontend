import { useState } from 'react';

export const usePdfText = () => {
  const [pdfText, setPdfText] = useState<string>("");

    const uploadPdf = async (file: File, folderId: string) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch(`http://localhost:8000/upload/${folderId}`, {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      if (data.text) setPdfText(data.text);
      return data;
    }};