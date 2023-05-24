# Static Site Cloud Development Kit

![Lint and Tests](https://github.com/drinkataco/cdk-static-site/actions/workflows/main.yml/badge.svg)

This repositories purpose is to provision a Cloudfront distribution for an S3 bucket fronted by .

![Diagram](./assets/diagram.png)

Its aim is to be highly configurable from ENV variables to allow reuse for any static website. Allowing you to configure S3 options, cloudfront options (such as error responses, geo blocks, http methods) and custom domains (https certificates, hosted zone name, subdomain name).

See: [AWS Cloud Development Kit (CDK)](https://github.com/aws/aws-cdk)

## Quick Start

To get started you must set up a `.env` file. You can copy the [template](.env.example) and set out the minimum request to get started:

To build, create a `.env` file with the default configuration needed (you can copy the [template](.env.example) file to help you get started).

- `APP_NAME` - This is the name of your app and is used cloudformation template prefixes
- `S3_CONTENT_PATH` - local path to your static site files. This is _not required_ if running from docker, as the mount point will be used. View the [docker instructions](#Docker) for more information.

Ensure you have your [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html) variables set up so that CDK can access your AWS account, then run:

`npm run cdk:deploy`

Alternatively, to destroy, run

`npm run cdk:destroy`

## Advanced Usage

By default, the `.env` file is used on the root of the project. However, you can create multiple .env files, such as one with `.env.example.com`. On deployment run `ENV_FILE=.env.example.com npm run cdk:deploy` to use this configuration file.

### Extended Deployment Configuration

#### Metadata

- `TAGS` - define tags for every resources, with keys and values separated by `=` and tags separated by `,`, for example, `Author=Bob Dylan,Project=test`.

#### S3

- `S3_BUCKET_NAME` - a unique name for a S3 bucket to be provisioned
- `S3_FORCE_REMOVE` _(default: 0)_ - a numerical value (0 for false, 1 for true) to indicate whether the S3 bucket should be force emptied and deleted when stacks are destroyed or objects are reuploaded. You will loose your data in this bucket if set to `1`.
- `S3_CACHE_CONTROL` _(default: \*:public, max-age=0)_ -This is a list of glob patterns and cache control headers for S3 objects. By default, nothing is cached - but you'll probably want to set up caching by defining a rule (such as `*.js`) and a cache-control header value (such as `public, max-age=31536000, immutable`). Separate multiple values with a pipe (`|`).
  An example of a bunch of cache control headers for a gatsby site:

  ```
  S3_CACHE_CONTROL=*.html:public, max-age=0, must-revalidate|page-data/*:public, max-age=0, must-revalidate| chunk-map.json:public, max-age=0, must-revalidate|webpack.stats.json:public, max-age=0, must-revalidate|static/*:public, max-age=31536000, immutable|*.js:public, max-age=31536000, immutable|*.css:public, max-age=31536000, immutable|favicon.ico:public, max-age=2628000
  ```

#### Cloudfront

- `CLOUDFRONT_ALLOWED_METHODS` _(default: ALLOW_ALL)_ - allowed HTTP methods. Enum value defined [here](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront.AllowedMethods.html)
- `CLOUDFRONT_ERROR_RESPONSES` - HTTP error codes and the objects they map to for default responses, for example `404=/404.html,500=error.html`
- `CLOUDFRONT_GEO_DENYLIST` - Comma separated values of countries to block (using ISO 3166-1-alpha-2). For example, `CN,RU`
- `CLOUDFRONT_LOGGING` _(default: 0)_ - a numerical value (0 for false, 1 for true) to indicate whether logging should be enabled for cloudfront
- `CLOUDFRONT_PRICE_CLASS` _(default: ALL)_ - Price Class of Cloudfront Distribution. Enum value defined [here](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront.PriceClass.html)
- `CLOUDFRONT_ROOT_OBJECT` _(default: index.html)_ - default root object of distribution
- `CLOUDFRONT_FUNCTIONS_REQUEST` - a file location of a [cloudfront function](https://aws.amazon.com/blogs/aws/introducing-cloudfront-functions-run-your-code-at-the-edge-with-low-latency-at-any-scale/) for requests. This directory can be absolute, or relative to the project folder. An example request function (for adding index.html to directory requests) is [provided](./cloudfront-functions/indexhtml.js). Set `CLOUDFRONT_FUNCTIONS_REQUEST=cloudfront-functions/viewer-request/indexhtml.js` to use it.
- `CLOUDFRONT_FUNCTIONS_RESPONSE` - a file location of a [cloudfront function](https://aws.amazon.com/blogs/aws/introducing-cloudfront-functions-run-your-code-at-the-edge-with-low-latency-at-any-scale/) for responses. This directory can be absolute, or relative to the project folder. An example response function (for adding generic security headers) is [provided](./cloudfront-functions/securityheaders.js). Set `CLOUDFRONT_FUNCTIONS_RESPONSE=cloudfront-functions/viewer-response/securityheaders.js` to use it.

##### Route53 and Certificate Manager

- `CERTICIATE_ARN` - an ARN of an already provisioned certificate to use for the domain alias if you don't want one to be auto provisioned

## Docker

You can run this directly from docker to install your static site.

```bash
docker build ./ -t infographics-test
docker run --rm \
  --env-file=.env \ # the location of your env file
  --env AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \ # aws keys - can be included in env file
  --env AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
  --env AWS_DEFAULT_REGION=eu-west-1 \
  --volume /path/to/your/content:/srv \ # path of your content, to the /srv mount point
  infographics-test
```

This docker container runs the deployment based on the supplied env file. The static content variable, however, is ignored (S3_CONTENT_PATH) and always set to /srv - which is mounted to the container.

## Preview

See the sister project, [gatsby-typescript-scratch-boilerplate](https://github.com/drinkataco/gatsby-typescript-scratch-boilerplate) to see a preview of this repository deployed!
