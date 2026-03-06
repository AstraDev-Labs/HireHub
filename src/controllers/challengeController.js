const Challenge = require('../models/Challenge');
const Submission = require('../models/Submission');
const AppError = require('../utils/AppError');
const axios = require('axios');

// --- Challenges ---

exports.createChallenge = async (req, res, next) => {
    try {
        const { title, description, difficulty, topicTags, testCases, codeSnippets, constraints } = req.body;

        const challenge = await Challenge.create({
            title,
            description,
            difficulty,
            topicTags,
            testCases,
            codeSnippets,
            constraints,
            createdBy: req.user.id
        });

        res.status(201).json({
            status: 'success',
            data: { challenge }
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllChallenges = async (req, res, next) => {
    try {
        const challenges = await Challenge.scan().exec();
        res.status(200).json({
            status: 'success',
            results: challenges.length,
            data: { challenges }
        });
    } catch (error) {
        next(error);
    }
};

exports.getChallenge = async (req, res, next) => {
    try {
        const challenge = await Challenge.findById(req.params.id);
        if (!challenge) {
            return next(new AppError('No challenge found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { challenge }
        });
    } catch (error) {
        next(error);
    }
};

const REXTESTER_LANGUAGE_MAP = {
    'javascript': 17,
    'python': 24,
    'java': 4,
    'cpp': 7,
    'c': 28
};

// --- Submissions & Execution (Rextester Integration - Free & Stable) ---

exports.submitSolution = async (req, res, next) => {
    try {
        const { challengeId, language, code } = req.body;
        const studentId = req.user.id;

        const challenge = await Challenge.findById(challengeId);
        if (!challenge) {
            return next(new AppError('No challenge found with that ID', 404));
        }

        const rextesterLangId = REXTESTER_LANGUAGE_MAP[language.toLowerCase()];
        if (!rextesterLangId) {
            return next(new AppError('Unsupported language', 400));
        }

        // 1. Create a pending submission
        const submission = await Submission.create({
            challengeId,
            studentId,
            language,
            code,
            status: 'Pending'
        });

        // 2. Prepare payload for Rextester
        const sampleTestCase = challenge.testCases ? challenge.testCases[0] : { input: "", output: "" };

        const rextesterPayload = {
            LanguageChoice: rextesterLangId,
            Program: code,
            Input: sampleTestCase.input || ""
        };

        const response = await axios.post('https://rextester.com/rundotnet/api', rextesterPayload, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://rextester.com/'
            }
        });
        const { Result, Errors, Warnings, Stats } = response.data;

        // Rextester results: Result (stdout), Errors (stderr/compile_error)
        const stdout = Result || "";
        const stderr = Errors || "";

        // 3. Status logic
        let finalStatus = 'Runtime Error';
        if (!Errors || Errors.trim() === "") {
            // Check if output matches expected
            const expected = (sampleTestCase.output || "").trim();
            const actual = stdout.trim();

            if (expected === "" || actual === expected) {
                finalStatus = 'Accepted';
            } else {
                finalStatus = 'Wrong Answer';
            }
        } else {
            // Distinguish compile error from runtime if possible
            if (Errors.toLowerCase().includes('error') || Errors.toLowerCase().includes('compilation')) {
                finalStatus = 'Compilation Error';
            } else {
                finalStatus = 'Runtime Error';
            }
        }

        await Submission.update({ id: submission.id }, {
            status: finalStatus,
            executionResult: {
                stdout,
                stderr,
                stats: Stats,
                time: 0,
                memory: 0
            }
        });

        res.status(200).json({
            status: 'success',
            data: {
                submissionId: submission.id,
                result: finalStatus,
                execution: {
                    stdout,
                    stderr,
                    stats: Stats
                }
            }
        });
    } catch (error) {
        console.error("Rextester Error:", error.response?.data || error.message);
        next(new AppError('Error executing code. Please try again later.', 500));
    }
};

exports.getSubmissionStatus = async (req, res, next) => {
    try {
        const submission = await Submission.findById(req.params.id);
        if (!submission) {
            return next(new AppError('No submission found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { submission }
        });
    } catch (error) {
        next(error);
    }
};
