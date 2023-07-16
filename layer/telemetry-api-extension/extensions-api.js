import fetch from 'node-fetch';

const baseUrl = `http://${process.env.AWS_LAMBDA_RUNTIME_API}/2020-01-01/extension`;
const lambdaExtensionName = 'telemetry-api-extension';

export const register = async () => {
    const res = await fetch(`${baseUrl}/register`, {
        method: 'post',
        body: JSON.stringify({
            'events': [
                'INVOKE',
                'SHUTDOWN'
            ],
        }),
        headers: {
            'Content-Type': 'application/json',
            // The extension name must match the file name of the extension itself that's in /opt/extensions/
            // In this case that's: telemetry-api-extension
            // 'Lambda-Extension-Name': basename(__dirname),
            'Lambda-Extension-Name': lambdaExtensionName,
        }
    });

    if (!res.ok) {
        console.error('register failed', await res.text());
    }

    return res.headers.get('lambda-extension-identifier');
};

export const next = async extensionId => {
    const res = await fetch(`${baseUrl}/event/next`, {
        method: 'get',
        headers: {
            'Content-Type': 'application/json',
            'Lambda-Extension-Identifier': extensionId,
        }
    });

    if (!res.ok) {
        console.error('next failed', await res.text());
        return null;
    }

    return await res.json();
};
