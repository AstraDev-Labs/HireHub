const adminController = require('./adminController');

jest.mock('../utils/catchAsync', () => {
    return (fn) => {
        return (req, res, next) => {
            return fn(req, res, next).catch(next);
        };
    };
});

jest.mock('../models/AuditLog', () => ({
    findAll: jest.fn(),
    scan: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    exec: jest.fn()
}));

const AuditLog = require('../models/AuditLog');

describe('Admin Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            query: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('getAuditLogs', () => {
        it('should fetch audit logs and return them sorted by timestamp descending', async () => {
            const mockLogs = [
                { id: '1', timestamp: '2023-10-01T10:00:00Z', details: 'Older' },
                { id: '2', timestamp: '2023-10-01T12:00:00Z', details: 'Newer' },
                { id: '3', timestamp: '2023-10-01T11:00:00Z', details: 'Middle' }
            ];

            AuditLog.findAll.mockResolvedValue(mockLogs);

            await adminController.getAuditLogs(req, res, next);

            expect(AuditLog.findAll).toHaveBeenCalledWith(req.query);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                results: 3,
                data: {
                    logs: [
                        { id: '2', timestamp: '2023-10-01T12:00:00Z', details: 'Newer' },
                        { id: '3', timestamp: '2023-10-01T11:00:00Z', details: 'Middle' },
                        { id: '1', timestamp: '2023-10-01T10:00:00Z', details: 'Older' }
                    ]
                }
            });
        });

        it('should pass error to next if AuditLog.findAll fails', async () => {
            const error = new Error('Database error');
            AuditLog.findAll.mockRejectedValue(error);

            await adminController.getAuditLogs(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });
});
