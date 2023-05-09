import { App, StackProps, Tags } from 'aws-cdk-lib';

import * as G from '../lib/consts';
import { Tags as TagMap } from '../lib/types';
import S3Stack from '../lib/stacks/S3';

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
});

S3.deploy();
