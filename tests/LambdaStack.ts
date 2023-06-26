import { Template, Match } from 'aws-cdk-lib/assertions';
import { Stack } from 'aws-cdk-lib';

import LambdaStack from '../lib/stacks/Lambda';

describe('LambdaStack', () => {
  test('should create a Lambda function', () => {
    const stack = new Stack();

    const lambdaStack = new LambdaStack(stack, 'TestStack', {
      functionName: 'update-metadata-lambda',
      entry: 'build/functions/updateMetadata/index.js',
      bucketArn: 'arn:aws:s3:::FAKE_BUCKET_ARN',
    });

    const template = Template.fromStack(lambdaStack);

    template.hasResource(
      'AWS::Lambda::Function',
      Match.objectLike({
        Properties: {
          FunctionName: 'update-metadata-lambda',
          Handler: 'index.default',
          Runtime: 'nodejs14.x',
        },
      }),
    );

    template.hasOutput(
      '*',
      Match.objectLike({
        Value: {
          'Fn::GetAtt': ['updatemetadatalambdaBF481DB0', 'Arn'],
        },
      }),
    );
  });
});
