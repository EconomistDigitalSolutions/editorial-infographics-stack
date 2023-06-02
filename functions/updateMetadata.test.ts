import * as s3 from '@aws-sdk/client-s3';
import handler from './updateMetadata';
import S3Stack from '../lib/stacks/S3';

jest.mock('@aws-sdk/client-s3', () => ({
  ...jest.requireActual('@aws-sdk/client-s3'),
  CopyObjectCommand: jest.fn(),
}));

jest.spyOn(global.console, 'log');

const prepS3Client = () => {
  jest.spyOn(s3.S3Client.prototype, 'send').mockImplementation();
  const mockS3Client = new s3.S3Client(S3Stack);
  return mockS3Client;
};

describe('handler', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const bucketName = 'bucket';
  const objectKey = 'index.html';
  const params = {
    Bucket: bucketName,
    CopySource: encodeURIComponent(`${bucketName}/${objectKey}`),
    Key: objectKey,
    MetadataDirective: 'REPLACE',
    Metadata: {
      'Content-Type': 'text/html;charset=utf-8',
    },
  };

  test('just mucking around', async () => {
    const s3ClientMock = prepS3Client();

    const event = {
      Records: [
        {
          s3: {
            bucket: {
              name: bucketName,
            },
            object: {
              key: objectKey,
            },
          },
        },
      ],
    };

    await handler(event);

    expect(s3.CopyObjectCommand).toHaveBeenCalledWith(params);
    expect(s3ClientMock.send).toHaveBeenCalledWith(new s3.CopyObjectCommand(params));
    expect(console.log).toHaveBeenCalledWith(
      `Updated metadata for object: ${objectKey}`,
    );
  });

  // test('should update metadata for an .html file with missing metadata', async () => {
  //   const s3ClientMock = prepS3Client();
  //   const copyObject = new s3.CopyObjectCommand({
  //     Bucket: 'bucketName',
  //     CopySource: encodeURIComponent('bucketName/objectKey'),
  //     Key: 'objectKey',
  //     MetadataDirective: 'REPLACE',
  //     Metadata: {
  //       'Content-Type': 'text/html;charset=utf-8',
  //     },
  //   });

  //   const event = {
  //     Records: [
  //       {
  //         s3: {
  //           bucket: {
  //             name: 'test-bucket',
  //           },
  //           object: {
  //             key: 'test.html',
  //           },
  //         },
  //       },
  //     ],
  //   };

  //   await handler(event);

  //   expect(s3ClientMock.send).toHaveBeenCalledWith(
  //     expect.any(copyObject),
  //   );
  //   // expect(copyObjectCommandMock).toHaveBeenCalledWith({
  //   //   Bucket: 'test-bucket',
  //   //   CopySource: 'test-bucket/test.html',
  //   //   Key: 'test.html',
  //   //   MetadataDirective: 'REPLACE',
  //   //   Metadata: {
  //   //     'Content-Type': 'text/html;charset=utf-8',
  //   //   },
  //   // });
  //   expect(console.log).toHaveBeenCalledWith(
  //     'Updated metadata for object: test.html',
  //   );
  // });

  // test('should not update metadata for non-.html file', async () => {
  //   const s3ClientMock = new (S3Client as jest.Mock)() as jest.Mocked<S3Client>;
  //   const copyObjectCommandMock = (
  //     CopyObjectCommand as jest.MockedClass<typeof CopyObjectCommand>) as jest.MockedClass<
  //       typeof CopyObjectCommand
  //   >;

  //   const event = {
  //     Records: [
  //       {
  //         s3: {
  //           bucket: {
  //             name: 'test-bucket',
  //           },
  //           object: {
  //             key: 'test.txt',
  //           },
  //         },
  //       },
  //     ],
  //   };

  //   await handler(event);

  //   expect(s3ClientMock.send).not.toHaveBeenCalled();
  //   expect(copyObjectCommandMock).not.toHaveBeenCalled();
  //   expect(console.log).not.toHaveBeenCalled();
  // });

  // test('should handle error updating metadata', async () => {
  //   const s3ClientMock = new (S3Client as jest.Mock)() as jest.Mocked<S3Client>;
  //   s3ClientMock.send.mockRejectedValueOnce(new Error('Update error'));
  //   const copyObjectCommandMock = (
  //     CopyObjectCommand as jest.MockedClass<typeof CopyObjectCommand>) as jest.MockedClass<
  //       typeof CopyObjectCommand
  //   >;

  //   const event = {
  //     Records: [
  //       {
  //         s3: {
  //           bucket: {
  //             name: 'test-bucket',
  //           },
  //           object: {
  //             key: 'test.html',
  //           },
  //         },
  //       },
  //     ],
  //   };

  //   await handler(event);

  //   expect(s3ClientMock.send).toHaveBeenCalledWith(
  //     expect.any(CopyObjectCommand),
  //   );
  //   expect(copyObjectCommandMock).toHaveBeenCalledWith({
  //     Bucket: 'test-bucket',
  //     CopySource: 'test-bucket/test.html',
  //     Key: 'test.html',
  //     MetadataDirective: 'REPLACE',
  //     Metadata: {
  //       'Content-Type': 'text/html;charset=utf-8',
  //     },
  //   });
  //   expect(console.error).toHaveBeenCalledWith(
  //     'Error updating metadata: Error: Update error',
  //   );
  // });
});
