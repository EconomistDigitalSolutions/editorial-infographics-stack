import { App, StackProps, Tags } from 'aws-cdk-lib';

import LambdaStack from '../lib/stacks/Lambda';
import * as G from '../lib/consts';
import { Tags as TagMap } from '../lib/types';
import S3Stack from '../lib/stacks/S3';
import SftpTransferStack from '../lib/stacks/SFTP';

if (!G.APP_NAME) {
  throw Error('Please set an APP_NAME for your project');
}

const app = new App();

// Default props for our stacks
const defaultProps: StackProps = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
};

// Attach default tags to all app resources
const defaultTags: TagMap = {
  AppName: G.APP_NAME,
  DateModified: new Date().toISOString(),
  ...G.TAGS,
};

Object.keys(defaultTags).forEach((tag: string) => {
  Tags.of(app).add(tag, defaultTags[tag]);
});

//
// Create Stacks
//
const S3 = new S3Stack(app, `${G.APP_NAME}-s3`, {
  ...defaultProps,
  bucketName: G.S3_BUCKET_NAME,
  bucketSource: { path: G.S3_CONTENT_PATH },
  forceRemove: G.S3_FORCE_REMOVE,
  objectCaching: G.S3_CACHE_CONTROL,
  enableBackup: G.ENABLE_BACKUP,
  backupRetentionDays: G.BACKUP_RETENTION_DAYS,
});

S3.deploy();

new SftpTransferStack(app, `${G.APP_NAME}-transfer`, {
  ...defaultProps,
});

new LambdaStack(app, `${G.APP_NAME}-update-metadata`, {
  ...defaultProps,
  functionName: 'update-metadata-lambda',
  entry: 'build/functions/updateMetadata/index.js',
  s3Trigger: S3.getEventSource(),
  // Importing the ARN directly from the S3 stack (apparently) causes a cyclical reference
  bucketArn: `arn:aws:s3:::${G.S3_BUCKET_NAME}`,
});
