from PyPDF2 import PdfReader
import os

def extract_text_from_pdf(file_path: str) -> str:
    with open(file_path, "rb") as f:
        reader = PdfReader(f)
        return " ".join([page.extract_text() for page in reader.pages])