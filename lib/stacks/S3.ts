import { Construct } from 'constructs';
import {
  CfnOutput,
  Stack,
  StackProps,
  RemovalPolicy,
  Duration,
} from 'aws-cdk-lib';
import {
  BackupVault, BackupPlan, BackupPlanRule, BackupResource,
} from 'aws-cdk-lib/aws-backup';
import { OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import {
  BucketDeployment,
  BucketDeploymentProps,
  CacheControl,
  Source,
} from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as s3 from 'aws-cdk-lib/aws-s3';

import { GlobCacheControl } from '../types';

/**
 * Configurable options for stack as properties
 */
interface S3StackProps extends StackProps {
  /** The name of our S3 Bucket */
  bucketName?: string;
  /**
   * The source information of our bucket.
   */
  bucketSource: {
    /** local path of files to upload to S3 */
    path: string;
  };
  /** Whether to enable backup for the S3 bucket */
  enableBackup: boolean;
  /** The retention period for the backups */
  backupRetentionDays: number;
  /**
   * Whether we want create a DANGEROUS force remove of our S3 bucket.
   * This will force delete all objects and the bucket
   */
  forceRemove?: boolean;
  /**
   * A key value pair of caching rules
   * Where the KEY is a glob pattern, and the VALUE is a cach-control header value
   */
  objectCaching?: GlobCacheControl;
}

/**
 * Default Properties
 */
const defaultProps: Partial<S3StackProps> = {
  forceRemove: false,
};

/**
 * A Stack for an S3 Bucket to be used by cloudfront to serve a static website
 */
class S3Stack extends Stack {
  /**
   * Our AWS S3 Bucket object
   */
  private bucket: Bucket;

  /**
   * Config for optional backups
   */
  private backupPlan: BackupPlan | undefined;

  /**
   * An optional vault for backing up S3
   */
  private backupVault: BackupVault | undefined;

  /**
   * Our stack properties
   */
  private props: S3StackProps;

  /**
   * The source to trigger the Lambda
   */
  private s3PutEventSource: lambdaEventSources.S3EventSource;

  /**
   * Our access policy for the bucket and cloudfront
   */
  private originAccessIdentity: OriginAccessIdentity;

  constructor(scope: Construct, private id: string, props: S3StackProps) {
    super(scope, id, props);

    this.props = {
      ...defaultProps,
      ...props,
    };

    this.bucket = this.createBucket();
    this.originAccessIdentity = this.createOriginAccessIdentity();

    if (this.props.enableBackup) {
      this.configureBackup();
    }

    this.s3PutEventSource = new lambdaEventSources.S3EventSource(this.bucket, {
      events: [
        s3.EventType.OBJECT_CREATED_PUT,
      ],
    });

    new CfnOutput(this, `${this.id}-output-s3-oia`, {
      value: this.getOriginAccessIdentity().originAccessIdentityId,
    });
    new CfnOutput(this, `${this.id}-output-s3-bucket`, {
      value: this.getBucket().bucketName,
    });
  }

  private configureBackup() {
    // Create vault for backups
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
            deleteAfter: Duration.days(this.props.backupRetentionDays),
          },
        ),
      ],
    });

    // // Grant necessary permissions to the backup role
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
          resources: [this.bucket.bucketArn],
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
          resources: [this.bucket.bucketArn, `${this.bucket.bucketArn}/*`],
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
        new iam.PolicyStatement({
          sid: 'CloudwatchPermissions',
          actions: [
            'cloudwatch:GetMetricData',
            'events:ListRules',
          ],
          effect: iam.Effect.ALLOW,
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          sid: 'S3BucketRestorePermissions',
          actions: [
            's3:CreateBucket',
            's3:ListBucketVersions',
            's3:ListBucket',
            's3:GetBucketVersioning',
            's3:GetBucketLocation',
            's3:PutBucketVersioning',
          ],
          effect: iam.Effect.ALLOW,
          resources: [this.bucket.bucketArn],
        }),
        new iam.PolicyStatement({
          sid: 'S3ObjectRestorePermissions',
          actions: [
            's3:GetObject',
            's3:GetObjectVersion',
            's3:DeleteObject',
            's3:PutObjectVersionAcl',
            's3:GetObjectVersionAcl',
            's3:GetObjectTagging',
            's3:PutObjectTagging',
            's3:GetObjectAcl',
            's3:PutObjectAcl',
            's3:PutObject',
            's3:ListMultipartUploadParts',
          ],
          effect: iam.Effect.ALLOW,
          resources: [this.bucket.bucketArn, `${this.bucket.bucketArn}/*`],
        }),
      ],
    });

    awsS3BackupsCustomPolicy.attachToRole(backupPlanRole);

    this.backupPlan.addSelection(
      `${this.id}-selection`,
      {
        resources: [
          BackupResource.fromArn(this.bucket.bucketArn),
        ],
        allowRestores: true,
        role: backupPlanRole,
      },
    );

    new CfnOutput(this, `${this.id}-vault-name`, {
      value: this.backupVault.backupVaultName,
    });

    new CfnOutput(this, `${this.id}-plan-arn`, {
      value: this.backupPlan.backupPlanArn,
    });
  }

  /**
   * Create Our S3 Bucket with our default options here
   * The bucket will NOT be publically accessible as per cloudformation defaults
   */
  private createBucket(): Bucket {
    return new Bucket(this, `${this.id}-bucket`, {
      /** The unique S3 bucket name */
      bucketName: this.props.bucketName,
      /**
       * On CDK destroy, we'll keep the bucket unless forceRemove is set to true. This is because
       * if the bucket isn't empty, it will error
       */
      removalPolicy:
        this.props.forceRemove === true
          ? RemovalPolicy.DESTROY
          : RemovalPolicy.RETAIN,
      /**
       * Working in unison with removalPolicy, we will empty the bucket first if forceRemove is
       * true
       */
      autoDeleteObjects: !!this.props.forceRemove,
      /**
       * Optional versioning on the bucket - required for backups
       */
      versioned: this.props.enableBackup,
    });
  }

  /**
   * Create Origin Access Identity for S3 Bucket and Cloudfront
   */
  private createOriginAccessIdentity(): OriginAccessIdentity {
    const oai = new OriginAccessIdentity(this, this.id, {
      comment: `OriginAccessIdentity for S3 Bucket '${this.getBucket().bucketName}'`,
    });

    this.getBucket().grantRead(oai);

    return oai;
  }

  /**
   * Get the bucket object
   */
  public getBucket(): Bucket {
    return this.bucket;
  }

  public getEventSource(): lambdaEventSources.S3EventSource {
    return this.s3PutEventSource;
  }

  /**
   * Get Origin Access Identity Object
   */
  public getOriginAccessIdentity(): OriginAccessIdentity {
    return this.originAccessIdentity;
  }

  /**
   * Call the operation to deploy our static site to S3
   */
  public deploy() {
    if (this.props.bucketSource?.path) {
      const cacheControl: GlobCacheControl = {
        '*': 'public, no-cache',
        ...this.props.objectCaching,
      };

      Object.keys(cacheControl).forEach((glob: string) => {
        const defaultCache = (glob === '*');

        // Two modes:
        //  - include everything, except for those with specific definitions
        //  - include the current pattern, exclude everything else
        const match: Partial<BucketDeploymentProps> = defaultCache
          ? ({
            exclude: Object.keys(cacheControl).filter((k: string) => k !== glob),
          })
          : ({
            exclude: ['*'],
            include: [glob],
          });

        new BucketDeployment(this, `${this.id}-bucket-deployment-${glob}`, {
          sources: [
            Source.asset(this.props.bucketSource.path),
          ],
          ...match,
          destinationBucket: this.getBucket(),
          cacheControl: [CacheControl.fromString(cacheControl[glob])],
          // We want to prune on the initial default upload only
          prune: defaultCache && this.props.forceRemove,
        });
      });
    }
  }
}

export default S3Stack;
