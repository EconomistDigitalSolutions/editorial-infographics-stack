import { Template, Match } from 'aws-cdk-lib/assertions';
import { App, Stack } from 'aws-cdk-lib';

import S3Stack from '../lib/stacks/S3';

describe('stack for S3', () => {
  it('synthesizes correctly for only required config', () => {
    const app = new App();
    const stack = new Stack(app, 'S3Stack');

    const s3Stack = new S3Stack(stack, 'TestS3Stack', {
      bucketName: 'test-bucket',
      bucketSource: {
        path: '/path/to/files',
      },
      enableBackup: true,
      backupRetentionDays: 10,
    });

    const template = Template.fromStack(s3Stack);

    template.hasResource(
      'AWS::S3::Bucket',
      Match.objectEquals({
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: 'test-bucket',
          VersioningConfiguration: {
            Status: 'Enabled',
          },
        },
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      }),
    );

    template.hasResource(
      'AWS::Backup::BackupPlan',
      Match.objectEquals({
        Type: 'AWS::Backup::BackupPlan',
        Properties: {
          BackupPlan: {
            BackupPlanName: 'TestS3Stack-backup-plan',
            BackupPlanRule: [
              {
                Lifecycle: {
                  DeleteAfterDays: 10,
                },
                RuleName: 'TestS3Stack-backup-rule',
                ScheduleExpression: 'cron(0 0 * * ? *)',
                TargetBackupVault: {
                  'Fn::GetAtt': [
                    'TestS3Stackbackupvault5D7FAB34',
                    'BackupVaultName',
                  ],
                },
              },
            ],
          },
        },
      }),
    );

    template.hasResource(
      'AWS::Backup::BackupVault',
      Match.objectEquals({
        Type: 'AWS::Backup::BackupVault',
        Properties: {
          BackupVaultName: 'TestS3Stack-backup-vault',
        },
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      }),
    );

    template.hasResourceProperties(
      'AWS::CloudFront::CloudFrontOriginAccessIdentity',
      Match.objectEquals({
        CloudFrontOriginAccessIdentityConfig: {
          Comment: {
            'Fn::Join': [
              '',
              [
                "OriginAccessIdentity for S3 Bucket '",
                { Ref: Match.anyValue() },
                "'",
              ],
            ],
          },
        },
      }),
    );

    template.hasResourceProperties(
      'AWS::S3::BucketPolicy',
      Match.objectLike({
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith(
            [Match.objectLike({
              Action: ['s3:GetObject*', 's3:GetBucket*', 's3:List*'],
            })],
          ),
        }),
      }),
    );
  });

  it('synthesizes correctly for all config', () => {
    const app = new App();
    const stack = new Stack(app, 'S3Stack');

    const s3Stack = new S3Stack(stack, 'TestS3Stack', {
      bucketName: 'this-is-my-bucket',
      bucketSource: {
        path: '/path/to/files',
      },
      forceRemove: true,
      enableBackup: false,
      backupRetentionDays: 10,
    });

    const template = Template.fromStack(s3Stack);

    template.hasResource(
      'AWS::S3::Bucket',
      Match.objectEquals({
        Type: 'AWS::S3::Bucket',
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
        Properties: {
          BucketName: 'this-is-my-bucket',
          Tags: [
            {
              Key: 'aws-cdk:auto-delete-objects',
              Value: 'true',
            },
          ],
        },
      }),
    );
  });
});
