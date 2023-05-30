import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as transfer from 'aws-cdk-lib/aws-transfer';

/**
 * A Stack for a Transfer Family SFTP server, with an S3 domain.
 * Any users must be provisioned in the AWS console.
 */
class SftpTransferStack extends Stack {
  /**
   * Our AWS Transfer Family SFTP server
   */
  private server: transfer.CfnServer;

  public serverId: string;

  /**
   * The corresponding CloudWatch log group for our server
   */

  constructor(scope: Construct, private id: string, props: StackProps) {
    super(scope, id, props);

    this.server = this.createServer();
    this.serverId = this.server.attrServerId;
    this.server.loggingRole = this.createLoggingRole().roleArn;
  }

  private createServer(): transfer.CfnServer {
    // Create our server, specifying the protocol and storage domain
    return new transfer.CfnServer(this, `${this.id}-sftp-server`, {
      protocols: ['SFTP'],
      domain: 'S3',
    });
  }

  /**
   * Our IAM role for logging in transfer server, this role contains a policy that allows our
   * server to send logs to CloudWatch so that we can later ship them to NewRelic.
   * @returns { iam.Role }
   */
  private createLoggingRole(): iam.Role {
    const loggingPolicy = new iam.Policy(this, 'Infographics-Transfer-CW-Logging', {
      statements: [new iam.PolicyStatement({
        actions: [
          'logs:CreateLogStream',
          'logs:DescribeLogStreams',
          'logs:CreateLogGroup',
          'logs:PutLogEvents',
        ],
        resources: ['*'],
      })],
    });

    const loggingRole = new iam.Role(this, `${this.id}-transfer-family-logging-role`, {
      assumedBy: new iam.ServicePrincipal('transfer.amazonaws.com'),
    });

    loggingPolicy.attachToRole(loggingRole);

    return loggingRole;
  }
}

export default SftpTransferStack;
