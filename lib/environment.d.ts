/* eslint-disable no-unused-vars */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_NAME: string;
      CERTIFICATE_ARN?: string,
      S3_BUCKET_NAME?: string;
      S3_CONTENT_PATH?: string;
      DOCKER_S3_CONTENT_PATH?: string;
      S3_FORCE_REMOVE?: number;
      S3_CACHE_CONTROL?: string;
      TAGS?: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
