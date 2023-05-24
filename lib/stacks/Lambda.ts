import { Construct } from 'constructs';
import {
  Stack, StackProps, Duration, CfnOutput,
} from 'aws-cdk-lib';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';

interface LambdaStackProps extends StackProps {
  functionName: string;
  handler: string;
  codePath: string;
}

class LambdaStack extends Stack {
  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const lambdaFunction = new Function(this, props.functionName, {
      functionName: props.functionName,
      runtime: Runtime.NODEJS_14_X,
      handler: props.handler,
      code: Code.fromAsset(props.codePath),
      timeout: Duration.seconds(30),
    });

    new CfnOutput(this, `${props.functionName}-output-function-arn`, {
      value: lambdaFunction.functionArn,
    });
  }
}

export default LambdaStack;
