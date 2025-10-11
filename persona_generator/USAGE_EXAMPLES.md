# Usage Examples

## 📝 **Basic Usage**

### **1. Generate Raw Personas**
```bash
cd persona_generator
python persona_generator.py
```

**Output**: `backend/data/raw_personas.jsonl` (1000 personas)

**Console Output**:
```
[INFO] Generating personas for Switzerland (multi-language)
[INFO] Generated 1000 personas for Switzerland (multi-language) → ../backend/data/raw_personas.jsonl
[INFO] Summary Statistics:
[INFO] - Average susceptibility: 0.503
[INFO] - Average trust_institution: 0.497
[INFO] - Average turnout_propensity: 0.501
```

---

### **2. Augment Personas (Generic)**
```bash
python augmenter.py
```

**Output**: `backend/data/personas.jsonl` (1000 augmented personas)

**Console Output**:
```
[INFO] === Persona Augmentation Configuration ===
[INFO] Input file: ../backend/data/raw_personas.jsonl
[INFO] Output file: ../backend/data/personas.jsonl
[INFO] Environment: None (generic augmentation)
[INFO] Batch size: 15
[INFO] Processing batch 1 (15 personas)
[INFO] Batch 1 completed: 15/15 personas saved
...
[INFO] Completed processing: 1000 personas saved
[INFO] === Augmentation Quality Metrics ===
[INFO] Total processed: 1000
[INFO] Corrections made: 127
[INFO] Augmentations added: 1000
```

---

### **3. Augment Personas (Environment-Aware)**

#### **Berlin 1936 Example**
```bash
python augmenter.py --environment ../backend/data/worlds/berlin-shadows-1936/story.md
```

**Output**: Personas adapted to 1936 Berlin setting

**Sample Before/After**:

**BEFORE (Generic)**:
```json
{
  "name": "Lisa Bonvin",
  "age": 41,
  "job": "Pharmacist, hospital",
  "city": "Flawil",
  "interests": null,
  "backstory": null
}
```

**AFTER (Berlin 1936)**:
```json
{
  "name": "Lisa Becker",
  "age": 41,
  "job": "Hospital Apotheker",
  "city": "Berlin-Kreuzberg",
  "religion": "Protestant",
  "demeanour": "Meticulous and patient-focused under pressure",
  "interests": ["pharmaceutical research", "alpine hiking", "radio programs"],
  "sector": "Healthcare",
  "backstory": "Born 1895 in Berlin. Completed pharmacy training 1917, working at Charité hospital since 1918. Witnessed transformation of medical field during Weimar Republic, now managing hospital formulary with precision during Olympic preparations."
}
```

---

## 🌍 **Creating Custom Environments**

### **Example: Victorian London 1888**

**1. Create Environment File**
```bash
mkdir -p ../backend/data/worlds/victorian-london-1888
```

**2. Write `story.md`**:
```markdown
# Victorian London, 1888

## Setting
London in 1888, the heart of the British Empire at its zenith. Gas lamps illuminate cobblestone streets where horse-drawn carriages navigate between grand Victorian architecture and crowded tenements. The Industrial Revolution has transformed the city into the world's largest metropolis.

## Atmosphere
Stark class divisions define daily life. The wealthy elite enjoy electric lighting and indoor plumbing in Mayfair mansions, while factory workers crowd into East End slums. Scotland Yard's new detective division investigates crimes using emerging forensic techniques. The British Museum showcases artifacts from global expeditions.

## Daily Life
Telegraph networks connect the city to the empire. The Underground Railway (world's first) transports commuters. Newspapers report on Queen Victoria's Golden Jubilee. Working-class citizens labor in factories, docks, and textile mills. The middle class expands with clerks, shopkeepers, and civil servants.

## Technology & Culture
Gas lighting, steam power, early telephones in wealthy homes. Photography studios, music halls, and theatre dominate entertainment. Social reform movements challenge child labor and working conditions. Medical advancements combat cholera and typhoid outbreaks.
```

**3. Run Augmentation**:
```bash
python augmenter.py --environment ../backend/data/worlds/victorian-london-1888/story.md --output victorian_personas.jsonl
```

**Expected Adaptations**:
- Names: English Victorian-era names (e.g., 'Charles Pemberton', 'Eleanor Whitfield')
- Jobs: Factory worker, dock laborer, telegraph operator, gas lamp lighter, chimney sweep
- Cities: London neighborhoods (Whitechapel, Shoreditch, Mayfair, Westminster)
- Interests: Music halls, penny dreadfuls, church services, public house gatherings
- Backstory: References to Victorian industrialization, Queen Victoria's reign, class struggles

---

### **Example: Cyberpunk Tokyo 2085**

**1. Create `story.md`**:
```markdown
# Neon Shadows: Tokyo 2085

## Setting
Neo-Tokyo, 2085. Towering arcologies pierce perpetual cloud cover. Holographic advertisements illuminate rain-slicked streets where autonomous vehicles navigate between corporate megastructures and crumbling pre-collapse districts. The line between human and machine blurs as neural implants become commonplace.

## Society
Corporate zaibatsu control districts like feudal lords. Citizens work in data mining, neural interface design, synthetic biology, and drone logistics. The wealthy upgrade bodies with cybernetic enhancements while the poor struggle with outdated wetware. Street markets sell black-market implants and memory chips.

## Technology
Neural networks link minds. Augmented reality overlays physical space. Quantum encryption secures data. Gene-modded food feeds billions. Climate-controlled biodomes protect against acid rain. AI assistants manage daily life.

## Culture
Virtual reality entertainment dominates. Augmented sports leagues showcase cyborg athletes. Underground hacker collectives challenge corporate control. Neo-traditional movements reject excessive modification. Multi-generational families share micro-apartments in kilometer-high towers.
```

**2. Run Augmentation**:
```bash
python augmenter.py --environment ../backend/data/worlds/cyberpunk-tokyo-2085/story.md
```

**Expected Adaptations**:
- Names: Japanese names with tech influences
- Jobs: Neural interface designer, quantum data analyst, synthetic biology engineer, drone logistics coordinator
- Cities: Neo-Tokyo districts (Akihabara Arcology, Shibuya Megastructure)
- Interests: VR gaming, augmented sports, underground hackathons, neo-traditional tea ceremonies
- Backstory: References to climate collapse, corporate wars, cybernetic modifications

---

## 🎯 **Advanced Usage**

### **Batch Processing Multiple Environments**

```bash
# Process different eras in parallel
python augmenter.py --environment worlds/berlin-1936/story.md --output berlin_1936.jsonl &
python augmenter.py --environment worlds/victorian-london-1888/story.md --output victorian_1888.jsonl &
python augmenter.py --environment worlds/tokyo-2085/story.md --output tokyo_2085.jsonl &
wait
```

### **Custom Batch Size for Rate Limiting**
```bash
# Smaller batches to stay within API rate limits
python augmenter.py --batch-size 5 --environment worlds/berlin-1936/story.md
```

### **Incremental Processing**
If augmentation is interrupted, simply rerun the same command. The system uses caching to avoid reprocessing batches.

---

## 🧪 **Testing Without API Key**

```bash
python test_augmenter.py
```

**Output Preview**:
```
=== Testing Environment-Aware Augmentation ===
Environment: ../backend/data/worlds/berlin-shadows-1936/story.md

Testing with 4 personas...

[OK] Environment loaded successfully
Environment content preview: # Berlin Shadows, 1936

*Logline:* In the heart of the 1936 Berlin Olympics...

Processed 4 personas:

1. Lisa Bonvin
   Religion: None
   Demeanour: ambitious and collaborative
   Interests: ['cultural events', 'patient advocacy', 'alpine traditions', 'hiking']
   Sector: healthcare
   Backstory: Born 1895. Has worked as Pharmacist, hospital in Flawil since 1916...
```

---

## 📊 **Validation & Quality Checks**

### **Verify Environment Loading**
```bash
python -c "from augmenter import PersonaAugmenter; aug = PersonaAugmenter('test', environment_path='../backend/data/worlds/berlin-shadows-1936/story.md'); print('Loaded:', aug.environment_context.get('available'))"
```

### **Sample Output Inspection**
```bash
# View first augmented persona
head -n 1 ../backend/data/personas.jsonl | python -m json.tool
```

### **Count Augmentations**
```bash
# Count personas with backstory field
grep -c '"backstory"' ../backend/data/personas.jsonl
```

---

## 🔄 **Workflow Integration**

### **Complete Pipeline**
```bash
#!/bin/bash
# generate_and_augment.sh

echo "Step 1: Generate raw personas..."
python persona_generator.py

echo "Step 2: Augment with Berlin 1936 environment..."
python augmenter.py --environment ../backend/data/worlds/berlin-shadows-1936/story.md

echo "Step 3: Copy to dashboard..."
cp ../backend/data/personas.jsonl ../dashboard/public/personas.jsonl

echo "Done! View at http://localhost:3000"
```

---

## 💡 **Tips & Best Practices**

### **Writing Good Environment Files**
✅ **DO**: Include specific years, locations, technologies, and cultural details
✅ **DO**: Describe ordinary life, not just the main story
✅ **DO**: Mention industries, jobs, and social structures
❌ **DON'T**: Make it too story-focused (personas are background population)
❌ **DON'T**: Use overly abstract or vague descriptions

### **Optimizing Performance**
- Use caching: Run with same environment multiple times for free cache hits
- Batch size: Larger batches (15-20) are faster, smaller (5-10) handle rate limits
- Incremental runs: Process first 100 personas as a test before full 1000

### **Quality Assurance**
- Test with `test_augmenter.py` first
- Review sample outputs manually
- Check for anachronisms (e.g., 'internet' in 1936)
- Validate job distributions match era (no AI engineers in Victorian London)

---

## 🐛 **Troubleshooting**

### **Issue: API Key Not Found**
```
ERROR: GEMINI_API_KEY environment variable not set
```
**Solution**: 
```bash
export GEMINI_API_KEY='your-api-key-here'  # Linux/Mac
set GEMINI_API_KEY=your-api-key-here       # Windows CMD
$env:GEMINI_API_KEY='your-api-key-here'    # Windows PowerShell
```

### **Issue: Environment Not Loading**
```
WARNING: Environment file not found: path/to/story.md
```
**Solution**: Check path is relative to `persona_generator/` directory
```bash
# From persona_generator directory
ls -la ../backend/data/worlds/berlin-shadows-1936/story.md
```

### **Issue: Unicode Encoding Errors (Windows)**
**Solution**: Test script automatically handles UTF-8 encoding. For production, set:
```bash
$env:PYTHONIOENCODING='utf-8'
```

---

## 📚 **Additional Resources**

- **Full Documentation**: See `README.md`
- **API Reference**: See code docstrings in `augmenter.py`
- **Environment Examples**: See `backend/data/worlds/`
- **Dashboard Integration**: See `dashboard/README.md`

