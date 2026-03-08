"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Code2, ChevronRight, Trophy, Zap, CheckCircle2, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { useMemo } from 'react';

export default function ChallengesPage() {
    const { user } = useAuth();
    const [challenges, setChallenges] = useState([]);
    const [solvedCount, setSolvedCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    useEffect(() => {
        const fetchChallenges = async () => {
            try {
                const res = await api.get('/challenges');
                setChallenges(res.data.data.challenges);
                setSolvedCount(res.data.data.solvedCount || 0);
            } catch (error) {
                console.error("Failed to fetch challenges", error);
            } finally {
                setLoading(false);
            }
        };
        fetchChallenges();
    }, []);

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Easy': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'Medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'Hard': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    const filteredChallenges = useMemo(() => {
        return challenges.filter((challenge: any) => 
            challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            challenge.difficulty.toLowerCase().includes(searchQuery.toLowerCase()) ||
            challenge.topicTags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [challenges, searchQuery]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground font-medium animate-pulse text-lg">Loading challenges...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-10 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                        <Code2 className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                        Coding Challenges
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-lg">
                        Master your skills with LeetCode-style practice problems.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                        <Button
                            onClick={() => router.push('/challenges/create')}
                            className="bg-primary hover:bg-primary/90 text-white font-bold px-6 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                            <Zap className="w-5 h-5 fill-white" />
                            Create Challenge
                        </Button>
                    )}
                    {user?.role === 'STUDENT' && (
                        <Card className="bg-primary/5 border-primary/10 px-4 py-2 md:px-6 md:py-3 flex items-center gap-3 w-full sm:w-auto">
                            <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                            <div>
                                <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground">Programs Completed</p>
                                <p className="text-lg md:text-xl font-bold">{solvedCount}</p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            <div className="mb-8 relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by title, difficulty, or tags..." 
                    className="pl-10 h-12 bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                {filteredChallenges.map((challenge: any) => (
                    <Card
                        key={challenge.id}
                        className="group relative overflow-hidden border-border hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer bg-card/50 backdrop-blur-sm"
                        onClick={() => router.push(`/challenges/${challenge.id}`)}
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Code2 className="w-20 h-20 rotate-12" />
                        </div>

                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start mb-2">
                                <Badge className={`${getDifficultyColor(challenge.difficulty)} border font-semibold px-3 py-0.5 rounded-full`}>
                                    {challenge.difficulty}
                                </Badge>
                                <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500 opacity-50" />
                            </div>
                            <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">{challenge.title}</CardTitle>
                        </CardHeader>

                        <CardContent className="pb-6">
                            <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed mb-4">
                                {challenge.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {challenge.topicTags?.map((tag: string) => (
                                    <span key={tag} className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </CardContent>

                        <CardFooter className="pt-0 flex justify-between items-center bg-muted/30 py-4 px-6 border-t border-border/50 group-hover:bg-primary/5 transition-colors">
                            <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Practice Now</span>
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {filteredChallenges.length === 0 && (
                <div className="text-center py-20 bg-muted/20 border-2 border-dashed border-border rounded-2xl animate-in zoom-in-95 duration-500">
                    <Code2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-foreground">No matches found</h3>
                    <p className="text-muted-foreground mt-2">Try adjusting your search terms.</p>
                </div>
            )}
        </div>
    );
}
