import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import { Duration, Stack } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

import LambdaStack from '../lib/stacks/Lambda';

describe('LambdaStack', () => {
  test('should create a Lambda function', () => {
    const stack = new Stack();

    new LambdaStack(stack, 'TestStack', {
      functionName: 'TestFunction',
      handler: 'index.handler',
      codePath: 'path/to/code',
    });

    expectCDK(stack).to(
      haveResource('AWS::Lambda::Function', {
        Runtime: Runtime.NODEJS_14_X.toString(),
        Handler: 'index.handler',
        Timeout: Duration.seconds(30).toSeconds(),
      }),
    );
  });

  test('should output the function ARN', () => {
    const stack = new Stack();

    new LambdaStack(stack, 'TestStack', {
      functionName: 'TestFunction',
      handler: 'index.handler',
      codePath: 'path/to/code',
    });

    expectCDK(stack).to(
      haveResource('AWS::CloudFormation::Output', {
        ExportName: 'TestFunction-output-function-arn',
      }),
    );
  });
});
