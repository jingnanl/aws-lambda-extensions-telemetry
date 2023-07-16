import * as cdk from 'aws-cdk-lib';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Architecture, Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class LambdaExtensionS3LogsStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Creating Lambda Layer
        const layer = new LayerVersion(this, 'S3LogsLayer', {
            compatibleRuntimes: [Runtime.NODEJS_18_X],
            compatibleArchitectures: [Architecture.X86_64],
            code: Code.fromAsset('./layer')
        });

        // Creating Lambda function
        const lambda = new NodejsFunction(this, 'LambdaExtensionPOC', {
            entry: './lambda/handler.ts',
            handler: 'handler',
            runtime: Runtime.NODEJS_18_X,
            environment: {
                REGION: 'us-east-1'
            },
            timeout: cdk.Duration.seconds(15),
            memorySize: 128,
            bundling: {
                sourceMap: true,
                externalModules: [
                    'aws-sdk'
                ]
            },
            layers: [
                layer
            ]
        });

        // Adding IAM permissions
        lambda.addToRolePolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: [
                    's3:*'
                ],
                resources: ['*']
            })
        );
    }
}
