# Image Upload Optimization Module

This NestJS module provides comprehensive image handling capabilities including automatic compression, format validation, size limits, and CDN integration while maintaining image quality and providing detailed upload feedback.

## Features

- **Auto-Compression**: Intelligent compression without quality loss using Sharp
- **Format Validation**: Enforces allowed formats (JPG, PNG, WebP, etc.)
- **Size Limits**: Configurable file size limits (default 2MB)
- **CDN Integration**: Optional upload to Cloudinary or other CDN providers
- **Image Variants**: Automatic generation of thumbnails and different sizes
- **WebP Conversion**: Modern format conversion for better compression
- **Batch Upload**: Support for multiple file uploads with concurrency control
- **Detailed Feedback**: Comprehensive success/failure responses
- **Storage Statistics**: Monitor storage usage and file counts

## Installation

1. Install dependencies:
   \`\`\`bash
   npm install @nestjs/platform-express multer sharp form-data
   npm install -D @types/multer
   \`\`\`

2. Configure environment variables (see .env.example)

3. Import ImageUploadModule into your AppModule:
   \`\`\`typescript
   import { ImageUploadModule } from './image-upload/image-upload.module';
   
   @Module({
     imports: [ImageUploadModule],
   })
   export class AppModule {}
   \`\`\`

## Usage

### Single Image Upload

\`\`\`bash
# Upload a single image with default settings
curl -X POST -F "image=@photo.jpg" http://localhost:3000/images/upload

# Upload with custom quality and variants
curl -X POST -F "image=@photo.jpg" \
  "http://localhost:3000/images/upload?quality=85&createVariants=true&uploadToCDN=true"
\`\`\`

### Batch Image Upload

\`\`\`bash
# Upload multiple images
curl -X POST \
  -F "images=@photo1.jpg" \
  -F "images=@photo2.png" \
  -F "images=@photo3.webp" \
  "http://localhost:3000/images/upload/batch?quality=80&maxConcurrent=2"
\`\`\`

### Service Integration

\`\`\`typescript
// In your service
import { ImageUploadService } from './image-upload/image-upload.service';

@Injectable()
export class UserService {
  constructor(private imageUploadService: ImageUploadService) {}

  async updateProfilePicture(userId: string, imageBuffer: Buffer, filename: string) {
    const result = await this.imageUploadService.uploadImage(imageBuffer, filename, {
      quality: 85,
      createVariants: true,
      uploadToCDN: true,
    });

    if (result.success) {
      // Update user profile with image URL
      await this.updateUser(userId, { 
        profilePicture: result.data.url,
        profilePictureCDN: result.data.cdnUrl 
      });
      return result.data;
    } else {
      throw new Error(result.error.message);
    }
  }
}
\`\`\`

## Configuration

### Environment Variables

\`\`\`env
# Basic Configuration
IMAGE_MAX_FILE_SIZE=2097152          # 2MB in bytes
IMAGE_ALLOWED_FORMATS=jpg,jpeg,png,webp
IMAGE_COMPRESSION_QUALITY=80         # 0-100
IMAGE_MAX_WIDTH=2048
IMAGE_MAX_HEIGHT=2048
IMAGE_ENABLE_WEBP=true
IMAGE_UPLOAD_PATH=./uploads/images
IMAGE_BASE_URL=http://localhost:3000/images

# CDN Configuration (Cloudinary example)
CDN_ENABLED=true
CDN_PROVIDER=cloudinary
CDN_API_KEY=your_api_key
CDN_CLOUD_NAME=your_cloud_name
CDN_UPLOAD_PRESET=your_preset
\`\`\`

### Compression Settings

The module automatically determines optimal compression settings based on:
- Image dimensions (larger images get more compression)
- Format type (PNG with alpha channels get different treatment)
- File size (larger files get more aggressive compression)

You can override these with custom quality settings:

\`\`\`typescript
// Custom compression levels
enum CompressionLevel {
  LOW = 85,      // Light compression, high quality
  MEDIUM = 75,   // Balanced compression
  HIGH = 65,     // Aggressive compression
  MAXIMUM = 50,  // Maximum compression
}
\`\`\`

## API Endpoints

### POST /images/upload
Upload a single image.

**Parameters:**
- \`image\` (file): Image file to upload
- \`quality\` (query, optional): Compression quality (10-100)
- \`createVariants\` (query, optional): Generate thumbnails and variants
- \`uploadToCDN\` (query, optional): Upload to configured CDN

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "id": "uuid",
    "originalName": "photo.jpg",
    "filename": "photo_1234567890_abc123.jpg",
    "url": "http://localhost:3000/images/photo_1234567890_abc123.jpg",
    "cdnUrl": "https://res.cloudinary.com/...",
    "size": 1048576,
    "compressedSize": 524288,
    "compressionRatio": 50,
    "metadata": {
      "width": 1920,
      "height": 1080,
      "format": "jpeg",
      "hasAlpha": false
    },
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  }
}
\`\`\`

### POST /images/upload/batch
Upload multiple images.

**Parameters:**
- \`images\` (files): Array of image files
- \`quality\` (query, optional): Compression quality
- \`createVariants\` (query, optional): Generate variants
- \`uploadToCDN\` (query, optional): Upload to CDN
- \`maxConcurrent\` (query, optional): Max concurrent uploads (1-10)

### DELETE /images/:filename
Delete an uploaded image.

**Parameters:**
- \`filename\` (path): Image filename to delete
- \`publicId\` (query, optional): CDN public ID for deletion

### GET /images/config
Get upload configuration and limits.

**Response:**
\`\`\`json
{
  "maxFileSize": 2097152,
  "allowedFormats": ["jpg", "jpeg", "png", "webp"],
  "compressionQuality": 80,
  "maxWidth": 2048,
  "maxHeight": 2048,
  "enableWebP": true,
  "cdnEnabled": true
}
\`\`\`

### GET /images/stats
Get storage statistics.

**Response:**
\`\`\`json
{
  "totalFiles": 150,
  "totalSize": 52428800
}
\`\`\`

## Error Handling

The module provides detailed error responses for various scenarios:

### Invalid Format
\`\`\`json
{
  "success": false,
  "message": "Image upload failed",
  "error": {
    "code": "INVALID_FORMAT",
    "message": "Invalid image format 'gif'. Allowed formats: jpg, jpeg, png, webp"
  }
}
\`\`\`

### File Too Large
\`\`\`json
{
  "success": false,
  "message": "Image upload failed",
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size 3072KB exceeds maximum allowed size of 2048KB"
  }
}
\`\`\`

### Invalid Dimensions
\`\`\`json
{
  "success": false,
  "message": "Image upload failed",
  "error": {
    "code": "INVALID_DIMENSIONS",
    "message": "Image dimensions 4000x3000 exceed maximum allowed dimensions of 2048x2048"
  }
}
\`\`\`

## Image Variants

When \`createVariants=true\`, the module automatically generates:

- **Thumbnail**: 150x150px at 80% quality
- **Small**: 400x400px at 85% quality  
- **Medium**: 800x800px at 80% quality

Variants are named with the pattern: \`originalname_variantname.ext\`

Example: \`photo_1234567890_abc123_thumbnail.jpg\`

## CDN Integration

### Cloudinary Setup

1. Create a Cloudinary account
2. Get your API credentials
3. Create an upload preset
4. Configure environment variables:

\`\`\`env
CDN_ENABLED=true
CDN_PROVIDER=cloudinary
CDN_API_KEY=your_api_key
CDN_CLOUD_NAME=your_cloud_name
CDN_UPLOAD_PRESET=your_preset
\`\`\`

### Custom CDN Provider

To add support for other CDN providers, extend the \`CDNService\`:

\`\`\`typescript
// Add to CDNService
private async uploadToCustomCDN(buffer: Buffer, metadata: ImageMetadata): Promise<CDNUploadResult> {
  // Implement your CDN upload logic
  return {
    success: true,
    url: 'original_url',
    cdnUrl: 'cdn_url',
    publicId: 'public_id'
  };
}
\`\`\`

## Performance Optimization

### Compression Strategy

The module uses intelligent compression based on image characteristics:

1. **Large images (>2MP)**: More aggressive compression
2. **Medium images (0.5-2MP)**: Balanced compression
3. **Small images (<0.5MP)**: Light compression
4. **PNG with alpha**: Preserves transparency
5. **JPEG**: Uses progressive encoding and mozjpeg

### Memory Management

- Files are processed in memory using Sharp
- Batch uploads are processed with concurrency limits
- Large files are streamed to prevent memory issues
- Automatic cleanup of temporary buffers

### Caching Strategy

For production deployments, consider:

1. **CDN caching**: Automatic with Cloudinary
2. **Browser caching**: Set appropriate headers
3. **Server caching**: Cache processed variants
4. **Database indexing**: Index image metadata

## Security Considerations

1. **File validation**: Strict format and size checking
2. **Content verification**: Uses Sharp to verify actual image content
3. **Filename sanitization**: Prevents directory traversal
4. **Rate limiting**: Implement upload rate limits
5. **Authentication**: Add auth guards to upload endpoints

## Monitoring and Logging

The module provides comprehensive logging:

- Upload start/completion times
- Compression ratios achieved
- CDN upload status
- Error details and stack traces
- Storage usage statistics

Example log output:
\`\`\`
[ImageUploadService] Starting image upload process: photo.jpg (ID: uuid)
[ImageValidationService] Image validated: photo.jpg (1920x1080, 1024KB)
[ImageCompressionService] Image compressed: photo.jpg - 50% reduction (1024KB → 512KB)
[CDNService] Successfully uploaded to Cloudinary: photo_uuid
[ImageUploadService] Image upload completed: photo.jpg in 1250ms
\`\`\`

## Testing

### Unit Tests

\`\`\`typescript
describe('ImageUploadService', () => {
  it('should compress image without quality loss', async () => {
    const result = await service.uploadImage(mockBuffer, 'test.jpg', { quality: 80 });
    expect(result.success).toBe(true);
    expect(result.data.compressionRatio).toBeGreaterThan(0);
  });

  it('should reject invalid formats', async () => {
    const result = await service.uploadImage(mockGifBuffer, 'test.gif');
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('INVALID_FORMAT');
  });
});
\`\`\`

### Integration Tests

\`\`\`typescript
describe('ImageUploadController', () => {
  it('should upload image via API', async () => {
    const response = await request(app)
      .post('/images/upload')
      .attach('image', 'test/fixtures/photo.jpg')
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.url).toBeDefined();
  });
});
\`\`\`

This module provides a production-ready solution for image upload optimization with comprehensive error handling, performance optimization, and extensibility for various CDN providers.
