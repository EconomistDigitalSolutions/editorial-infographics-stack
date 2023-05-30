import { Construct } from 'constructs';
import { Function, IFunction } from 'aws-cdk-lib/aws-lambda';
import { ILogGroup, SubscriptionFilter } from 'aws-cdk-lib/aws-logs';
import { LambdaDestination } from 'aws-cdk-lib/aws-logs-destinations';

class NewRelicCloudWatchConstruct extends Construct {
  private readonly newRelicIngestionLambda: IFunction;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.newRelicIngestionLambda = Function.fromFunctionName(
      this,
      'newrelic-log-ingestion-lambda',
      'newrelic-log-ingestion',
    );
  }

  public createSubscriptionToLogGroup(id: string, logGroup: ILogGroup): SubscriptionFilter {
    return new SubscriptionFilter(this, id, {
      destination: new LambdaDestination(this.newRelicIngestionLambda),
      filterPattern: { logPatternString: '' },
      logGroup,
    });
  }
}

export default NewRelicCloudWatchConstruct;
