# OpenScribe

Open source transcription for researchers. Professional-quality transcription with speaker diarization, powered by Voxtral (Mistral AI).

## Features

- **Speaker Detection**: Automatic speaker diarization to identify who said what
- **99+ Languages**: Automatic language detection and transcription
- **Fast & Accurate**: Powered by Voxtral, Mistral AI's audio transcription model
- **Simple Interface**: Clean, minimal UI focused on the task at hand
- **Multiple Export Formats**: TXT, TXT with speakers, JSON
- **Transcription Metrics**: Audio duration, processing time, and cost displayed after transcription

## Quick Start

### Prerequisites

- Node.js 18+
- A Mistral AI account with an API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/openscribe.git
cd openscribe

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Configuration

Edit `.env.local` and add your Mistral API key:

```env
MISTRAL_API_KEY=your_mistral_api_key
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

### Production

```bash
npm run build
npm start
```

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Transcription**: Voxtral via Mistral AI API
- **File Storage**: Mistral Cloud (temporary storage via signed URLs)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Upload Zone │  │   Progress   │  │  Transcript  │          │
│  │ (drag & drop)│  │   Tracker    │  │    Viewer    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                         │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │ /api/upload          │  │ /api/transcribe      │            │
│  │ (Mistral Cloud)      │  │ (Voxtral API)        │            │
│  └──────────────────────┘  └──────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Mistral AI                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │ Cloud Storage        │  │ Voxtral Transcription│            │
│  │ (Signed URLs)        │  │ (Synchronous API)    │            │
│  └──────────────────────┘  └──────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
openscribe/
├── app/
│   ├── api/
│   │   ├── upload/           # Upload to Mistral Cloud
│   │   └── transcribe/       # Voxtral transcription
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Main page
│   └── globals.css           # Global styles
├── components/
│   ├── ui/                   # shadcn/ui components
│   └── transcription/        # Transcription-specific components
├── lib/
│   ├── mistral.ts            # Mistral API client
│   └── utils.ts              # Utility functions
├── types/
│   └── index.ts              # TypeScript types
└── BLUEPRINT.md              # Full PRD and technical specs
```

## Pricing

Voxtral transcription costs **$0.003/min** of audio. This is displayed in the UI after each transcription along with the audio duration and processing time.

## Roadmap

See [BLUEPRINT.md](./BLUEPRINT.md) for the complete roadmap and technical specifications.

### Current Phase: MVP

- [x] Audio upload (drag & drop)
- [x] Transcription via Voxtral (Mistral AI)
- [x] Speaker diarization display
- [x] Export to TXT/JSON
- [x] Transcription metrics display
- [ ] Authentication (Supabase)
- [ ] Credit system
- [ ] Stripe payments

## License

Source-available license. See LICENSE for details.

---

Built with transparency and simplicity in mind.
