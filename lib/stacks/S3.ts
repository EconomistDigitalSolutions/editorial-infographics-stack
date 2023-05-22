import { Construct } from 'constructs';
import {
  CfnOutput,
  Stack,
  StackProps,
  RemovalPolicy,
} from 'aws-cdk-lib';
import { OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import {
  BucketDeployment,
  BucketDeploymentProps,
  CacheControl,
  Source,
} from 'aws-cdk-lib/aws-s3-deployment';

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
  /** Whether to enable backup for the S3 bucket */
  enableBackup?: boolean;
  /** The retention period for the backups */
  backupRetentionDays?: number;
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
   * Our stack properties
   */
  private props: S3StackProps;

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

    new CfnOutput(this, `${this.id}-output-s3-oia`, {
      value: this.getOriginAccessIdentity().originAccessIdentityName,
    });
    new CfnOutput(this, `${this.id}-output-s3-bucket`, {
      value: this.getBucket().bucketName,
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
