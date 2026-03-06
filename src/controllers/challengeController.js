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

const PISTON_LANGUAGE_MAP = {
    'javascript': { language: 'javascript', version: '18.15.0' },
    'python': { language: 'python', version: '3.10.0' },
    'java': { language: 'java', version: '15.0.2' },
    'cpp': { language: 'c++', version: '10.2.0' },
    'c': { language: 'c', version: '10.2.0' }
};

// --- Submissions & Execution (Piston Integration - Free) ---

exports.submitSolution = async (req, res, next) => {
    try {
        const { challengeId, language, code } = req.body;
        const studentId = req.user.id;

        const challenge = await Challenge.findById(challengeId);
        if (!challenge) {
            return next(new AppError('No challenge found with that ID', 404));
        }

        const langConfig = PISTON_LANGUAGE_MAP[language.toLowerCase()];
        if (!langConfig) {
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

        // 2. Prepare payload for Piston (No API Key required)
        const sampleTestCase = challenge.testCases ? challenge.testCases[0] : { input: "", output: "" };

        const pistonPayload = {
            language: langConfig.language,
            version: langConfig.version,
            files: [
                {
                    name: `solution.${language === 'cpp' ? 'cpp' : (language === 'java' ? 'java' : (language === 'python' ? 'py' : 'js'))}`,
                    content: code
                }
            ],
            stdin: sampleTestCase.input || ""
        };

        const response = await axios.post('https://emkc.org/api/v2/piston/execute', pistonPayload);
        const { run, compile } = response.data;

        // Piston results: run.stdout, run.stderr, run.code, run.signal, compile.output (if any)
        const stdout = run.stdout || "";
        const stderr = run.stderr || "";
        const compile_output = compile ? compile.output : null;

        // 3. Simple status logic (Piston doesn't do "Accepted" internally, we compare output)
        let finalStatus = 'Runtime Error';
        if (run.code === 0) {
            // Check if output matches expected (basic trim check for now)
            const expected = (sampleTestCase.output || "").trim();
            const actual = stdout.trim();

            if (expected === "" || actual === expected) {
                finalStatus = 'Accepted';
            } else {
                finalStatus = 'Wrong Answer';
            }
        } else if (compile && compile.code !== 0) {
            finalStatus = 'Compilation Error';
        }

        await Submission.update({ id: submission.id }, {
            status: finalStatus,
            executionResult: {
                stdout,
                stderr,
                compile_output,
                time: 0, // Piston doesn't provide time/memory in this format directly
                memory: 0,
                exit_code: run.code
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
                    compile_output,
                    code: run.code
                }
            }
        });
    } catch (error) {
        console.error("Piston Error:", error.response?.data || error.message);
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
