# Pixel Pusher

Generate image and video drafts from design briefs using AI. Reads your brief (from a Notion export or Notion URL), asks clarifying questions when it's incomplete, picks the most cost-appropriate AI model, and generates creative assets via [fal.ai](https://fal.ai).

## How It Works

1. **Load a brief** — upload a Notion markdown export (with images/videos) or paste a Notion URL
2. **AI clarification** — Claude analyzes the brief and asks targeted questions only if something critical is missing
3. **Smart model selection** — picks the most appropriate (not most expensive) model based on what the brief actually needs
4. **Prompt engineering** — transforms your brief into an optimized prompt tailored to the selected model's strengths
5. **Generation** — runs the model on fal.ai and returns your drafts

## Two Ways to Load Briefs

### Option A: Notion Export (no API key needed)

Export your Notion page as markdown — Notion bundles everything:

```
My Brief.md                ← the brief text
My Brief/                  ← companion folder (auto-created by Notion)
  hero-image.png
  reference-video.mp4
  mood-board.jpg
```

The tool auto-discovers all images and videos in the companion folder, plus any `![image](path)` references in the markdown.

**Web app:** drag & drop the .md file + attachments, or use file pickers.
**CLI:**
```bash
npm run cli -- ./path/to/brief.md
# With explicit reference files:
npm run cli -- ./brief.md --ref ./photo1.png --ref ./video.mp4
```

### Option B: Notion URL (requires API key)

Paste a Notion page URL — the tool reads text, properties, and attached images/videos via the Notion API. Images are downloaded immediately since Notion URLs expire after 1 hour.

```bash
npm run cli -- https://notion.so/your-brief-page
```

## Available Interfaces

- **Web App** — visual UI with drag-drop upload, brief preview, interactive Q&A, model recommendation, and media gallery
- **CLI** — interactive terminal flow with @clack/prompts

## Setup

### 1. Get API Keys

| Service | Get it at | Env var | Required? |
|---------|-----------|---------|-----------|
| **fal.ai** | [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys) | `FAL_KEY` | Yes |
| **Anthropic** | [console.anthropic.com](https://console.anthropic.com/) | `ANTHROPIC_API_KEY` | Yes |
| **Notion** | [notion.so/my-integrations](https://www.notion.so/my-integrations) | `NOTION_API_KEY` | Only for Notion URL input |

### 2. Install & Configure

```bash
git clone https://github.com/scottscotthendo/Creative-Drafter.git
cd Creative-Drafter
cp .env.example .env
# Fill in your API keys in .env (Notion key is optional)

npm install
npm run build
```

### 3. Run

**Web App:**
```bash
npm run dev
# Open http://localhost:3000
```

**CLI:**
```bash
# From a markdown file (no Notion API needed)
npm run cli -- ./brief.md

# From a Notion URL
npm run cli -- https://notion.so/your-brief-page

# With options
npm run cli -- ./brief.md --ref ./ref-image.png --output ./my-drafts
```

### 4. Notion URL Setup (optional)

If you want to use Notion URLs instead of file exports:
1. Create an integration at [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Add the token to `.env` as `NOTION_API_KEY`
3. Share each Notion page with the integration: "..." menu → "Connections" → Add integration

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
  core/          # Shared logic: Notion reader, markdown parser, analyzer, model selector, generator
  web/           # Next.js web app
  cli/           # Interactive CLI tool
```

## Architecture

```
Brief Input (Notion export OR Notion URL)
    → Brief Parser → Claude Analyzer → Clarifying Q&A
    → Structured Brief → Model Selector → Prompt Engineer → fal.ai → Drafts
```

The prompt engineer layer ensures briefs are never passed raw to models. Each model family gets optimized prompt structures (FLUX wants scene descriptions + lighting, Ideogram wants quoted text + typography style, Recraft wants design language, video models want motion descriptions).

## License

MIT
