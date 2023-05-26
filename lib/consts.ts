import * as dotenv from 'dotenv';

import * as T from './types';

dotenv.config({ path: `${__dirname}/../${process.env.ENV_FILE || '.env'}` });

/**
 * Helper function to turn a collection of items in a string into an object
 *
 * @param values - string of values with delimiters. This is optional so that we can easily circuit
 *  break undefined values
 * @param objectDelimiter - the first delimiter between the key/value pairs
 * @param kvDelimiter - the second delimiter between the keys and values themselves
 *
 * @returns the constructed object from the values
 */
const stringToObject = <T extends object>(
  values?: string,
  objectDelimiter = ',',
  kvDelimiter = '=',
): T => {
  if (!values) return {} as T;
  return (values || '').split(objectDelimiter).reduce((acc: T, kv: string) => {
    const record = kv.split(kvDelimiter);
    return { ...acc, [record[0]]: record[1] };
  }, {} as T);
};

//
// METADATA
//
export const APP_NAME: string = process.env.APP_NAME as string;

export const TAGS: T.Tags = stringToObject(process.env.TAGS || '');

//
// S3 Config
//
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

// For docker contexts, we always overwrite the content path and skip the S3_CONTENT_PATH value
export const S3_CONTENT_PATH = process.env.DOCKER_S3_CONTENT_PATH || process.env.S3_CONTENT_PATH || '';

export const S3_FORCE_REMOVE = !!process.env.S3_FORCE_REMOVE;

export const S3_CACHE_CONTROL: T.GlobCacheControl = stringToObject(
  process.env.S3_CACHE_CONTROL,
  '|',
  ':',
);

export const ENABLE_BACKUP = process.env.ENABLE_BACKUP === 'true';

export const BACKUP_RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS ?? '35', 10);
