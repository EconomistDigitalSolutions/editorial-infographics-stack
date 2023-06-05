import { Construct } from 'constructs';
import {
  Stack, StackProps, Duration, CfnOutput,
} from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface LambdaStackProps extends StackProps {
  functionName: string;
  entry: string;
  s3Trigger: lambdaEventSources.S3EventSource;
}

class LambdaStack extends Stack {
  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const lambdaFunction = new NodejsFunction(this, props.functionName, {
      functionName: props.functionName,
      runtime: Runtime.NODEJS_14_X,
      entry: props.entry,
      handler: 'default',
      timeout: Duration.seconds(30),
      projectRoot: '.',
    });

    if (props.s3Trigger) lambdaFunction.addEventSource(props.s3Trigger);

    new CfnOutput(this, `${props.functionName}-output-function-arn`, {
      value: lambdaFunction.functionArn,
    });
  }
}

export default LambdaStack;
