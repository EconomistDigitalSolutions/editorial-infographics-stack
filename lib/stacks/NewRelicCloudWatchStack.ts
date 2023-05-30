import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Function, IFunction } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, SubscriptionFilter } from 'aws-cdk-lib/aws-logs';
import { LambdaDestination } from 'aws-cdk-lib/aws-logs-destinations';

interface NewRelicProps extends StackProps {
  serverId: string;
}

class NewRelicCloudWatchStack extends Stack {
  private readonly newRelicIngestionLambda: IFunction;

  constructor(scope: Construct, id: string, props: NewRelicProps) {
    super(scope, id, props);

    this.newRelicIngestionLambda = Function.fromFunctionName(
      this,
      'newrelic-log-ingestion-lambda',
      'newrelic-log-ingestion',
    );

    this.createSubscriptionToLogGroup(id, props.serverId);
  }

  private createSubscriptionToLogGroup(
    id: string,
    serverId: string,
  ): SubscriptionFilter {
    return new SubscriptionFilter(this, id, {
      destination: new LambdaDestination(this.newRelicIngestionLambda),
      filterPattern: { logPatternString: '' },
      logGroup: LogGroup.fromLogGroupName(this, `${id}-log-group`, `/aws/transfer/${serverId}`),
    });
  }
}

export default NewRelicCloudWatchStack;
