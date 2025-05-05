# 🩺 HealthFact Finder

**HealthFact Finder** is an AI-powered tool designed to detect and flag medical misinformation by fact-checking content such as prescriptions, symptoms, and health-related posts from online platforms like Reddit. It helps users identify false or misleading health claims and ensures access to trusted, evidence-based medical information.

---

## 🔍 Features

- ✅ **Medical Misinformation Detection**  
  Identifies and flags misleading or false medical claims using advanced NLP and fact-checking techniques.

- 🧠 **Smart Prescription & Symptom Analysis**  
  Analyzes provided symptoms and prescriptions to ensure consistency with medical standards.

- 🌐 **Reddit Content Scanner**  
  Fetches and analyzes Reddit posts related to health/medicine, flagging users spreading potential misinformation.

- 📊 **Fact Database Cross-Check**  
  Compares statements against a curated and verified medical fact database.

---

## 🛠️ Tech Stack

- **Python** / **FastAPI** – Backend API and routing  
- **TensorFlow** – Deep learning models for misinformation detection  
- **scikit-learn** / **spaCy** / **Transformers** – NLP and classification  
- **BeautifulSoup** / **PRAW** – Web and Reddit scraping  
- **MongoDB** – For storing flagged data and user reports  
- **React.js** (optional frontend) – UI for entering symptoms, prescriptions, and reviewing flags

---

## 🚀 How It Works

1. **Input**  
   Users input a prescription, symptom, or Reddit post URL.

2. **Processing**  
   NLP pipelines and deep learning models (built with TensorFlow) analyze the content for potential misinformation.

3. **Fact Checking**  
   Compares extracted statements against verified databases from sources like WHO, CDC, and Mayo Clinic.

4. **Reddit Misinformation Flagging**  
   Tracks and reports users who repeatedly spread health-related misinformation.

5. **Output**  
   Highlights inaccurate claims, shows verified facts, and provides safer alternatives.

---

## 🧪 Use Cases

- 🏥 Medical platforms ensuring credible content  
- 📲 Health forums/apps adding smart content validation  
- 🧑‍⚕️ Educating the public about common health myths  
- 🔍 Detecting medical misinformation trends on Reddit

---
