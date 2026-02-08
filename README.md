# Jambo - AI-Powered Career Platform

Jambo is an intelligent career development platform that bridges the gap between job seekers and recruiters using cutting-edge AI technology. Built with Next.js and Tambo AI, Jambo transforms the job hunting and hiring experience through automation and intelligent matching.

## ✨ Features

### For Job Seekers
- **AI Mock Interview Coach** - Practice with a realistic AI interviewer using speech-to-text and text-to-speech
- **Intelligent Job Discovery** - Find opportunities powered by multiple data sources
- **Company Insights** - Get comprehensive information about potential employers

### For Recruiters
- **AI-Assisted Candidate Sourcing** - Aggregate talent data from GitHub and professional networks
- **Smart Matching** - View candidate profiles with match scores and relevant skills
- **Streamlined Pipeline** - Manage recruitment with structured job and candidate cards

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **AI Integration**: [Tambo AI SDK](https://tambo.co) for conversational interfaces
- **Speech**: Deepgram (TTS/STT) for real-time audio processing
- **LLM**: Groq for fast AI interview responses
- **Styling**: Tailwind CSS with dark mode support
- **Data Sources**: GitHub API, RapidAPI, Exa, Firecrawl

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/BEASTSHRIRAM/Jambo.git
cd Jambo
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp example.env.local .env.local
```

Add your API keys to `.env.local`:
```env
NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_key
NEXT_PUBLIC_DEEPGRAM_API_KEY=your_deepgram_key
NEXT_PUBLIC_GROQ_API_KEY=your_groq_key
RAPIDAPI_KEY=your_rapidapi_key
GITHUB_TOKEN=your_github_token
EXA_API_KEY=your_exa_key
FIRECRAWL_API_KEY=your_firecrawl_key
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## 🤖 How We Use Tambo

Tambo powers our AI chat experience, making job hunting and recruiting feel like talking to a smart assistant. Instead of clicking through menus, users simply type what they need—"find React developers in San Francisco" or "show me trending tech jobs"—and Tambo understands and responds with interactive cards and real-time results.

We registered custom tools and components that let Tambo search GitHub for talent, fetch company insights, and display job listings dynamically. The SDK handles conversation threads, message history, and state management, so our AI remembers context across sessions.

### Tambo Configuration

Components and tools are registered in:
- `src/lib/tambo.ts` - Global configuration
- `src/lib/jobseeker-config.ts` - Job seeker specific tools
- `src/lib/recruiter-config.ts` - Recruiter specific tools

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── jobseeker/         # Job seeker dashboard
│   ├── recruiter/         # Recruiter dashboard
│   └── page.tsx           # Landing page
├── components/
│   ├── interview/         # AI interview components
│   ├── recruitment/       # Job & candidate cards
│   ├── tambo/             # Tambo UI components
│   └── ui/                # Shared UI components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities & configs
└── services/              # API integrations
```

## 🎯 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in project settings
4. Deploy!

Build settings are auto-detected for Next.js.

## 📝 License

MIT
