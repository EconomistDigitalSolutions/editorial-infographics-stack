import { Construct } from 'constructs';
import {
  CfnOutput,
  Stack,
  StackProps,
  Duration,
} from 'aws-cdk-lib';
import {
  BackupVault, BackupPlan, BackupPlanRule, BackupResource,
} from 'aws-cdk-lib/aws-backup';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';

/**
 * Configurable options for stack as properties
 */
interface BackupStackProps extends StackProps {
  /** The name of our S3 Bucket */
  bucketArn: string;
  /** The retention period for the backups */
  backupRetentionDays?: number;
}

/**
 * A Stack for an S3 Bucket to be used by cloudfront to serve a static website
 */
class BackupStack extends Stack {
  /**
   * Our AWS S3 Bucket object
   */
  // private bucketArn: string;

  /**
   * Our AWS S3 Bucket object
   */
  private backupPlan: BackupPlan;

  /**
   * Our AWS S3 Bucket object
   */
  private backupVault: BackupVault;

  /**
   * Our stack properties
   */
  private props: BackupStackProps;

  /**
   * Our access policy for the bucket and cloudfront
   */

  constructor(scope: Construct, private id: string, props: BackupStackProps) {
    super(scope, id, props);

    this.props = {
      ...props,
    };

    // Create the backup vault
    this.backupVault = new BackupVault(this, `${this.id}-backup-vault`, {
      backupVaultName: `${this.id}-backup-vault`,
    });

    // Create the backup plan
    this.backupPlan = new BackupPlan(this, `${this.id}-backup-plan`, {
      backupPlanName: `${this.id}-backup-plan`,
      backupPlanRules: [
        new BackupPlanRule(
          {
            ruleName: `${this.id}-backup-rule`,
            backupVault: this.backupVault,
            scheduleExpression: events.Schedule.expression('cron(0 0 * * ? *)'), // Daily backup
            deleteAfter: Duration.days(this.props.backupRetentionDays ?? 35),
          },
        ),
      ],
    });

    // // Grant necessary permissions to the backup role
    // const backupRole = this.bucket.grantPrincipal.addToPolicy(
    //   new iam.PolicyStatement({
    //     actions: ['backup:StartBackupJob'],
    //     resources: [this.bucket.bucketArn],
    //   }),
    // );
    const backupPlanRole = new iam.Role(this, 's3-example-bucket-backup-role', {
      assumedBy: new iam.ServicePrincipal('backup.amazonaws.com'),
    });

    const awsS3BackupsCustomPolicy = new iam.Policy(this, 's3-custom-aws-backup-policy', {
      statements: [
        new iam.PolicyStatement({
          sid: 'S3BucketBackupPermissions',
          actions: [
            's3:GetInventoryConfiguration',
            's3:PutInventoryConfiguration',
            's3:ListBucketVersions',
            's3:ListBucket',
            's3:GetBucketVersioning',
            's3:GetBucketNotification',
            's3:PutBucketNotification',
            's3:GetBucketLocation',
            's3:GetBucketTagging',
          ],
          effect: iam.Effect.ALLOW,
          resources: [this.props.bucketArn],
        }),
        new iam.PolicyStatement({
          sid: 'S3ObjectBackupPermissions',
          actions: [
            's3:GetObjectAcl',
            's3:GetObject',
            's3:GetObjectVersionTagging',
            's3:GetObjectVersionAcl',
            's3:GetObjectTagging',
            's3:GetObjectVersion',
          ],
          effect: iam.Effect.ALLOW,
          resources: [this.props.bucketArn, `${this.props.bucketArn}/*`],
        }),
        new iam.PolicyStatement({
          sid: 'S3GlobalPermissions',
          actions: ['s3:ListAllMyBuckets'],
          effect: iam.Effect.ALLOW,
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          sid: 'EventsPermissions',
          actions: [
            'events:DescribeRule',
            'events:EnableRule',
            'events:PutRule',
            'events:DeleteRule',
            'events:PutTargets',
            'events:RemoveTargets',
            'events:ListTargetsByRule',
            'events:DisableRule',
          ],
          effect: iam.Effect.ALLOW,
          resources: ['arn:aws:events:*:*:rule/AwsBackupManagedRule*'],
        }),
      ],
    });

    awsS3BackupsCustomPolicy.attachToRole(backupPlanRole);

    this.backupPlan.addSelection(
      `${this.id}-selection`,
      {
        resources: [
          BackupResource.fromArn(this.props.bucketArn),
        ],
        allowRestores: true,
        role: backupPlanRole,
      },
    );

    new CfnOutput(this, `${this.id}-vault-name`, {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      value: this.backupPlan.backupVault.backupVaultName,
    });

    new CfnOutput(this, `${this.id}-plan-arn`, {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      value: this.backupPlan.backupPlanArn,
    });
  }
}

export default BackupStack;
