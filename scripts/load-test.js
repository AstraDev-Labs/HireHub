const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');

function parseArgs(argv) {
    const options = {
        url: 'http://127.0.0.1:5000/api',
        connections: 100,
        durationSeconds: 10,
        method: 'GET',
        headers: {},
    };

    if (argv[0] && !argv[0].startsWith('--')) {
        options.url = argv[0];
    }

    for (let i = 1; i < argv.length; i += 1) {
        const arg = argv[i];
        const next = argv[i + 1];

        if (arg === '--connections' && next) {
            options.connections = Number(next);
            i += 1;
        } else if (arg === '--duration' && next) {
            options.durationSeconds = Number(next);
            i += 1;
        } else if (arg === '--method' && next) {
            options.method = String(next).toUpperCase();
            i += 1;
        } else if (arg === '--header' && next) {
            const [name, ...valueParts] = next.split(':');
            if (name && valueParts.length > 0) {
                options.headers[name.trim()] = valueParts.join(':').trim();
            }
            i += 1;
        }
    }

    return options;
}

function percentile(sortedValues, p) {
    if (sortedValues.length === 0) {
        return 0;
    }

    const index = Math.min(sortedValues.length - 1, Math.floor((p / 100) * sortedValues.length));
    return sortedValues[index];
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    const targetUrl = new URL(options.url);
    const isHttps = targetUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    const agent = isHttps
        ? new https.Agent({ keepAlive: true, maxSockets: options.connections })
        : new http.Agent({ keepAlive: true, maxSockets: options.connections });

    const deadline = performance.now() + options.durationSeconds * 1000;
    const latencies = [];
    let started = 0;
    let completed = 0;
    let failed = 0;
    const statusCounts = new Map();

    async function fireOnce() {
        started += 1;
        const start = performance.now();

        return new Promise((resolve) => {
            const request = client.request({
                protocol: targetUrl.protocol,
                hostname: targetUrl.hostname,
                port: targetUrl.port,
                path: `${targetUrl.pathname}${targetUrl.search}`,
                method: options.method,
                headers: options.headers,
                agent,
            }, (response) => {
                response.on('data', () => {});
                response.on('end', () => {
                    const latency = performance.now() - start;
                    latencies.push(latency);
                    completed += 1;
                    statusCounts.set(response.statusCode, (statusCounts.get(response.statusCode) || 0) + 1);
                    resolve();
                });
            });

            request.on('error', () => {
                failed += 1;
                resolve();
            });

            request.end();
        });
    }

    async function worker() {
        while (performance.now() < deadline) {
            await fireOnce();
        }
    }

    const benchmarkStart = performance.now();
    await Promise.all(Array.from({ length: options.connections }, worker));
    const elapsedSeconds = Math.max((performance.now() - benchmarkStart) / 1000, 0.001);
    agent.destroy();

    latencies.sort((a, b) => a - b);

    const result = {
        url: options.url,
        method: options.method,
        connections: options.connections,
        durationSeconds: Number(elapsedSeconds.toFixed(2)),
        requestsStarted: started,
        requestsCompleted: completed,
        requestsFailed: failed,
        requestsPerSecond: Number((completed / elapsedSeconds).toFixed(2)),
        latencyMs: {
            p50: Number(percentile(latencies, 50).toFixed(2)),
            p95: Number(percentile(latencies, 95).toFixed(2)),
            p99: Number(percentile(latencies, 99).toFixed(2)),
            max: Number((latencies[latencies.length - 1] || 0).toFixed(2)),
        },
        statusCodes: Object.fromEntries(statusCounts),
    };

    console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
