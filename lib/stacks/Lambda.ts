import { Construct } from 'constructs';
import {
  Stack, StackProps, Duration, CfnOutput,
} from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';

interface LambdaStackProps extends StackProps {
  functionName: string;
  entry: string;
  bucketArn: string;
  s3Trigger?: lambdaEventSources.S3EventSource;
}

class LambdaStack extends Stack {
  constructor(scope: Construct, private id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const lambdaFunction = new NodejsFunction(this, props.functionName, {
      functionName: props.functionName,
      runtime: Runtime.NODEJS_14_X,
      entry: props.entry,
      handler: 'default',
      timeout: Duration.seconds(30),
      projectRoot: '.',
      role: this.createLambdaRole(props.bucketArn),
    });

    if (props.s3Trigger) lambdaFunction.addEventSource(props.s3Trigger);

    new CfnOutput(this, `${props.functionName}-output-function-arn`, {
      value: lambdaFunction.functionArn,
    });
  }

  private createLambdaRole(bucketArn: string): iam.Role {
    // // Grant necessary permissions to the backup role
    const lambdaRole = new iam.Role(this, `${this.id}-role`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    const lambdaPolicy = new iam.Policy(this, `${this.id}-policy`, {
      statements: [
        new iam.PolicyStatement({
          sid: 'LambdaMetadataCopyPermissions',
          actions: [
            's3:ListBucket',
            's3:GetObject',
            's3:PutObject',
            's3:PutObjectAcl',
          ],
          effect: iam.Effect.ALLOW,
          resources: [bucketArn, `${bucketArn}/*`],
        }),
      ],
    });

    lambdaPolicy.attachToRole(lambdaRole);
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));
    return lambdaRole;
  }
}

export default LambdaStack;
