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

const WANDBOX_LANGUAGE_MAP = {
    'javascript': 'nodejs-20.17.0',
    'python': 'cpython-3.14.0',
    'java': 'openjdk-jdk-21.0.4+7',
    'cpp': 'gcc-head',
    'c': 'gcc-head-c'
};

// --- Submissions & Execution (Wandbox Integration - Free & Unblocked) ---

exports.submitSolution = async (req, res, next) => {
    try {
        const { challengeId, language, code } = req.body;
        const studentId = req.user.id;

        const challenge = await Challenge.findById(challengeId);
        if (!challenge) {
            return next(new AppError('No challenge found with that ID', 404));
        }

        const wandboxCompilerId = WANDBOX_LANGUAGE_MAP[language.toLowerCase()];
        if (!wandboxCompilerId) {
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

        // 2. Prepare payload for Wandbox
        const sampleTestCase = challenge.testCases ? challenge.testCases[0] : { input: "", output: "" };

        const wandboxPayload = {
            compiler: wandboxCompilerId,
            code: code,
            stdin: sampleTestCase.input || "",
            save: false
        };

        const response = await axios.post('https://wandbox.org/api/compile.json', wandboxPayload);
        const { status, program_output, compiler_error, program_error } = response.data;

        // Wandbox results: program_output (stdout), compiler_error/program_error (stderr)
        const stdout = program_output || "";
        const stderr = compiler_error || program_error || "";

        // 3. Status logic
        let finalStatus = 'Runtime Error';
        if (status === '0') {
            // Check if output matches expected
            const expected = (sampleTestCase.output || "").trim();
            const actual = stdout.trim();

            if (expected === "" || actual === expected) {
                finalStatus = 'Accepted';
            } else {
                finalStatus = 'Wrong Answer';
            }
        } else {
            // Distinguish compile error from runtime
            if (compiler_error) {
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
                    status_code: status
                }
            }
        });
    } catch (error) {
        console.error("Wandbox Error:", error.response?.data || error.message);
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
