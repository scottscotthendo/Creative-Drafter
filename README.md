# Creative Drafter

Generate image and video drafts from Notion design briefs using AI. Reads your brief, asks clarifying questions when it's incomplete, picks the most cost-appropriate AI model, and generates creative assets via [fal.ai](https://fal.ai).

## How It Works

1. **Paste a Notion URL** — the tool reads your design brief (text, properties, attached images/videos)
2. **AI clarification** — Claude analyzes the brief and asks targeted questions only if something critical is missing
3. **Smart model selection** — picks the most appropriate (not most expensive) model based on what the brief actually needs
4. **Prompt engineering** — transforms your brief into an optimized prompt tailored to the selected model's strengths
5. **Generation** — runs the model on fal.ai and returns your drafts

## Available Interfaces

- **Web App** — visual UI with brief preview, interactive Q&A, and media gallery
- **CLI** — terminal-based flow with interactive prompts

## Setup

### 1. Get API Keys

You need three API keys:

| Service | Get it at | Env var |
|---------|-----------|---------|
| **Notion** | [notion.so/my-integrations](https://www.notion.so/my-integrations) — create an internal integration | `NOTION_API_KEY` |
| **fal.ai** | [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys) | `FAL_KEY` |
| **Anthropic** | [console.anthropic.com](https://console.anthropic.com/) | `ANTHROPIC_API_KEY` |

### 2. Share Notion Pages

After creating your Notion integration, you must **share each page/database** with it:
- Open the Notion page
- Click "..." menu (top right) → "Connections" → Add your integration

### 3. Install & Configure

```bash
git clone https://github.com/scottscotthendo/creative-drafter.git
cd creative-drafter
cp .env.example .env
# Fill in your API keys in .env

npm install
npm run build
```

### 4. Run

**Web App:**
```bash
npm run dev
# Open http://localhost:3000
```

**CLI:**
```bash
npm run cli -- https://notion.so/your-brief-page
```

Or with options:
```bash
npm run cli -- https://notion.so/your-brief-page --output ./my-drafts
```

## Model Selection

The tool picks models based on actual needs, not quality ceiling:

### Image Models

| Model | Best For | Cost |
|-------|----------|------|
| FLUX.1 Schnell | Quick drafts, iteration | $0.003/MP |
| FLUX.1 Dev | Standard quality | $0.012/MP |
| FLUX.2 Pro | High quality finals | $0.03/MP |
| FLUX General | Reference image matching | $0.012/MP |
| Ideogram V3 | Text/typography in images | $0.03-$0.09 |
| Recraft V3 | Vector art, graphic design | $0.04-$0.08 |

### Video Models

| Model | Best For | Cost |
|-------|----------|------|
| LTX 2.0 Fast | Quick video drafts | ~$0.04/sec |
| LTX 2.0 | Standard video | $0.04/sec |
| WAN 2.6 | Natural motion, up to 4K | ~$0.06/sec |
| Veo 3.1 Fast | High quality, half price | $0.10/sec |
| Veo 3.1 | Premium cinematic + audio | $0.20-$0.40/sec |
| Kling 3.0 Pro | Motion-heavy content | ~$0.10/sec |

## Project Structure

```
packages/
  core/          # Shared logic: Notion reader, analyzer, model selector, generator
  web/           # Next.js web app
  cli/           # Interactive CLI tool
```

## Architecture

```
Notion Brief → Notion API → Brief Parser → Claude Analyzer → Clarifying Q&A
    → Structured Brief → Model Selector → Prompt Engineer → fal.ai → Drafts
```

The prompt engineer layer ensures briefs are never passed raw to models. Each model family gets optimized prompt structures (FLUX wants scene descriptions + lighting, Ideogram wants quoted text + typography style, Recraft wants design language, video models want motion descriptions).

## License

MIT
