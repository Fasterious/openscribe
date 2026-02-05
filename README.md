# OpenScribe

Open source transcription for researchers. Professional-quality transcription with speaker diarization, powered by Voxtral (Mistral AI).

## Features

- **Speaker Detection**: Automatic speaker diarization to identify who said what
- **99+ Languages**: Automatic language detection and transcription
- **Fast & Accurate**: Powered by Voxtral, Mistral AI's audio transcription model
- **Simple Interface**: Clean, minimal UI focused on the task at hand
- **Multiple Export Formats**: TXT, TXT with speakers, JSON
- **Transcription Metrics**: Audio duration, processing time, and cost displayed after transcription
- **Internationalization**: Full support for French, English, Spanish, Portuguese, and German UI
- **Authentication**: Google OAuth and Magic Link via Supabase
- **Feedback System**: Built-in feedback button for user suggestions

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

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui + Radix UI
- **Icons**: Lucide React
- **Transcription**: Voxtral via Mistral AI API
- **File Storage**: Mistral Cloud (temporary storage via signed URLs)
- **Authentication**: Supabase Auth (Google OAuth, Magic Link)
- **Deployment**: Vercel (optimized for Next.js)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Upload Zone │  │   Progress   │  │  Transcript  │          │
│  │ (drag & drop)│  │   Tracker    │  │    Viewer    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Auth Modal  │  │   Language   │  │   Feedback   │          │
│  │ (OAuth/Magic)│  │   Selector   │  │    Button    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │ /api/upload    │  │ /api/transcribe│  │ /api/feedback  │    │
│  │ (Mistral Cloud)│  │ (Voxtral API)  │  │ (User feedback)│    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────┐
│     Mistral AI      │  │      Supabase       │  │   Email     │
│ • Cloud Storage     │  │ • Auth (OAuth)      │  │ (Feedback)  │
│ • Voxtral           │  │ • Database (future) │  │             │
└─────────────────────┘  └─────────────────────┘  └─────────────┘
```

## Project Structure

```
openscribe/
├── app/
│   ├── api/
│   │   ├── feedback/         # User feedback endpoint
│   │   ├── transcribe/       # Voxtral transcription
│   │   │   └── [id]/         # Get transcription by ID
│   │   └── upload/           # Upload to Mistral Cloud
│   ├── auth/
│   │   └── callback/         # Supabase OAuth callback
│   ├── layout.tsx            # Root layout with i18n provider
│   ├── page.tsx              # Main page
│   └── globals.css           # Global styles (Tailwind v4)
├── components/
│   ├── auth/                 # Authentication components
│   │   └── auth-modal.tsx    # Login/signup modal
│   ├── feedback/             # Feedback components
│   │   └── feedback-button.tsx
│   ├── transcription/        # Transcription-specific components
│   │   ├── progress-tracker.tsx
│   │   ├── transcript-viewer.tsx
│   │   └── upload-zone.tsx
│   └── ui/                   # shadcn/ui components
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── language-selector.tsx
│       └── progress.tsx
├── lib/
│   ├── i18n/                 # Internationalization
│   │   ├── context.tsx       # i18n React context
│   │   └── translations.ts   # FR/EN/ES/PT/DE translations
│   ├── supabase/             # Supabase clients
│   │   ├── client.ts         # Browser client
│   │   ├── middleware.ts     # Auth middleware utils
│   │   └── server.ts         # Server client
│   ├── mistral.ts            # Mistral API client
│   ├── transcription-cache.ts # Cache for unauthenticated users
│   └── utils.ts              # Utility functions
├── scripts/                  # Test scripts
│   ├── test-mistral-cloud.ts
│   ├── test-voxtral-local.ts
│   └── test-voxtral.ts
├── types/
│   └── index.ts              # TypeScript types
├── middleware.ts             # Next.js middleware (auth)
└── BLUEPRINT.md              # Full PRD and technical specs
```

## Pricing

Voxtral transcription costs **$0.003/min** of audio. This is displayed in the UI after each transcription along with the audio duration and processing time.

## Roadmap

See [BLUEPRINT.md](./BLUEPRINT.md) for the complete roadmap and technical specifications.

### Phase 1: MVP Core (Current)

- [x] Audio upload (drag & drop)
- [x] Transcription via Voxtral (Mistral AI)
- [x] Speaker diarization display
- [x] Export to TXT/JSON
- [x] Transcription metrics display
- [x] Internationalization (FR/EN/ES/PT/DE)
- [x] Authentication (Supabase - Google OAuth + Magic Link)
- [x] Transcription preview for unauthenticated users
- [x] Feedback system
- [ ] Landing page (hero, features, pricing)
- [ ] Credit system
- [ ] Stripe payments

## License

Source-available license. See LICENSE for details.

---

Built with transparency and simplicity in mind.
