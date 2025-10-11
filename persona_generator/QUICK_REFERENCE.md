# Quick Reference Card

## 🚀 **Commands**

### Generate Raw Personas
```bash
python persona_generator.py
```
→ Creates `backend/data/raw_personas.jsonl` (1000 personas, ~2 seconds)

### Augment (Generic)
```bash
python augmenter.py
```
→ Adds religion, demeanour, interests, sector, backstory

### Augment (Environment-Aware)
```bash
python augmenter.py --environment PATH_TO_STORY.md
```
→ Adapts personas to specific time/place setting

### Test Without API
```bash
python test_augmenter.py
```
→ Mock augmentation for development/testing

---

## 📁 **File Structure**

```
persona_generator/
├── persona_generator.py    # Generate raw personas
├── augmenter.py             # LLM augmentation
├── test_augmenter.py        # Testing without API
├── requirements.txt         # Dependencies
├── README.md                # Full documentation
├── USAGE_EXAMPLES.md        # Practical examples
└── .cache/                  # MD5-based result cache

backend/data/
├── raw_personas.jsonl       # Generated personas (25 fields)
├── personas.jsonl           # Augmented personas (30 fields)
└── worlds/
    └── berlin-shadows-1936/
        └── story.md         # Environment definition
```

---

## 🔑 **Key Concepts**

| Concept | Description |
|---------|-------------|
| **Raw Persona** | 25 fields (demographics, psychology, behavior) |
| **Augmented Persona** | +5 fields (religion, demeanour, interests, sector, backstory) |
| **Environment** | Story.md file describing time/place setting |
| **Background Population** | Ordinary citizens, NOT story characters |
| **Era Adaptation** | Jobs/interests/names adapted to historical period |

---

## ⚙️ **CLI Options**

```bash
python augmenter.py [OPTIONS]

--input PATH          Input raw personas file
--output PATH         Output augmented personas file
--environment PATH    Environment story file (optional)
--batch-size N        Personas per LLM batch (default: 15)
```

---

## 🌍 **Environment File**

**Required Elements**:
- Time period (year/era)
- Location (city/region)
- Cultural context (atmosphere, norms)

**Format**: Markdown (flexible structure)

**Example**:
```markdown
# Berlin Shadows, 1936

## Setting
Berlin during the 1936 Olympics...

## Atmosphere
Authoritarian regime, Olympic spectacle...

## Daily Life
Citizens work in factories, shops, offices...
```

---

## 📊 **Data Flow**

```
persona_generator.py
    ↓
raw_personas.jsonl (generic)
    ↓
augmenter.py + environment
    ↓
personas.jsonl (contextualized)
```

---

## ✅ **What Gets Adapted**

When using `--environment`:

| Field | Generic | Environment-Aware (Berlin 1936) |
|-------|---------|----------------------------------|
| Name | Lisa Bonvin | Lisa Becker |
| Job | Data Scientist | Statistical Clerk |
| City | Zurich | Berlin-Kreuzberg |
| Interests | Machine learning | Mathematical calculations |
| Backstory | Generic career | 'Born 1895. Worked at Siemens since 1916...' |

---

## 🧪 **Quick Test**

```bash
# 1. Test environment loading
python -c "from augmenter import PersonaAugmenter; aug = PersonaAugmenter('test', environment_path='../backend/data/worlds/berlin-shadows-1936/story.md'); print('OK' if aug.environment_context['available'] else 'FAIL')"

# 2. Run test suite
python test_augmenter.py

# 3. Check output
head -n 1 ../backend/data/personas.jsonl | python -m json.tool | grep backstory
```

---

## 🚨 **Common Issues**

### API Key Not Set
```bash
export GEMINI_API_KEY='your-key'  # Linux/Mac
$env:GEMINI_API_KEY='your-key'    # Windows PowerShell
```

### Environment Not Found
Check path is relative to `persona_generator/`:
```bash
ls ../backend/data/worlds/berlin-shadows-1936/story.md
```

### Unicode Errors (Windows)
```bash
$env:PYTHONIOENCODING='utf-8'
```

---

## 📚 **Documentation**

- **README.md**: Complete guide
- **USAGE_EXAMPLES.md**: Practical examples (Berlin 1936, Victorian London, Cyberpunk Tokyo)
- **IMPLEMENTATION_SUMMARY.md**: Technical details

---

## ⏱️ **Performance**

| Operation | Time |
|-----------|------|
| Generate 1000 raw personas | ~2 seconds |
| Augment 1000 personas (15/batch) | ~5-10 minutes |
| Environment loading | ~50ms |
| Cache hit (batch) | Instant |

---

## 🎯 **Best Practices**

✅ Test with `test_augmenter.py` before full run
✅ Use smaller `--batch-size` if hitting rate limits
✅ Include specific years/locations in environment files
✅ Keep environment descriptions focused on ordinary life
✅ Review sample outputs manually for quality
❌ Don't make environment too story-focused
❌ Don't include anachronisms (internet in 1936)

---

## 💡 **Pro Tips**

- **Caching**: Same environment = cached results (fast!)
- **Incremental**: Interrupted runs can be resumed
- **Validation**: Check backstory field for era consistency
- **Testing**: Mock mode doesn't require API key

---

**Quick Start**:
```bash
cd persona_generator
python persona_generator.py
python augmenter.py --environment ../backend/data/worlds/berlin-shadows-1936/story.md
python test_augmenter.py
```

