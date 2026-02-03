# OpenScribe

Open source transcription for researchers. Professional-quality transcription with speaker diarization, powered by WhisperX.

## Features

- **Speaker Detection**: Automatic speaker diarization to identify who said what
- **99+ Languages**: Automatic language detection and transcription
- **Fast & Accurate**: Powered by WhisperX on RunPod serverless GPUs
- **Simple Interface**: Clean, minimal UI focused on the task at hand
- **Multiple Export Formats**: TXT, TXT with speakers, JSON

## Quick Start

### Prerequisites

- Node.js 18+
- A RunPod account with a WhisperX endpoint deployed

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

Edit `.env.local` and add your RunPod credentials:

```env
RUNPOD_API_KEY=your_runpod_api_key
RUNPOD_ENDPOINT_ID=your_endpoint_id
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
- **Transcription**: WhisperX via RunPod

## Project Structure

```
openscribe/
├── app/
│   ├── api/
│   │   └── transcribe/        # API routes for transcription
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Main page
│   └── globals.css            # Global styles
├── components/
│   ├── ui/                    # shadcn/ui components
│   └── transcription/         # Transcription-specific components
├── lib/
│   ├── runpod.ts              # RunPod API client
│   └── utils.ts               # Utility functions
├── types/
│   └── index.ts               # TypeScript types
└── BLUEPRINT.md               # Full PRD and technical specs
```

## Roadmap

See [BLUEPRINT.md](./BLUEPRINT.md) for the complete roadmap and technical specifications.

### Current Phase: MVP

- [x] Audio upload (drag & drop)
- [x] Transcription via RunPod WhisperX
- [x] Speaker diarization display
- [x] Export to TXT/JSON
- [ ] Authentication (Supabase)
- [ ] Credit system
- [ ] Stripe payments

## Related Projects

- [whisperx-runpod](https://github.com/yourusername/whisperx-runpod) - The open source WhisperX worker for RunPod

## License

Source-available license. See LICENSE for details.

---

Built with transparency and simplicity in mind.
