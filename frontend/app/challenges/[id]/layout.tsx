import { Metadata, ResolvingMetadata } from 'next';

async function getChallenge(id: string) {
    try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${backendUrl}/challenges/${id}`, { next: { revalidate: 3600 } });
        if (!res.ok) return null;
        const data = await res.json();
        return data.data.challenge;
    } catch (error) {
        return null;
    }
}

export async function generateMetadata(
    { params }: { params: { id: string } },
    parent: ResolvingMetadata
): Promise<Metadata> {
    const challenge = await getChallenge(params.id);

    if (!challenge) {
        return { title: 'Challenge Not Found' };
    }

    const previousImages = (await parent).openGraph?.images || [];

    return {
        title: `${challenge.title} | Developer Challenge`,
        description: `Solve the ${challenge.title} coding challenge on HireHub. Difficulty: ${challenge.difficulty}. Topics: ${challenge.topicTags?.join(', ') || 'General'}.`,
        keywords: [...(challenge.topicTags || []), 'coding challenge', 'interview preparation', 'algorithms', challenge.difficulty],
        openGraph: {
            title: `Solve ${challenge.title} on HireHub`,
            description: `A ${challenge.difficulty} level coding problem covering ${challenge.topicTags?.join(', ') || 'various algorithms'}. Test your skills now.`,
            type: 'article',
            images: [...previousImages],
        },
    };
}

export default async function ChallengeLayout({ children, params }: { children: React.ReactNode, params: { id: string } }) {
    const challenge = await getChallenge(params.id);

    if (!challenge) {
        return <>{children}</>;
    }

    // Structured Data for Educational/Programming problem
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        name: challenge.title,
        description: `A ${challenge.difficulty} level programming challenge.`,
        learningResourceType: 'Practice Problem',
        educationalLevel: challenge.difficulty === 'Hard' ? 'Advanced' : challenge.difficulty === 'Medium' ? 'Intermediate' : 'Beginner',
        about: challenge.topicTags?.map((tag: string) => ({
            '@type': 'Thing',
            name: tag
        })) || []
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {children}
        </>
    );
}
