const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const Challenge = require('../src/models/Challenge');

const DB_URI = process.env.SYSTEM_DB_URI;
if (!DB_URI) {
    console.error("SYSTEM_DB_URI not found in environment variables.");
    process.exit(1);
}

function decodeHtmlEntities(text) {
    if (!text) return "";
    return text.replace(/&quot;/g, '"')
               .replace(/&apos;/g, "'")
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&amp;/g, '&')
               .replace(/&#39;/g, "'")
               .replace(/<[^>]*>?/gm, '') // strip remaining tags
               .replace(/&nbsp;/g, ' ');
}

async function run() {
    await mongoose.connect(DB_URI);
    console.log("Connected to MongoDB.");

    const challenges = await Challenge.find({});
    console.log(`Found ${challenges.length} challenges.`);

    let updatedCount = 0;
    let deletedCount = 0;

    for (const challenge of challenges) {
        if (!challenge.description) continue;
        
        // --- 1. Identify Premium Problems ---
        if (challenge.description.includes("Solve the problem:") && challenge.description.includes("For more details, view it on LeetCode.")) {
            await Challenge.findByIdAndDelete(challenge._id);
            deletedCount++;
            continue;
        }

        const testCases = [];
        
        // --- 2. Try Standard Parser ---
        const standardRegex = /<strong>Input:<\/strong>\s*(.*?)\n.*?<strong>Output:<\/strong>\s*(.*?)(?:\n|<)/gs;
        let match;
        while ((match = standardRegex.exec(challenge.description)) !== null) {
            testCases.push({
                input: decodeHtmlEntities(match[1].trim()),
                output: decodeHtmlEntities(match[2].trim()),
                isSample: true
            });
        }
        
        // --- 3. Try Design Parser if Standard Failed ---
        if (testCases.length === 0) {
            const designRegex = /<strong>Input<\/strong>\s*\n(.*?)\n.*?<strong>Output<\/strong>\s*\n(.*?)(?:\n|<)/gs;
            while ((match = designRegex.exec(challenge.description)) !== null) {
                testCases.push({
                    input: decodeHtmlEntities(match[1].trim()),
                    output: decodeHtmlEntities(match[2].trim()),
                    isSample: true
                });
            }
        }
        
        if (testCases.length > 0) {
            challenge.testCases = testCases;
            await challenge.save();
            updatedCount++;
        }
    }

    console.log(`\n--- Script Summary ---`);
    console.log(`Successfully updated test cases for ${updatedCount} challenges.`);
    console.log(`Deleted ${deletedCount} Premium/Empty challenges from the database.`);
    process.exit(0);
}

run().catch(console.error);
