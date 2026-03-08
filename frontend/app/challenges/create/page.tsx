"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Plus, Save, Trash2, Layout, Terminal, Type, Layers, Code } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CreateChallengePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        difficulty: 'Easy',
        topicTags: [] as string[],
        constraints: '',
        testCases: [{ input: '', output: '', isSample: true }],
        codeSnippets: [
            { language: 'javascript', code: '// Write your JavaScript starter code here\n' },
            { language: 'python', code: '# Write your Python starter code here\n' },
            { language: 'java', code: 'public class Main {\n    public static void main(String[] args) {\n        \n    }\n}' },
            { language: 'cpp', code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}' },
            { language: 'c', code: '#include <stdio.h>\n\nint main() {\n    return 0;\n}' }
        ]
    });

    const [currentTag, setCurrentTag] = useState('');

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && currentTag.trim()) {
            e.preventDefault();
            if (!formData.topicTags.includes(currentTag.trim())) {
                setFormData({ ...formData, topicTags: [...formData.topicTags, currentTag.trim()] });
            }
            setCurrentTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData({ ...formData, topicTags: formData.topicTags.filter(t => t !== tagToRemove) });
    };

    const addTestCase = () => {
        setFormData({
            ...formData,
            testCases: [...formData.testCases, { input: '', output: '', isSample: false }]
        });
    };

    const removeTestCase = (index: number) => {
        const newTestCases = [...formData.testCases];
        newTestCases.splice(index, 1);
        setFormData({ ...formData, testCases: newTestCases });
    };

    const updateTestCase = (index: number, field: string, value: string | boolean) => {
        const newTestCases = [...formData.testCases];
        newTestCases[index] = { ...newTestCases[index], [field]: value };
        setFormData({ ...formData, testCases: newTestCases });
    };

    const updateSnippet = (language: string, code: string) => {
        const newSnippets = formData.codeSnippets.map(s => 
            s.language === language ? { ...s, code } : s
        );
        setFormData({ ...formData, codeSnippets: newSnippets });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.description) {
            toast.error("Please fill in title and description");
            return;
        }

        setLoading(true);
        try {
            await api.post('/challenges', formData);
            toast.success("Challenge created successfully!");
            router.push('/challenges');
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create challenge");
        } finally {
            setLoading(false);
        }
    };

    if (user && user.role !== 'ADMIN' && user.role !== 'STAFF') {
        router.push('/challenges');
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Plus className="w-8 h-8 text-primary" /> Create New Challenge
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="border-border shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Type className="w-5 h-5" /> Problem Basics</CardTitle>
                                <CardDescription>Define the title and main description of the coding problem.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Title</label>
                                    <Input
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. Two Sum, Reverse String"
                                        className="text-lg font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Description</label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Detailed problem statement..."
                                        className="min-h-[200px] leading-relaxed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Constraints</label>
                                    <Textarea
                                        value={formData.constraints}
                                        onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
                                        placeholder="e.g. 1 <= n <= 10^5"
                                        className="font-mono text-sm"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Test Cases */}
                        <Card className="border-border shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2"><Terminal className="w-5 h-5" /> Test Cases</CardTitle>
                                    <CardDescription>Define input/output pairs for validation.</CardDescription>
                                </div>
                                <Button type="button" onClick={addTestCase} size="sm" variant="outline" className="gap-2">
                                    <Plus className="w-4 h-4" /> Add Test Case
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {formData.testCases.map((tc, index) => (
                                    <div key={index} className="p-4 bg-muted/30 rounded-xl border border-border relative group">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Test Case #{index + 1}</span>
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={tc.isSample}
                                                        onChange={(e) => updateTestCase(index, 'isSample', e.target.checked)}
                                                        className="rounded border-border text-primary focus:ring-primary"
                                                    />
                                                    Sample Test Case (Visible to students)
                                                </label>
                                                {formData.testCases.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeTestCase(index)}
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase">Input</label>
                                                <Textarea
                                                    value={tc.input}
                                                    onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                                                    className="font-mono text-xs h-24"
                                                    placeholder="Input values..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase">Expected Output</label>
                                                <Textarea
                                                    value={tc.output}
                                                    onChange={(e) => updateTestCase(index, 'output', e.target.value)}
                                                    className="font-mono text-xs h-24"
                                                    placeholder="Expected results..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Boilerplate Snippets */}
                        <Card className="border-border shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Code className="w-5 h-5" /> Starter Code (Boilerplate)</CardTitle>
                                <CardDescription>Provide the initial code students will see for each language.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="javascript" className="w-full">
                                    <TabsList className="grid grid-cols-5 mb-4">
                                        <TabsTrigger value="javascript" className="text-xs">JS</TabsTrigger>
                                        <TabsTrigger value="python" className="text-xs">PY</TabsTrigger>
                                        <TabsTrigger value="java" className="text-xs">JAVA</TabsTrigger>
                                        <TabsTrigger value="cpp" className="text-xs">C++</TabsTrigger>
                                        <TabsTrigger value="c" className="text-xs">C</TabsTrigger>
                                    </TabsList>
                                    {formData.codeSnippets.map((snippet, index) => (
                                        <TabsContent key={`${snippet.language}-${index}`} value={snippet.language} className="mt-0">
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase mb-1">
                                                    <span>{snippet.language} Boilerplate</span>
                                                    <span className="text-primary/50 italic select-none">Monaco Editor styled</span>
                                                </div>
                                                <div className="relative border border-border rounded-lg overflow-hidden">
                                                    <Textarea
                                                        value={snippet.code}
                                                        onChange={(e) => updateSnippet(snippet.language, e.target.value)}
                                                        className="font-mono text-sm min-h-[250px] border-none focus-visible:ring-0 bg-slate-950 text-slate-100 p-4 resize-none"
                                                        placeholder={`Enter starter ${snippet.language} code...`}
                                                    />
                                                </div>
                                            </div>
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Metadata Side Panel */}
                    <div className="space-y-8">
                        <Card className="border-border shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Layers className="w-5 h-5" /> Settings</CardTitle>
                                <CardDescription>Configure difficulty and categorization.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Difficulty</label>
                                    <select
                                        value={formData.difficulty}
                                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                        className="w-full bg-muted border-none rounded-md px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                                    >
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Topic Tags</label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {formData.topicTags.map(tag => (
                                            <Badge key={tag} className="gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-all">
                                                {tag}
                                                <Trash2
                                                    className="w-3 h-3 cursor-pointer opacity-70 hover:opacity-100"
                                                    onClick={() => removeTag(tag)}
                                                />
                                            </Badge>
                                        ))}
                                    </div>
                                    <Input
                                        value={currentTag}
                                        onChange={(e) => setCurrentTag(e.target.value)}
                                        onKeyDown={handleAddTag}
                                        placeholder="Add tag and press Enter..."
                                        className="text-sm"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Press Enter after typing a tag to add it.</p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="sticky top-8">
                            <Button
                                type="submit"
                                size="lg"
                                disabled={loading}
                                className="w-full h-16 text-lg font-bold gap-3 shadow-xl shadow-primary/20"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Publishing...
                                    </div>
                                ) : (
                                    <><Save className="w-6 h-6" /> Publish Challenge</>
                                )}
                            </Button>
                            <p className="text-xs text-center text-muted-foreground mt-4">This challenge will be immediately available to all students.</p>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
