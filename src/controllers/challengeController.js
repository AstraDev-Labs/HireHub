const Challenge = require('../models/Challenge');
const Submission = require('../models/Submission');
const AppError = require('../utils/AppError');
const axios = require('axios');
const { logAction } = require('../utils/auditLogger');

// --- Challenges ---

exports.createChallenge = async (req, res, next) => {
    try {
        const { title, description, difficulty, topicTags, testCases, codeSnippets, constraints } = req.body;

        // Check for existing challenge with same title
        const existingChallenges = await Challenge.scan().where('title').eq(title).exec();
        if (existingChallenges.length > 0) {
            return next(new AppError('A challenge with this title already exists.', 400));
        }

        const challenge = await Challenge.create({
            title,
            description,
            difficulty,
            topicTags,
            testCases,
            codeSnippets,
            constraints,
            createdBy: req.user._id || req.user.id
        });

        // Audit Logging
        await logAction(req, 'CREATE', 'Challenge', challenge.id, `Created challenge: ${title}`);

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
        let solvedCount = 0;

        // If user is a student, calculate how many unique challenges they've solved
        if (req.user && req.user.role === 'STUDENT') {
            const studentSubmissions = await Submission.query('studentId').eq(req.user.id).using('StudentSubmissionIndex').exec();
            const solvedChallengeIds = new Set(
                studentSubmissions
                    .filter(sub => sub.status === 'Accepted')
                    .map(sub => sub.challengeId)
            );
            solvedCount = solvedChallengeIds.size;
        }

        res.status(200).json({
            status: 'success',
            results: challenges.length,
            data: { 
                challenges,
                solvedCount 
            }
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

exports.updateChallenge = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, difficulty, topicTags, testCases, codeSnippets, constraints } = req.body;

        const challenge = await Challenge.findById(id);
        if (!challenge) {
            return next(new AppError('No challenge found with that ID', 404));
        }

        const updates = {
            title,
            description,
            difficulty,
            topicTags,
            testCases,
            codeSnippets,
            constraints
        };

        // Remove undefined fields
        Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

        await Challenge.update({ id }, updates);
        const updatedChallenge = await Challenge.findById(id);

        // Audit Logging
        await logAction(req, 'UPDATE', 'Challenge', id, `Updated challenge: ${updatedChallenge.title}`);

        res.status(200).json({
            status: 'success',
            data: { challenge: updatedChallenge }
        });
    } catch (error) {
        next(error);
    }
};

const WANDBOX_LANGUAGE_MAP = {
    'javascript': 'nodejs-20.17.0',
    'python': 'cpython-3.14.0',
    'java': 'openjdk-jdk-21+35',
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

        // 2. Run all test cases
        const testResults = [];
        let finalStatus = 'Accepted';
        const testCasesToRun = challenge.testCases || [];

        if (testCasesToRun.length === 0) {
            finalStatus = 'Accepted'; // Default if no test cases
        } else {
            for (let i = 0; i < testCasesToRun.length; i++) {
                const tc = testCasesToRun[i];
                const wandboxPayload = {
                    compiler: wandboxCompilerId,
                    code: code,
                    stdin: tc.input || "",
                    save: false
                };

                const response = await axios.post('https://wandbox.org/api/compile.json', wandboxPayload);
                const { status, program_output, compiler_error, program_error } = response.data;
                const stdout = program_output || "";
                const stderr = compiler_error || program_error || "";

                let tcStatus;
                if (status === '0') {
                    const expected = (tc.output || "").trim();
                    const actual = stdout.trim();
                    if (expected === "" || actual === expected) {
                        tcStatus = 'Accepted';
                    } else {
                        tcStatus = 'Wrong Answer';
                    }
                } else if (compiler_error) {
                    tcStatus = 'Compilation Error';
                } else {
                    tcStatus = 'Runtime Error';
                }

                testResults.push({
                    testCaseIndex: i,
                    status: tcStatus,
                    stdout,
                    stderr,
                    isSample: tc.isSample
                });

                if (tcStatus !== 'Accepted') {
                    finalStatus = tcStatus;
                    // For now, we stop at the first failing test case
                    break;
                }
            }
        }

        const lastResult = testResults[testResults.length - 1] || { stdout: "", stderr: "" };

        await Submission.update({ id: submission.id }, {
            status: finalStatus,
            executionResult: {
                stdout: lastResult.stdout,
                stderr: lastResult.stderr,
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
                    stdout: lastResult.stdout,
                    stderr: lastResult.stderr,
                    status_code: finalStatus === 'Accepted' ? '0' : '1'
                },
                testResults: testResults // Return results for all run test cases
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

exports.getChallengeSubmissions = async (req, res, next) => {
    try {
        const { id } = req.params;
        const submissions = await Submission.findAll({ challengeId: id });
        
        const Student = require('../models/Student');
        const results = await Promise.all(submissions.map(async (s) => {
            const student = await Student.findByUserId(s.studentId);
            const subObj = typeof s.toJSON === 'function' ? s.toJSON() : s;
            return {
                ...subObj,
                studentName: student?.name || 'Unknown Student',
                studentEmail: student?.email || 'Unknown Email'
            };
        }));

        res.status(200).json({
            status: 'success',
            results: results.length,
            data: { submissions: results }
        });
    } catch (error) {
        next(error);
    }
};

