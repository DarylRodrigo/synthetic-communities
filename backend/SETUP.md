# Setup Instructions

## Environment Configuration

### Required: API Key Setup

The backend requires a Gemini API key to function. Create a `.env` file in the **project root** (not in the `backend/` directory):

```
/synthetic-communities/.env
```

Add your API key:

```bash
GEMINI_API_KEY=your_api_key_here
```

### Directory Structure

```
synthetic-communities/
├── .env              # ← Create this file here
├── backend/
│   ├── src/
│   ├── tests/
│   └── ...
└── ...
```

### Important Notes

- The `.env` file must be in the parent directory of `backend/`
- The GameEngine will look for this file when initializing
- Keep your API key private and never commit `.env` to git
