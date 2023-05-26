import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
import * as transfer from 'aws-cdk-lib/aws-transfer';

interface SftpStackProps extends StackProps {
  loggingRoleARN: string;
  bucketName: string;
  sftpUserRoleARN: string;
}

class SftpStack extends Stack {
  // private server: transfer.CfnServer;

  // private user: transfer.CfnUser;

  private props: SftpStackProps;

  constructor(scope: Construct, private id: string, props: SftpStackProps) {
    super(scope, id, props);

    this.props = props;

    // this.server = this.createServer();
    this.createServer();
    // this.user = this.createUser();
  }

  private createServer(): transfer.CfnServer {
    return new transfer.CfnServer(this, `${this.id}-sftp-server`, {
      protocols: ['SFTP'],
      domain: 'S3',
      loggingRole: this.props.loggingRoleARN,
    });
  }

  // private getServer(): transfer.CfnServer {
  //   return this.server;
  // }

  // private createUser(): transfer.CfnUser {
  //   return new transfer.CfnUser(this, `cdk-${this.id}-sftp-user`, {
  //     serverId: this.getServer().attrServerId,
  //     userName: `cdk-user-${this.id}`,
  //     role: this.props.sftpUserRoleARN,
  //     homeDirectory: '/',
  //   });
  // }

  // private getUser(): transfer.CfnUser {
  //   return this.user;
  // }
}

export default SftpStack;
