import * as s3 from '@aws-sdk/client-s3';
import handler from '../functions/updateMetadata';

jest.mock('@aws-sdk/client-s3', () => ({
  ...jest.requireActual('@aws-sdk/client-s3'),
  CopyObjectCommand: jest.fn(),
}));

jest.spyOn(s3.S3Client.prototype, 'send').mockImplementation();
const consoleLogMock = jest.spyOn(console, 'log').mockImplementation();
const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('handler', () => {
  test('should update metadata for an .html file with missing metadata', async () => {
    // GIVEN
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

    // WHEN
    await handler(event);

    // THEN
    expect(s3.CopyObjectCommand).toHaveBeenCalledWith(params);
    expect(s3.S3Client.prototype.send).toHaveBeenCalledWith(new s3.CopyObjectCommand(params));
    expect(consoleLogMock).toHaveBeenCalledWith(`Updated metadata for object: ${objectKey}`);
  });

  test('should update metadata for a .txt file with missing metadata', async () => {
    // GIVEN
    const bucketName = 'bucket';
    const objectKey = 'index.txt';

    const params = {
      Bucket: bucketName,
      CopySource: encodeURIComponent(`${bucketName}/${objectKey}`),
      Key: objectKey,
      MetadataDirective: 'REPLACE',
      Metadata: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    };

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

    // WHEN
    await handler(event);

    // THEN
    expect(s3.CopyObjectCommand).toHaveBeenCalledWith(params);
    expect(s3.S3Client.prototype.send).toHaveBeenCalledWith(new s3.CopyObjectCommand(params));
    expect(consoleLogMock).toHaveBeenCalledWith(`Updated metadata for object: ${objectKey}`);
  });

  test('should not update metadata for non-.html/.txt file', async () => {
    // GIVEN
    const bucketName = 'bucket';
    const objectKey = 'test.png';

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

    // WHEN
    await handler(event);

    // THEN
    expect(s3.CopyObjectCommand).not.toHaveBeenCalled();
    expect(s3.S3Client.prototype.send).not.toHaveBeenCalled();
    expect(consoleLogMock).not.toHaveBeenCalled();
  });

  test('should handle and log thrown error when updating metadata', async () => {
    // Override our spy to thrown an error.
    jest.spyOn(s3.S3Client.prototype, 'send').mockImplementation(() => { throw new Error('A disastrous problem!'); });

    // GIVEN
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

    // WHEN
    await handler(event);

    // THEN
    expect(s3.CopyObjectCommand).toHaveBeenCalledWith(params);
    expect(s3.S3Client.prototype.send).toHaveBeenCalledWith((new s3.CopyObjectCommand(params)));
    expect(consoleErrorMock).toHaveBeenCalledWith('Error updating metadata: Error: A disastrous problem!');
  });
});
