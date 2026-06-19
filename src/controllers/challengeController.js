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
        const existingChallenges = await Challenge.find({ title });
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
        const challenges = await Challenge.find();
        let solvedCount = 0;

        let targetStudentUserId = null;
        if (req.user && req.user.role === 'STUDENT') {
            targetStudentUserId = req.user.id || req.user._id;
        } else if (req.user && req.user.role === 'PARENT' && req.user.linkedStudentId) {
            targetStudentUserId = req.user.linkedStudentId;
        }

        if (targetStudentUserId) {
            const studentSubmissions = await Submission.find({ studentId: targetStudentUserId });
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

        await Challenge.updateOne({ id }, updates);
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

const JUDGE0_LANGUAGE_MAP = {
    'javascript': 93,
    'python': 71,
    'java': 91,
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

        const judge0LanguageId = JUDGE0_LANGUAGE_MAP[language.toLowerCase()];
        if (!judge0LanguageId) {
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
                const judge0Payload = {
                    language_id: judge0LanguageId,
                    source_code: code,
                    stdin: tc.input || "",
                    expected_output: tc.output || ""
                };

                const judge0Url = process.env.JUDGE0_API_URL || 'http://localhost:2358';
                const response = await axios.post(`${judge0Url}/submissions/?base64_encoded=false&wait=true`, judge0Payload);
                const { status, stdout: jStdout, stderr: jStderr, compile_output } = response.data;
                const stdout = jStdout || "";
                const stderr = jStderr || compile_output || "";

                let tcStatus;
                if (status.id === 3) {
                    tcStatus = 'Accepted';
                } else if (status.id === 4) {
                    tcStatus = 'Wrong Answer';
                } else if (status.id === 6) {
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

        await Submission.updateOne({ id: submission.id }, {
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
                testResults: testResults
            }
        });
    } catch (error) {
        console.error("Judge0 Error:", error.response?.data || error.message);
        next(new AppError('Error executing code. Please ensure your Judge0 Docker container is running.', 500));
    }
};

exports.getSubmissionStatus = async (req, res, next) => {
    try {
        const submission = await Submission.findById(req.params.id);
        if (!submission) {
            return next(new AppError('No submission found with that ID', 404));
        }

        // IDOR Protection: Students can only view their own submissions
        if (req.user.role === 'STUDENT' && submission.studentId !== req.user._id && submission.studentId !== req.user.id) {
            return next(new AppError('You are not authorized to view this submission', 403));
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


