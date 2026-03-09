"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    ChevronLeft, Play, Send, Layout, Terminal, CheckCircle2, 
    XCircle, Clock, Cpu, Code2, Eye, History, User, Search, Edit
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { 
    Table, TableBody, TableCell, TableHead, 
    TableHeader, TableRow 
} from '@/components/ui/table';
import { format } from 'date-fns';

const decodeHTMLEntities = (text: string) => {
    if (typeof window === 'undefined') return text;
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
};

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
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { user } = useAuth();

    const fetchSubmissions = async () => {
        setLoadingSubmissions(true);
        try {
            const res = await api.get(`/challenges/${id}/submissions`);
            setSubmissions(res.data.data.submissions);
        } catch (error) {
            console.error("Failed to fetch submissions:", error);
            toast.error("Failed to load submissions");
        } finally {
            setLoadingSubmissions(false);
        }
    };

    useEffect(() => {
        const fetchChallenge = async () => {
            try {
                const res = await api.get(`/challenges/${id}`);
                const data = res.data.data.challenge;
                setChallenge(data);

                // Set initial code from snippet if available
                const snippet = data.codeSnippets?.find((s: any) => s.language === 'javascript');
                if (snippet) setCode(decodeHTMLEntities(snippet.code));

                // If staff/admin, fetch all submissions for this challenge
                if (user?.role === 'ADMIN' || user?.role === 'STAFF') {
                    fetchSubmissions();
                }
            } catch (error) {
                toast.error("Failed to load challenge");
                router.push('/challenges');
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchChallenge();
    }, [id, router, user]);

    const handleLanguageChange = (newLang: string) => {
        setLanguage(newLang);
        // Find snippet for new language
        const snippet = challenge.codeSnippets?.find((s: any) => s.language.toLowerCase() === newLang.toLowerCase());
        if (snippet) {
            setCode(decodeHTMLEntities(snippet.code));
        } else {
            // Default empty or simple boilerplate if no snippet found
            if (newLang === 'python') setCode('# Write your code here\n');
            else if (newLang === 'java') setCode('public class Main {\n    public static void main(String[] args) {\n        \n    }\n}');
            else if (newLang === 'cpp') setCode('#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}');
            else if (newLang === 'c') setCode('#include <stdio.h>\n\nint main() {\n    return 0;\n}');
            else setCode('');
        }
    };

    const handleSubmit = async (isRunOnly = false) => {
        if (user?.role === 'STAFF' || user?.role === 'ADMIN') {
            toast.error("Staff/Admin members cannot submit solutions.");
            return;
        }
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

    if (user?.role === 'STAFF' || user?.role === 'ADMIN') {
        const filteredSubmissions = submissions.filter(s => 
            s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.studentEmail.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
            <div className="flex flex-col h-[calc(100vh-64px)] bg-background">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push('/challenges')} className="hover:bg-primary/10">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Challenges
                        </Button>
                        <div className="h-6 w-[1px] bg-border mx-2" />
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">{challenge.title}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                                    {challenge.difficulty}
                                </Badge>
                                <span className="text-xs text-muted-foreground">• {submissions.length} Submissions</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => router.push(`/challenges/${id}/edit`)}
                            className="gap-2 font-semibold border-primary/20 hover:bg-primary/5 text-primary"
                        >
                            <Edit className="w-4 h-4" /> Edit Challenge
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    <Tabs defaultValue="submissions" className="h-full flex flex-col">
                        <div className="px-6 border-b border-border bg-muted/20">
                            <TabsList className="bg-transparent h-14 gap-6">
                                <TabsTrigger value="submissions" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 h-14 gap-2">
                                    <History className="w-4 h-4" /> Student Submissions
                                </TabsTrigger>
                                <TabsTrigger value="details" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 h-14 gap-2">
                                    <Layout className="w-4 h-4" /> Problem Details
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-hidden p-6">
                            <TabsContent value="submissions" className="h-full m-0 focus-visible:ring-0">
                                <div className="flex flex-col h-full gap-4">
                                    <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm">
                                        <div className="relative w-72">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input 
                                                placeholder="Search student or email..." 
                                                className="pl-9 bg-muted/50 border-none h-9 text-sm"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <Button variant="outline" size="sm" onClick={fetchSubmissions} disabled={loadingSubmissions}>
                                            <History className={`w-4 h-4 mr-2 ${loadingSubmissions ? 'animate-spin' : ''}`} />
                                            Refresh
                                        </Button>
                                    </div>

                                    <div className="flex-1 border border-border rounded-xl bg-card overflow-hidden shadow-sm flex">
                                        {/* Submissions List */}
                                        <div className="flex-1 overflow-y-auto border-r border-border">
                                            <Table>
                                                <TableHeader className="bg-muted/30 sticky top-0 z-10">
                                                    <TableRow>
                                                        <TableHead>Student</TableHead>
                                                        <TableHead>Language</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Submitted At</TableHead>
                                                        <TableHead className="text-right">Action</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {loadingSubmissions ? (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                                                <div className="flex flex-col items-center gap-2">
                                                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                                    <span>Loading submissions...</span>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : filteredSubmissions.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                                                No submissions found
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        filteredSubmissions.map((sub) => (
                                                            <TableRow key={sub.id} className={`cursor-pointer hover:bg-muted/20 ${selectedSubmission?.id === sub.id ? 'bg-primary/5' : ''}`} onClick={() => setSelectedSubmission(sub)}>
                                                                <TableCell>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold text-sm">{sub.studentName}</span>
                                                                        <span className="text-[10px] text-muted-foreground uppercase">{sub.studentEmail}</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest">{sub.language}</Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <span className={`text-xs font-bold ${sub.status === 'Accepted' ? 'text-green-500' : 'text-red-500'}`}>
                                                                        {sub.status}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="text-xs text-muted-foreground font-mono">
                                                                    {format(new Date(sub.createdAt), 'MMM d, HH:mm')}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                                                                        <Eye className="w-4 h-4" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Code Viewer */}
                                        <div className="w-1/2 bg-slate-950 flex flex-col">
                                            {selectedSubmission ? (
                                                <>
                                                    <div className="px-4 py-2 border-b border-white/10 bg-black/40 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <User className="w-4 h-4 text-primary" />
                                                            <span className="text-xs font-bold text-white uppercase tracking-widest">{selectedSubmission.studentName}'s Solution</span>
                                                        </div>
                                                        <Badge variant="outline" className="text-[10px] border-white/20 text-white/50">{selectedSubmission.language}</Badge>
                                                    </div>
                                                    <div className="flex-1 relative overflow-hidden">
                                                        <Editor
                                                            height="100%"
                                                            language={selectedSubmission.language.toLowerCase()}
                                                            value={selectedSubmission.code}
                                                            theme="vs-dark"
                                                            options={{
                                                                readOnly: true,
                                                                fontSize: 13,
                                                                minimap: { enabled: false },
                                                                padding: { top: 16, bottom: 16 },
                                                                fontFamily: "'Fira Code', monospace",
                                                                scrollBeyondLastLine: false,
                                                                automaticLayout: true,
                                                                lineNumbersMinChars: 3,
                                                            }}
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-white/20 p-8 text-center italic">
                                                    <Code2 className="w-16 h-16 mb-4 opacity-10" />
                                                    <p className="text-sm">Select a submission from the list to view the code</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="details" className="h-full m-0 overflow-y-auto focus-visible:ring-0">
                                <div className="max-w-4xl mx-auto space-y-8 py-4">
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-bold">Problem Statement</h3>
                                        <p className="text-muted-foreground text-lg leading-relaxed whitespace-pre-wrap">{challenge.description}</p>
                                    </div>

                                    {challenge.constraints && (
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Constraints</h4>
                                            <div className="p-4 bg-muted rounded-xl font-mono text-sm border border-border">{challenge.constraints}</div>
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Test Cases</h4>
                                        <div className="grid gap-4">
                                            {challenge.testCases?.map((test: any, i: number) => (
                                                <div key={i} className={`p-4 rounded-xl border ${test.isSample ? 'border-primary/20 bg-primary/5' : 'border-border bg-card'}`}>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-xs font-bold uppercase tracking-tighter opacity-70">
                                                            {test.isSample ? 'Sample Test Case' : `Test Case ${i + 1}`}
                                                        </span>
                                                        {test.isSample && <Badge className="text-[10px] uppercase">Public</Badge>}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Input</p>
                                                            <pre className="p-3 bg-black/5 dark:bg-black/40 rounded-lg text-xs font-mono border border-border/50">{test.input}</pre>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Expected Output</p>
                                                            <pre className="p-3 bg-black/5 dark:bg-black/40 rounded-lg text-xs font-mono border border-border/50">{test.output}</pre>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        );
    }

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
                        <option value="c">C</option>
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

                        <TabsContent value="console" className="flex-1 overflow-y-auto p-0 m-0 bg-slate-900 text-slate-100">
                            {!result && !submitting ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-200 p-8 opacity-80">
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
                                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-600 bg-slate-800 text-slate-50 shadow-lg shadow-black/30">
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



