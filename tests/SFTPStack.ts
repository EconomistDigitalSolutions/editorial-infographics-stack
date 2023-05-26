import { Template, Match } from 'aws-cdk-lib/assertions';
import { App, Stack } from 'aws-cdk-lib';

import SftpTransferStack from '../lib/stacks/SFTP';

describe('stack for S3', () => {
  it('synthesizes an SFTP server correctly', () => {
    const app = new App();
    const stack = new Stack(app, 'SFTPStack');

    const sftpTransferStack = new SftpTransferStack(stack, 'TestSFTPStack', {});

    const template = Template.fromStack(sftpTransferStack);

    template.hasResource(
      'AWS::Transfer::Server',
      Match.objectEquals({
        Type: 'AWS::Transfer::Server',
        Properties: {
          Protocols: ['SFTP'],
          Domain: 'S3',
          LoggingRole: {
            'Fn::GetAtt': [
              Match.anyValue(),
              'Arn',
            ],
          },
        },
      }),
    );

    template.hasResource(
      'AWS::IAM::Policy',
      Match.objectEquals({
        Type: 'AWS::IAM::Policy',
        Properties: {
          Roles: [
            { Ref: Match.anyValue() },
          ],
          PolicyName: Match.anyValue(),
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [{
              Action: [
                'logs:CreateLogStream',
                'logs:DescribeLogStreams',
                'logs:CreateLogGroup',
                'logs:PutLogEvents',
              ],
              Effect: 'Allow',
              Resource: '*',
            }],
          },
        },
      }),
    );
  });
});
