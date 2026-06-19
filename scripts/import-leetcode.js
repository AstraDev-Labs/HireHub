const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const Challenge = require('../src/models/Challenge');

const DB_URI = process.env.SYSTEM_DB_URI;
if (!DB_URI) {
    console.error("SYSTEM_DB_URI not found in environment variables.");
    process.exit(1);
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, retries = 5, backoff = 5000) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url);
            if (res.status === 429) {
                console.log(`⚠️ Rate limited on ${url}. Retrying in ${backoff/1000}s...`);
                await delay(backoff);
                backoff *= 2; // Exponential backoff
                continue;
            }
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.log(`⚠️ Network/Fetch error on ${url}: ${err.message}. Retrying in ${backoff/1000}s...`);
            await delay(backoff);
            backoff *= 2;
        }
    }
    throw new Error('Max retries reached');
}

async function importLeetCodeQuestions() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(DB_URI);
        console.log("✅ Connected to database");

        let importedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        const TOTAL_TO_FETCH = 2000;
        const BATCH_SIZE = 100;

        for (let skip = 500; skip < TOTAL_TO_FETCH; skip += BATCH_SIZE) {
            console.log(`\n📦 Fetching batch: skip=${skip}, limit=${BATCH_SIZE}`);
            
            let listData;
            try {
                listData = await fetchWithRetry(`https://alfa-leetcode-api.onrender.com/problems?limit=${BATCH_SIZE}&skip=${skip}`);
            } catch (err) {
                console.error(`❌ Failed to fetch batch ${skip}:`, err.message);
                break;
            }

            const problems = listData.problemsetQuestionList || [];
            if (problems.length === 0) break;

            for (let i = 0; i < problems.length; i++) {
                const p = problems[i];
                const globalIndex = skip + i + 1;
                
                const existing = await Challenge.findOne({ title: p.title });
                if (existing) {
                    console.log(`[${globalIndex}/${TOTAL_TO_FETCH}] ⏭️ Skipped: ${p.title}`);
                    skippedCount++;
                    continue;
                }

                try {
                    // Fetch full description with retry
                    const detailData = await fetchWithRetry(`https://alfa-leetcode-api.onrender.com/select?titleSlug=${p.titleSlug}`);
                    
                    let description = detailData?.question || `<p>Solve the problem: ${p.title}. For more details, view it on LeetCode.</p>`;

                    const tags = p.topicTags ? p.topicTags.map(t => t.name) : [];

                    const newChallenge = new Challenge({
                        title: p.title,
                        description: description,
                        difficulty: p.difficulty,
                        topicTags: tags,
                        createdBy: 'system_importer',
                        testCases: [],
                        codeSnippets: []
                    });

                    await newChallenge.save();
                    importedCount++;
                    console.log(`[${globalIndex}/${TOTAL_TO_FETCH}] ✅ Imported: ${p.title} (${p.difficulty})`);

                } catch (err) {
                    console.error(`[${globalIndex}/${TOTAL_TO_FETCH}] ❌ Error importing ${p.title}:`, err.message);
                    errorCount++;
                }

                // Add significant delay to avoid 429
                await delay(2000); 
            }
        }

        console.log("\n--- Import Summary ---");
        console.log(`Total Attempted: ${TOTAL_TO_FETCH}`);
        console.log(`Successfully Imported: ${importedCount}`);
        console.log(`Skipped (Already Existed): ${skippedCount}`);
        console.log(`Errors/Rate Limits: ${errorCount}`);
        console.log("----------------------\n");

        process.exit(0);
    } catch (error) {
        console.error("Fatal Error during import:", error);
        process.exit(1);
    }
}

importLeetCodeQuestions();
