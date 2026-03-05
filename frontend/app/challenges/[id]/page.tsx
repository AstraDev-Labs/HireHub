"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, Play, Send, Layout, Terminal, CheckCircle2, XCircle, Clock, Cpu, Code2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChallengeDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [challenge, setChallenge] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [result, setResult] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('description');

    useEffect(() => {
        const fetchChallenge = async () => {
            try {
                const res = await api.get(`/challenges/${id}`);
                const data = res.data.data.challenge;
                setChallenge(data);

                // Set initial code from snippet if available
                const snippet = data.codeSnippets?.find((s: any) => s.language === 'javascript');
                if (snippet) setCode(snippet.code);
            } catch (error) {
                toast.error("Failed to load challenge");
                router.push('/challenges');
            } finally {
                setLoading(false);
            }
        };
        fetchChallenge();
    }, [id, router]);

    const handleLanguageChange = (newLang: string) => {
        setLanguage(newLang);
        // Find snippet for new language
        const snippet = challenge.codeSnippets?.find((s: any) => s.language.toLowerCase() === newLang.toLowerCase());
        if (snippet) {
            setCode(snippet.code);
        } else {
            // Default empty or simple boilerplate if no snippet found
            if (newLang === 'python') setCode('# Write your code here\n');
            else if (newLang === 'java') setCode('public class Main {\n    public static void main(String[] args) {\n        \n    }\n}');
            else if (newLang === 'cpp') setCode('#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}');
            else setCode('');
        }
    };

    const handleSubmit = async (isRunOnly = false) => {
        setSubmitting(true);
        setResult(null);
        setActiveTab('console');
        try {
            const res = await api.post('/challenges/submit', {
                challengeId: id,
                language,
                code
            });
            setResult(res.data.data);
            if (res.data.data.result === 'Accepted') {
                toast.success("Correct Answer!");
            } else {
                toast.error(res.data.data.result || "Check execution details");
            }
        } catch (error) {
            toast.error("Execution failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-20 text-center animate-pulse">Initializing Environment...</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/50 backdrop-blur-sm z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="hover:bg-primary/10">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                    <div className="h-4 w-[1px] bg-border mx-2" />
                    <h2 className="text-lg font-bold tracking-tight truncate max-w-[300px]">{challenge.title}</h2>
                    <Badge variant="outline" className="hidden sm:flex font-bold uppercase tracking-widest text-[10px] bg-primary/5">
                        {challenge.difficulty}
                    </Badge>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={language}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        className="bg-muted text-sm border-none rounded-md px-3 py-1.5 focus:ring-1 focus:ring-primary outline-none font-medium cursor-pointer"
                    >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="cpp">C++</option>
                        <option value="java">Java</option>
                    </select>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSubmit(true)}
                        disabled={submitting}
                        className="gap-2 font-semibold"
                    >
                        <Play className="w-4 h-4" /> Run
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSubmit(false)}
                        disabled={submitting}
                        className="gap-2 font-bold px-6 shadow-lg shadow-primary/20"
                    >
                        {submitting ? 'Testing...' : <><Send className="w-4 h-4" /> Submit</>}
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Description & Console */}
                <div className="w-1/2 flex flex-col border-r border-border bg-card/30">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-4 border-b border-border bg-muted/20">
                            <TabsList className="bg-transparent h-12 gap-2">
                                <TabsTrigger value="description" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2">
                                    <Layout className="w-4 h-4" /> Description
                                </TabsTrigger>
                                <TabsTrigger value="console" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2">
                                    <Terminal className="w-4 h-4" /> Console
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="description" className="flex-1 overflow-y-auto p-8 m-0 space-y-6">
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                <h3 className="text-2xl font-bold text-foreground">Problem Statement</h3>
                                <p className="text-muted-foreground text-lg leading-relaxed whitespace-pre-wrap">
                                    {challenge.description}
                                </p>

                                {challenge.constraints && (
                                    <div className="mt-8">
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Constraints</h4>
                                        <div className="bg-muted/50 p-4 rounded-lg border border-border/50 font-mono text-sm">
                                            {challenge.constraints}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-8 space-y-6">
                                    <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Sample Test Cases</h4>
                                    {challenge.testCases?.filter((t: any) => t.isSample).map((test: any, i: number) => (
                                        <div key={i} className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border">
                                            <p className="text-xs font-bold text-muted-foreground uppercase">Example {i + 1}</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-muted-foreground mb-1">INPUT</p>
                                                    <pre className="p-3 bg-card rounded-md border border-border text-xs overflow-x-auto">{test.input}</pre>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-muted-foreground mb-1">OUTPUT</p>
                                                    <pre className="p-3 bg-card rounded-md border border-border text-xs overflow-x-auto">{test.output}</pre>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="console" className="flex-1 overflow-y-auto p-0 m-0 bg-slate-950/50">
                            {!result && !submitting ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 opacity-50">
                                    <Terminal className="w-12 h-12 mb-4" />
                                    <p className="text-sm font-medium">Run your code to see results here.</p>
                                </div>
                            ) : submitting ? (
                                <div className="h-full flex flex-col items-center justify-center p-8 space-y-4">
                                    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <p className="text-sm font-bold text-primary animate-pulse tracking-widest uppercase">Executing on Secure Judge...</p>
                                </div>
                            ) : (
                                <div className="p-8 space-y-6 animate-in slide-in-from-top-4 duration-500">
                                    <div className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-border">
                                        <div className="flex items-center gap-4">
                                            {result.result === 'Accepted' ? (
                                                <div className="p-2 bg-green-500/20 rounded-full">
                                                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                                                </div>
                                            ) : (
                                                <div className="p-2 bg-red-500/20 rounded-full">
                                                    <XCircle className="w-6 h-6 text-red-500" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-xs font-bold text-muted-foreground uppercase opacity-70">Status</p>
                                                <p className={`text-xl font-black ${result.result === 'Accepted' ? 'text-green-500' : 'text-red-500'}`}>
                                                    {result.result}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-end gap-1"><Clock className="w-3 h-3" /> Time</p>
                                                <p className="font-mono text-foreground font-bold">{result.execution.time || '0'} s</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-end gap-1"><Cpu className="w-3 h-3" /> Memory</p>
                                                <p className="font-mono text-foreground font-bold">{result.execution.memory || '0'} KB</p>
                                            </div>
                                        </div>
                                    </div>

                                    {(result.execution.stdout || result.execution.compile_output || result.execution.stderr) && (
                                        <div className="space-y-4">
                                            {result.execution.stdout && (
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Standard Output</p>
                                                    <pre className="p-4 bg-black rounded-xl border border-white/5 text-xs text-green-400 overflow-x-auto font-mono">{result.execution.stdout}</pre>
                                                </div>
                                            )}
                                            {result.execution.compile_output && (
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Compilation Output</p>
                                                    <pre className="p-4 bg-red-950/20 rounded-xl border border-red-500/20 text-xs text-red-400 overflow-x-auto font-mono">{result.execution.compile_output}</pre>
                                                </div>
                                            )}
                                            {result.execution.stderr && (
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Error Log</p>
                                                    <pre className="p-4 bg-red-950/20 rounded-xl border border-red-500/20 text-xs text-red-400 overflow-x-auto font-mono">{result.execution.stderr}</pre>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Panel: Editor */}
                <div className="flex-1 bg-background relative group">
                    <Editor
                        height="100%"
                        language={language}
                        value={code}
                        theme="vs-dark"
                        onChange={(value) => setCode(value || '')}
                        options={{
                            fontSize: 14,
                            minimap: { enabled: false },
                            padding: { top: 20 },
                            fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            cursorBlinking: "smooth",
                            smoothScrolling: true,
                            bracketPairColorization: { enabled: true }
                        }}
                    />
                    <div className="absolute bottom-6 right-8 opacity-20 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <Code2 className="w-12 h-12 text-primary" />
                    </div>
                </div>
            </div>
        </div>
    );
}
