#!/usr/bin/env node
import { next, register } from "./extensions-api.js";
import { subscribe } from "./telemetry-api.js";
import { listen } from "./http-listener.js";
import AWS from "aws-sdk";

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const EventType = {
    INVOKE: 'INVOKE',
    SHUTDOWN: 'SHUTDOWN',
};

function handleShutdown(event) {
    console.log('shutdown', { event });
    process.exit(0);
}

function handleInvoke(event) {
    console.log('invoke');
}

const LOCAL_DEBUGGING_IP = "0.0.0.0";
const RECEIVER_NAME = "sandbox";

async function receiverAddress() {
    return (process.env.AWS_SAM_LOCAL === 'true')
        ? LOCAL_DEBUGGING_IP
        : RECEIVER_NAME;
}

// const BUCKET_NAME = process.env.LOGS_S3_BUCKET_NAME;
const BUCKET_NAME = 'lambda-extension-poc-s3-logs';
// const FUNCTION_NAME = process.env.AWS_LAMBDA_FUNCTION_NAME;
const FUNCTION_NAME = 'lambda-extension-s3-logs';

// Subscribe to platform logs and receive them on ${local_ip}:4243 via HTTP protocol.
const RECEIVER_PORT = 4243;
const TIMEOUT_MS = 1000 // Maximum time (in milliseconds) that a batch is buffered.
const MAX_BYTES = 262144 // Maximum size in bytes that the logs are buffered in memory.
const MAX_ITEMS = 10000 // Maximum number of events that are buffered in memory.

const SUBSCRIPTION_BODY = {
    "schemaVersion": "2022-07-01",
    "destination": {
        "protocol": "HTTP",
        "URI": `http://${RECEIVER_NAME}:${RECEIVER_PORT}`,
    },
    // "types": ["platform", "function"],
    "types": ["function"],
    "buffering": {
        "timeoutMs": TIMEOUT_MS,
        "maxBytes": MAX_BYTES,
        "maxItems": MAX_ITEMS
    }
};

(async function main() {
    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

    console.log('hello from logs api extension');

    console.log('register');
    const extensionId = await register();
    console.log('extensionId', extensionId);

    console.log('starting listener');
    // listen returns `logsQueue`, a mutable array that collects logs received from Logs API
    const { logsQueue, server } = listen(await receiverAddress(), RECEIVER_PORT);

    console.log('subscribing listener');
    // subscribing listener to the Logs API
    await subscribe(extensionId, SUBSCRIPTION_BODY, server);

    // function for processing collected logs
    async function uploadLogs() {
        while (logsQueue.length > 0) {
            console.log(`collected ${logsQueue.length} log objects`);
            if (BUCKET_NAME) {
                const date = (new Date()).toISOString().replace(/[^0-9]/gi, "-").substr(0, 23);
                const key = 'logs/' + FUNCTION_NAME + '/' + date + '.json';
                console.log("logs uploading: " + key);
                const params = { Bucket: BUCKET_NAME, Key: key };
                params.Body = JSON.stringify(logsQueue); // serialize log queue and add to S3 put request
                logsQueue.splice(0); // clear log queue
                params.ContentType = 'application/json; charset=utf-8';
                await s3.putObject(params).promise();
                console.log("logs sent: " + key);
            } else {
                // You can do something else with logs in logsQueue.
                logsQueue.splice(0); // clear log queue
            }
        }
    }

    // execute extensions logic
    while (true) {
        console.log('next');
        const event = await next(extensionId);

        switch (event.eventType) {
            case EventType.SHUTDOWN:
                await uploadLogs(); // upload remaining logs, during shutdown event
                handleShutdown(event);
                break;
            case EventType.INVOKE:
                handleInvoke(event);
                await uploadLogs(); // upload queued logs, during invoke event
                break;
            default:
                throw new Error('unknown event: ' + event.eventType);
        }
    }
})();