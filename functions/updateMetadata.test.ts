import { S3Client, CopyObjectCommand } from '@aws-sdk/client-s3';
import handler from './updateMetadata';
import S3Stack from '../lib/stacks/S3';

// Mock the S3Client and its send method
jest.mock('@aws-sdk/client-s3', () => {
  const originalModule = jest.requireActual('@aws-sdk/client-s3');
  return {
    ...originalModule,
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn(),
    })),
    CopyObjectCommand: jest.fn(),
  };
});

describe('handler', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should update metadata for .html file', async () => {
    const s3ClientMock = new (S3Client as jest.Mock)() as jest.Mocked<S3Client>;
    s3ClientMock.send.mockResolvedValueOnce({});
    const copyObjectCommandMock = (
      CopyObjectCommand as jest.MockedClass<typeof CopyObjectCommand>) as jest.MockedClass<
        typeof CopyObjectCommand
    >;

    const event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'test-bucket',
            },
            object: {
              key: 'test.html',
            },
          },
        },
      ],
    };

    await handler(event);

    expect(s3ClientMock.send).toHaveBeenCalledWith(
      expect.any(CopyObjectCommand),
    );
    expect(copyObjectCommandMock).toHaveBeenCalledWith({
      Bucket: 'test-bucket',
      CopySource: 'test-bucket/test.html',
      Key: 'test.html',
      MetadataDirective: 'REPLACE',
      Metadata: {
        'Content-Type': 'text/html;charset=utf-8',
      },
    });
    expect(console.log).toHaveBeenCalledWith(
      'Updated metadata for object: test.html',
    );
  });

  test('should not update metadata for non-.html file', async () => {
    const s3ClientMock = new (S3Client as jest.Mock)() as jest.Mocked<S3Client>;
    const copyObjectCommandMock = (
      CopyObjectCommand as jest.MockedClass<typeof CopyObjectCommand>) as jest.MockedClass<
        typeof CopyObjectCommand
    >;

    const event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'test-bucket',
            },
            object: {
              key: 'test.txt',
            },
          },
        },
      ],
    };

    await handler(event);

    expect(s3ClientMock.send).not.toHaveBeenCalled();
    expect(copyObjectCommandMock).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
  });

  test('should handle error updating metadata', async () => {
    const s3ClientMock = new (S3Client as jest.Mock)() as jest.Mocked<S3Client>;
    s3ClientMock.send.mockRejectedValueOnce(new Error('Update error'));
    const copyObjectCommandMock = (
      CopyObjectCommand as jest.MockedClass<typeof CopyObjectCommand>) as jest.MockedClass<
        typeof CopyObjectCommand
    >;

    const event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'test-bucket',
            },
            object: {
              key: 'test.html',
            },
          },
        },
      ],
    };

    await handler(event);

    expect(s3ClientMock.send).toHaveBeenCalledWith(
      expect.any(CopyObjectCommand),
    );
    expect(copyObjectCommandMock).toHaveBeenCalledWith({
      Bucket: 'test-bucket',
      CopySource: 'test-bucket/test.html',
      Key: 'test.html',
      MetadataDirective: 'REPLACE',
      Metadata: {
        'Content-Type': 'text/html;charset=utf-8',
      },
    });
    expect(console.error).toHaveBeenCalledWith(
      'Error updating metadata: Error: Update error',
    );
  });
});
