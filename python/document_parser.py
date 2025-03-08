import sys
import json
import os
import base64
import tempfile
from PIL import Image
import pytesseract
import fitz  # PyMuPDF for PDFs
import docx  # python-docx for DOCX
import csv
import io

def detect_file_type(file_path):
    """Detect file type based on extension"""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.pdf':
        return 'pdf'
    elif ext == '.docx':
        return 'docx'
    elif ext == '.txt':
        return 'txt'
    elif ext in ['.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.gif']:
        return 'image'
    elif ext == '.csv':
        return 'csv'
    else:
        return 'unknown'

def extract_text_from_pdf(file_path):
    """Extract text from PDF file"""
    try:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        print(f"Error extracting text from PDF: {e}", file=sys.stderr)
        return ""

def extract_text_from_docx(file_path):
    """Extract text from DOCX file"""
    try:
        doc = docx.Document(file_path)
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text
    except Exception as e:
        print(f"Error extracting text from DOCX: {e}", file=sys.stderr)
        return ""

def extract_text_from_image(file_path):
    """Extract text from image using OCR"""
    try:
        image = Image.open(file_path)
        text = pytesseract.image_to_string(image)
        return text
    except Exception as e:
        print(f"Error extracting text from image: {e}", file=sys.stderr)
        return ""

def extract_text_from_csv(file_path):
    """Extract text from CSV file"""
    try:
        text = ""
        with open(file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            for row in reader:
                text += " ".join(row) + "\n"
        return text
    except Exception as e:
        print(f"Error extracting text from CSV: {e}", file=sys.stderr)
        return ""

def extract_text_from_file(file_path):
    """Extract text from a file based on its type"""
    file_type = detect_file_type(file_path)
    
    if file_type == 'pdf':
        return extract_text_from_pdf(file_path)
    elif file_type == 'docx':
        return extract_text_from_docx(file_path)
    elif file_type == 'txt':
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    elif file_type == 'image':
        return extract_text_from_image(file_path)
    elif file_type == 'csv':
        return extract_text_from_csv(file_path)
    else:
        print(f"Unsupported file type: {file_type}", file=sys.stderr)
        return ""

def parse_document(input_file):
    """
    Parse a document file and extract its text content
    
    Args:
        input_file: Path to the file to parse
        
    Returns:
        The extracted text content
    """
    text = extract_text_from_file(input_file)
    return text

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python document_parser.py <file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    text = parse_document(file_path)
    
    # Print the extracted text as JSON to stdout
    print(json.dumps({"text": text}))

