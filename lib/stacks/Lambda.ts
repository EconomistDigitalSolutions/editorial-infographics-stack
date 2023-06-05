import { Construct } from 'constructs';
import {
  Stack, StackProps, Duration, CfnOutput,
} from 'aws-cdk-lib';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';

interface LambdaStackProps extends StackProps {
  functionName: string;
  handler: string;
  codePath: string;
  s3Trigger: lambdaEventSources.S3EventSource;
}

class LambdaStack extends Stack {
  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const lambdaFunction = new Function(this, props.functionName, {
      functionName: props.functionName,
      runtime: Runtime.NODEJS_14_X,
      handler: props.handler,
      code: Code.fromAsset(props.codePath), // TODO: potentially hardcode?
      timeout: Duration.seconds(30),
    });

    if (props.s3Trigger) lambdaFunction.addEventSource(props.s3Trigger);

    new CfnOutput(this, `${props.functionName}-output-function-arn`, {
      value: lambdaFunction.functionArn,
    });
  }
}

export default LambdaStack;
