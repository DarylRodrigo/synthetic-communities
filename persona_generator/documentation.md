# Persona Generation & Augmentation System

## 📊 **Current State Overview**
- **Raw Personas**: 1,000 generated (100% complete)
- **Augmented Personas**: 2,000 total (appears to include duplicates from processing)
- **Technology Stack**: Faker (generation) + Gemini 2.5 Pro (augmentation)
- **Target Population**: Swiss multi-language regions (German, French, Italian)

---

## 🏗️ **System Architecture**

### **Two-Stage Process**

#### **Stage 1: Raw Generation** (`persona_generator.py`)
```
Input Parameters
├── n_personas: 1000
├── country: "CH" (Switzerland)
├── seed: 42 (reproducible)
└── locales: ['de_CH', 'fr_CH', 'it_CH']

↓

Core Generation Logic
├── Demographic Distribution
│   ├── Age: 18-90 (weighted realistic distribution)
│   ├── Gender: M/F (from profile data)
│   ├── Education: 6 levels (age-correlated)
│   └── Income: 5 brackets (weighted)
├── Geographic Assignment
│   ├── Cities: Swiss cities (faker-based)
│   ├── Jobs: Realistic job titles
│   └── Companies: Generated company names
├── Cultural Background
│   ├── Ethnicity: Swiss + 8 immigrant groups
│   │   ├── Swiss: 60% (German/French/Italian)
│   │   ├── European: 35% (German, French, Italian, Portuguese, Kosovan, Spanish, Turkish)
│   │   └── Global: 5% (Sri Lankan, Chinese, Indian, Brazilian, Syrian, Afghan, Vietnamese)
│   └── Cultural Values: Ethnicity-aligned backgrounds
└── Behavioral Traits
    ├── Psychological: Big Five personality traits
    ├── Cognitive: Confirmation bias, risk aversion
    ├── Social: Network influence, turnout propensity
    └── Beliefs: 8 topic-based prior beliefs (-1 to +1 scale)

↓

Output: backend/data/raw_personas.jsonl
```

#### **Stage 2: LLM Augmentation** (`augmenter.py`)
```
Input: Raw personas from Stage 1

↓

LLM Enhancement Process (Gemini 2.5 Pro)
├── Batch Processing: 15 personas per batch
├── Caching: MD5-based result caching
├── Error Handling: 3-retry with exponential backoff
└── Quality Control: Structured JSON validation

↓

Augmentation Categories
├── **Religion** (10 categories)
│   ├── Swiss: Catholic(35%), Protestant(25%), None(30%), Other(10%)
│   ├── Southern European: Catholic(80%), None(15%), Other(5%)
│   ├── Muslim Groups: Muslim(90%), None(5%), Other(5%)
│   ├── South Asian: Hindu(40%), Buddhist(30%), Muslim(15%), Christian(10%), None(5%)
│   └── East Asian: Buddhist(30%), Traditional(20%), None(30%), Christian(15%), Other(5%)
├── **Demeanour** (Professional tone, ≤12 words)
│   ├── Education-aligned: Scholarly, methodical, ambitious, practical
│   ├── Job-specific: Empathetic (medical), patient (education), precise (engineering)
│   └── Experience-based: Wise and patient (senior), enthusiastic (junior)
├── **Interests** (3-4 items, age/job/culture-aligned)
│   ├── Age-based: Gaming (young), travel (mid), history (senior)
│   ├── Professional: Medical research (healthcare), legal ethics (law)
│   └── Cultural: Alpine traditions (Swiss), Mediterranean cuisine (Southern European)
├── **Sector** (20 controlled categories)
│   ├── Healthcare, Education, Technology, Finance
│   ├── Manufacturing, Services, Creative, Government
│   ├── Environmental, Legal, Insurance, Tourism
│   └── Agriculture, Construction, Operations, Pharmaceutical
└── **Backstory** (Documentary style, ≤2 sentences)
    ├── Format: "Born [year]. [Education]. [Career progression]. [Recent achievement]."
    ├── Anchored to numeric data (age, education, tenure)
    ├── Factual and dense, no melodrama
    └── Example: "Born 1983 in Flawil; MPharm 2005. Hospital pharmacist since 2007; led 2023 medication-safety rollout cutting administration errors 18%."

↓

Output: backend/data/personas.jsonl (Enhanced with 5 new fields)
```

---

## 📈 **Data Quality & Enhancement**

### **Before vs After Comparison**

#### **Raw Persona Structure (25 fields)**
```json
{
  "id": "uuid",
  "name": "Lisa Bonvin",
  "age": 41,
  "gender": "F",
  "city": "Flawil",
  "job": "Pharmacist, hospital",
  "company": "Herzog Fankhauser GmbH",
  "education_level": "bachelor_degree",
  "income_bracket": "low",
  "ethnicity": "Swiss-French",
  "cultural_background": "Swiss-German",
  "country": "CH_de",
  "susceptibility": 0.59,
  "trust_institution": 0.032,
  "turnout_propensity": 0.094,
  "media_diet": {...},
  "personality_traits": {...},
  "confirmation_bias": 0.759,
  "social_network_influence": 0.160,
  "risk_aversion": 0.423,
  "fairness_value": 0.278,
  "prior_beliefs": {...},
  "timestamp": "2025-10-11T01:21:07.892155"
}
```

#### **Augmented Persona Structure (30 fields)**
```json
{
  // ... existing 25 fields ...
  "religion": "Catholic",
  "demeanour": "Meticulous and patient-focused, with high attention to pharmacological detail.",
  "interests": ["Pharmacovigilance", "hiking in the Appenzell Alps", "patient safety protocols"],
  "sector": "Healthcare",
  "backstory": "Born 1983. Completed her MPharm in 2007 and has been a hospital pharmacist since 2009, leading a 2023 medication-safety initiative that reduced administration errors by 15%."
}
```

### **Enhancement Statistics**
- **Corrections Applied**: Logical inconsistencies fixed (education-job mismatches, name-ethnicity alignment)
- **New Fields Added**: 5 additional dimensions per persona
- **Processing**: 1,000 → 2,000 personas (appears to include some duplicate processing)
- **Quality Control**: Structured LLM prompts ensure consistency

---

## 🎯 **Key Features & Capabilities**

### **Demographic Realism**
- **Age Distribution**: Realistic population pyramid (18-90, weighted)
- **Ethnic Diversity**: 9 major groups reflecting Swiss demographics (75% Swiss citizens, 25% foreign nationals)
- **Education Progression**: Age-correlated education levels (younger = higher education trends)
- **Geographic Spread**: Multi-language Swiss regions with authentic city names

### **Behavioral Depth**
- **Big Five Personality**: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism
- **Cognitive Biases**: Confirmation bias, risk aversion, fairness values
- **Social Influence**: Network effects and institutional trust
- **Media Consumption**: Platform preferences (social media, TV, newspapers, blogs)

### **Cultural Authenticity**
- **Religion Distribution**: Ethnically and age-appropriate religious affiliations
- **Interest Alignment**: Age, profession, and culture-specific hobbies and activities
- **Professional Sectors**: 20 industry categories covering Swiss job market
- **Life Stories**: Documentary-style backstories with career progression and achievements

---

## 🔧 **Technical Implementation**

### **Dependencies**
```txt
faker          # Persona generation
google-genai   # LLM augmentation (Gemini 2.5 Pro)
python-dotenv  # Environment variable management
numpy          # Numerical operations
```

### **Configuration**
- **API Key**: `GEMINI_API_KEY` environment variable required
- **Batch Size**: 15 personas per LLM call (configurable)
- **Caching**: MD5-based result caching in `.cache/` directory
- **Error Handling**: 3-retry exponential backoff for API failures

### **Quality Assurance**
- **Mock Mode**: Test without API key using rule-based augmentation
- **Validation**: JSON schema validation for LLM responses
- **Metrics Tracking**: Correction rates, augmentation success, cache hits
- **Incremental Processing**: Resume capability for large datasets

---

## 📊 **Dashboard Integration**

### **Visualization Capabilities** (`dashboard/`)
- **Demographics Tab**: Age, ethnicity, socioeconomic distributions
- **Geographic Tab**: Interactive Swiss heat map with city-level data
- **Psychological Tab**: K-means clustering with PCA dimensionality reduction
- **Cultural Tab**: Religious diversity and interest pattern analysis

### **Data Flow**
```
persona_generator/
├── raw_personas.jsonl → augmenter.py → personas.jsonl
└── dashboard/public/personas.jsonl (copy for visualization)
```

---

## 🚀 **Usage & Extension**

### **Generation Command**
```bash
cd persona_generator
python persona_generator.py  # Generate 1000 raw personas
python augmenter.py          # Augment with LLM enhancements
```

### **Customization Options**
- **Country Selection**: Modify `country` parameter for different populations
- **Sample Size**: Adjust `n_personas` for larger/smaller datasets
- **Ethnic Mix**: Update ethnicity weights for different demographic targets
- **Field Expansion**: Add new augmentation categories in LLM prompt

### **Future Enhancements**
- **Validation Pipeline**: Automated quality checks and corrections
- **Multi-language Support**: Localized augmentation prompts
- **Performance Optimization**: Parallel processing and advanced caching
- **Integration APIs**: REST endpoints for persona generation and retrieval
