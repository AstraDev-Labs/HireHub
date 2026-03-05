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

const LANGUAGE_MAP = {
    'javascript': 63,
    'python': 71,
    'java': 62,
    'cpp': 54,
    'c': 50
};

// --- Submissions & Execution (Judge0 Integration) ---

exports.submitSolution = async (req, res, next) => {
    try {
        const { challengeId, language, code } = req.body;
        const studentId = req.user.id;

        const challenge = await Challenge.findById(challengeId);
        if (!challenge) {
            return next(new AppError('No challenge found with that ID', 404));
        }

        const languageId = LANGUAGE_MAP[language.toLowerCase()];
        if (!languageId) {
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

        // 2. Prepare payload for Judge0
        // We use the first test case for now (simplification for MVP)
        const sampleTestCase = challenge.testCases ? challenge.testCases[0] : { input: "", output: "" };

        const options = {
            method: 'POST',
            url: `https://${process.env.JUDGE0_API_HOST}/submissions`,
            params: { base64_encoded: 'false', wait: 'true' },
            headers: {
                'content-type': 'application/json',
                'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
                'X-RapidAPI-Host': process.env.JUDGE0_API_HOST
            },
            data: {
                source_code: code,
                language_id: languageId,
                stdin: sampleTestCase.input,
                expected_output: sampleTestCase.output
            }
        };

        const response = await axios.request(options);
        const { status, stdout, stderr, compile_output, time, memory } = response.data;

        // 3. Update submission with results
        let finalStatus = 'Pending';
        if (status.id === 3) finalStatus = 'Accepted';
        else if (status.id === 4) finalStatus = 'Wrong Answer';
        else if (status.id === 5) finalStatus = 'Time Limit Exceeded';
        else if (status.id === 6) finalStatus = 'Compilation Error';
        else finalStatus = 'Runtime Error';

        await Submission.update({ id: submission.id }, {
            status: finalStatus,
            executionResult: {
                stdout,
                stderr,
                compile_output,
                time: parseFloat(time),
                memory: parseFloat(memory),
                status_id: status.id
            }
        });

        res.status(200).json({
            status: 'success',
            data: {
                submissionId: submission.id,
                result: finalStatus,
                execution: response.data
            }
        });
    } catch (error) {
        console.error("Judge0 Error:", error.response?.data || error.message);
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
