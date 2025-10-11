# AI Integration Setup Guide

## 🚀 Quick Setup

### 1. Get Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your key

### 2. Configure Environment
Create a `.env` file in the `dashboard/` directory:

```bash
cd dashboard
echo "VITE_GEMINI_API_KEY=YOUR_API_KEY_HERE" > .env
```

Replace `YOUR_API_KEY_HERE` with your actual key.

### 3. Restart Dev Server
```bash
npm run dev
```

---

## 💡 How to Use AI Features

### Filters Tab - Natural Language Filtering

**Examples:**
- "young tech workers in Zurich"
- "educated women over 40"
- "wealthy senior citizens"
- "everyone from Geneva with a master's degree"
- "middle-aged people in finance sector"

**How it works:**
1. Go to Filters tab in sidebar
2. Type your description in the text box
3. Click "I'm Feeling Lazy"
4. AI interprets and shows preview
5. Confirm to apply filters

### Distribution Tab - Natural Language Distribution

**Examples:**
- "500 personas, 70% male, mostly young"
- "200 people, equal gender split, all ages"
- "1000 personas, diverse age groups, 60% Christian"
- "300 young professionals with high income"

**How it works:**
1. Go to Distribution tab in sidebar
2. Type your description in the text box
3. Click "I'm Feeling Lazy"
4. AI interprets and shows preview with percentages
5. Confirm to apply distribution

---

## 🧠 AI Interpretation Logic

### Filters (Deterministic Selection)

The AI understands:
- **Age terms:**
  - "young" / "youth" → 18-35
  - "middle-aged" → 36-55
  - "senior" / "elderly" → 65-90
  
- **Education terms:**
  - "educated" → Bachelor+
  - "highly educated" → Master+
  
- **Income terms:**
  - "wealthy" / "rich" → high, middle_high
  - "poor" / "low-income" → low
  
- **Sector terms:**
  - "tech" → Technology
  - "finance" → Finance
  - "healthcare" → Healthcare

- **Location:** City names (Zurich, Geneva, Basel, etc.)
- **Ethnicity:** Swiss-German, Swiss-French, etc.
- **Gender:** Male, Female

### Distribution (Sampling)

The AI can interpret:
- **Sample size:** Numbers mentioned → "500 personas" → 500
- **Gender split:** "70% male" → Male: 70, Female: 30
- **Age emphasis:**
  - "mostly young" → Higher % in 18-25, 26-35
  - "equal ages" → Even distribution
  - "seniors only" → 100% in 66+
  
- **Distribution terms:**
  - "diverse" → Even split
  - "mostly X" → 60-70% in category X
  - "equal" → 50/50 or even distribution

---

## 🔧 Troubleshooting

### API Key Not Working
```
Error: GEMINI_API_KEY not configured
```
**Solution:** Make sure `.env` file exists in `dashboard/` directory with correct key.

### Rate Limiting
```
Error: 429 Too Many Requests
```
**Solution:** Gemini has rate limits. Wait a few seconds and try again.

### Invalid Response
```
Error: Cannot parse AI response
```
**Solution:** Try rephrasing your query more clearly. The AI works best with specific descriptions.

### No Results After Filtering
**Solution:** Your filters might be too restrictive. Try broader criteria or use "Clear All" and start over.

---

## 📝 Best Practices

### Writing Good AI Prompts

**✅ Good:**
- "young professionals in tech, living in major cities"
- "500 people, 60% male, diverse age groups"
- "educated women aged 30-50 in finance"

**❌ Avoid:**
- "some people" (too vague)
- "a few personas from somewhere" (unclear)
- "random sample" (use Distribution tab with even splits instead)

### Combining Manual + AI

1. Use AI for initial rough filtering
2. Fine-tune manually with checkboxes/sliders
3. Save configuration for later use

---

## 🎯 Advanced Tips

### Chaining Filters
1. Use AI to get close: "tech workers in Zurich"
2. Manually add: specific education levels
3. Refine: adjust age range with sliders

### Distribution Matching
1. Use AI: "mostly young people"
2. Check the percentages in preview
3. Manually adjust sliders if needed
4. Apply when satisfied

### Saving AI-Generated Configs
1. Generate filters with AI
2. Go to "Saved Sets" tab
3. Click "Save Current"
4. Name it (e.g., "Young Tech Workers")
5. Reuse anytime!

---

## 🔍 Technical Details

### Model Used
- **Gemini 2.0 Flash Exp** (fast, structured output)
- Supports JSON schema validation
- Sub-second response time

### Data Processed
- Filters send: Available cities, sectors, ethnicities, etc.
- Distribution sends: Top 6 religions, top 6 ethnicities
- Response: Structured JSON matching filter/distribution schema

### Privacy
- Only metadata sent (available options)
- No actual persona data sent to AI
- Queries not stored by default

---

## 📊 Example Workflows

### Workflow 1: Market Research Sample
```
1. AI Query: "500 urban professionals aged 25-45, high income"
2. Review interpreted distribution
3. Adjust gender split manually if needed
4. Apply and analyze in visualization tabs
5. Export results to JSON
```

### Workflow 2: Diversity Analysis
```
1. AI Query: "diverse ethnicities, all age groups, equal gender"
2. Review filters
3. Add specific cities manually
4. Apply and view in Cultural tab
5. Save configuration as "Diversity Study"
```

### Workflow 3: Target Audience
```
1. Use Preset: "Young Professionals"
2. AI refine: "mostly tech and finance sectors"
3. Manual adjust: add specific education levels
4. View results in Demographics tab
5. Export filtered personas for analysis
```

---

## 💬 Need Help?

The AI is flexible and learns from context. If it doesn't understand:
1. Try rephrasing with more specific terms
2. Use manual controls alongside AI
3. Check preview before applying
4. Save successful queries for future reference

Happy filtering! 🎉

