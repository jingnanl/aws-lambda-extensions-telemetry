# AWS Lambda Extensions Demo with Telemetry API

This project is a demo of Lambda Extensions with Telemetry API.

From [AWS Lambda docs](https://docs.aws.amazon.com/lambda/latest/dg/telemetry-api.html)
> Using the Lambda Telemetry API, your extensions can directly receive telemetry data from Lambda. During function initialization and invocation, Lambda automatically captures telemetry, such as logs, platform metrics, and platform traces. With Telemetry API, extensions can get this telemetry data directly from Lambda in near real time.
> 
> You can subscribe your Lambda extensions to telemetry streams directly from within the Lambda execution environment. After subscribing, Lambda automatically streams all telemetry data to your extensions. You can then process, filter, and deliver that data to your preferred destination, such as an Amazon Simple Storage Service (Amazon S3) bucket or a third-party observability tools provider.

**Main Steps**
1. Register your extension using the Lambda Extensions API. This provides you with a Lambda-Extension-Identifier, which you'll need in the following steps. --> *extensions-api.js*

1. Create a telemetry listener. This can be a basic HTTP or TCP server. Lambda uses the URI of the telemetry listener to send telemetry data to your extension. --> *http-listener.js*

1. Using the Subscribe API in the Telemetry API, subscribe your extension to your desired telemetry streams. You'll need the URI of your telemetry listener for this step. --> *telemetry-api.js*

1. Get telemetry data from Lambda via the telemetry listener. You can do any custom processing of this data, such as dispatching the data to Amazon S3 or to an external observability service. --> *telemetry-api-extension/index.js*

Code references: [aws-samples/aws-lambda-extensions](https://github.com/aws-samples/aws-lambda-extensions/tree/main/nodejs-example-logs-api-extension/nodejs-example-logs-api-extension)

#### Development and Deploy

The `cdk.json` file tells the CDK Toolkit how to execute your app.

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
