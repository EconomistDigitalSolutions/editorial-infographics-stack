import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
import * as transfer from 'aws-cdk-lib/aws-transfer';

interface SftpStackProps extends StackProps {
  loggingRoleARN: string;
}

class SftpStack extends Stack {
  private props: SftpStackProps;

  constructor(scope: Construct, private id: string, props: SftpStackProps) {
    super(scope, id, props);

    this.props = props;

    this.createServer();
  }

  private createServer(): transfer.CfnServer {
    return new transfer.CfnServer(this, `${this.id}-sftp-server`, {
      protocols: ['SFTP'],
      domain: 'S3',
      loggingRole: this.props.loggingRoleARN,
    });
  }
}

export default SftpStack;
