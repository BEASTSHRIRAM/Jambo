"use client";

import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import { recruiterComponents, recruiterTools } from "@/lib/recruiter-config";
import { TamboProvider } from "@tambo-ai/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * Recruiter page - Jambo AI assistant for finding GitHub talent
 */
export default function RecruiterPage() {
    const mcpServers = useMcpServers();

    return (
        <div className="dark h-screen flex flex-col bg-[#0a0a0f]">
            {/* Header */}
            <header className="flex-shrink-0 px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-900/20 to-blue-800/20">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm">Back</span>
                        </Link>
                        <div className="w-px h-6 bg-white/20" />
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="Jambo Logo" className="w-9 h-9 rounded-xl" />
                            <div>
                                <h1 className="text-lg font-bold text-white">Jambo</h1>
                                <p className="text-xs text-blue-400">Recruiter Mode</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-sm text-gray-400">
                        Find talented developers on GitHub
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-hidden">
                <TamboProvider
                    apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
                    components={recruiterComponents}
                    tools={recruiterTools}
                    tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
                    mcpServers={mcpServers}
                >
                    <MessageThreadFull className="max-w-4xl mx-auto" />
                </TamboProvider>
            </div>
        </div>
    );
}
