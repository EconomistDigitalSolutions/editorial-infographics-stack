import { Template, Match } from 'aws-cdk-lib/assertions';
import { Duration, Stack } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

import LambdaStack from '../lib/stacks/Lambda';

describe('LambdaStack', () => {
  test('should create a Lambda function', () => {
    const stack = new Stack();

    const lambdaStack = new LambdaStack(stack, 'TestStack', {
      functionName: 'TestFunction',
      handler: 'updateMetadata.handler',
      codePath: 'build/functions',
    });

    const template = Template.fromStack(lambdaStack);

    template.hasResource(
      'AWS::Lambda::Function',
      Match.objectEquals({
        Runtime: Runtime.NODEJS_14_X.toString(),
        Handler: 'index.handler',
        Timeout: Duration.seconds(30).toSeconds(),
      }),
    );
  });

  test('should output the function ARN', () => {
    const stack = new Stack();

    const lambdaStack = new LambdaStack(stack, 'TestStack', {
      functionName: 'TestFunction',
      handler: 'updateMetadata.handler',
      codePath: 'build/functions',
    });

    const template = Template.fromStack(lambdaStack);

    template.hasResource(
      'AWS::CloudFormation::Output',
      Match.objectEquals({
        ExportName: 'TestFunction-output-function-arn',
      }),
    );
  });
});
