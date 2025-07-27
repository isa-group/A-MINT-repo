import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { SessionFile } from '../interfaces/chat.types';
import * as yaml from 'js-yaml';

export class FileManager {
    private uploadsDir: string;

    constructor() {
        this.uploadsDir = config.uploadsDir;
        this.ensureUploadsDir();
    }

    /**
     * Ensure uploads directory exists
     */
    private ensureUploadsDir(): void {
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
            console.log(`📁 Created uploads directory: ${this.uploadsDir}`);
        }
    }

    /**
     * Save uploaded file with unique name
     */
    saveUploadedFile(file: Express.Multer.File): SessionFile {
        console.log('📄 Procesando archivo subido:', file);
        
        const fileId = uuidv4();
        
        // Verificar que el archivo subido por multer existe
        if (!file.path || !fs.existsSync(file.path)) {
            console.error('❌ Error: Archivo no encontrado en la ruta:', file.path);
            throw new Error('Archivo no encontrado o no fue guardado correctamente por multer');
        }
        
        // Obtener información del archivo ya guardado por multer
        const stats = fs.statSync(file.path);
        console.log('📊 Estadísticas del archivo:', { 
            exists: fs.existsSync(file.path),
            size: stats.size,
            isFile: stats.isFile()
        });
        
        // El archivo ya está guardado por multer, así que simplemente lo devolvemos
        const fileInfo: SessionFile = {
            id: fileId,
            fileId: fileId, // For compatibility
            originalName: file.originalname,
            filename: path.basename(file.path), // Usamos el nombre generado por multer
            path: file.path, // Usamos la ruta donde multer guardó el archivo
            size: file.size || stats.size, // Usamos el tamaño de multer o stats si no está disponible
            uploadedAt: new Date(),
            status: 'uploaded'
        };

        console.log(`💾 Archivo guardado: ${file.originalname} como ${path.basename(file.path)} (${fileInfo.size} bytes)`);
        
        return fileInfo;
    }

    /**
     * Save transformation result as YAML file
     */
    saveTransformationResult(taskId: string, yamlContent: string, originalUrl: string): SessionFile {
        const fileId = uuidv4();
        const fileName = `transformation_${taskId}_${fileId}.yaml`;
        const filePath = path.join(this.uploadsDir, fileName);

        // Write YAML content to disk
        fs.writeFileSync(filePath, yamlContent, 'utf8');

        const fileInfo: SessionFile = {
            id: fileId,
            fileId: fileId, // For compatibility
            originalName: `pricing_from_${new URL(originalUrl).hostname}.yaml`,
            filename: fileName,
            path: filePath,
            size: Buffer.byteLength(yamlContent, 'utf8'),
            uploadedAt: new Date(),
            status: 'uploaded'
        };

        console.log(`💾 Saved transformation result: ${fileName} (${fileInfo.size} bytes)`);
        
        return fileInfo;
    }

    /**
     * Get file path by fileId
     */
    getFilePath(fileId: string, originalName: string): string | null {
        const fileExtension = path.extname(originalName);
        const fileName = `${fileId}${fileExtension}`;
        const filePath = path.join(this.uploadsDir, fileName);

        if (fs.existsSync(filePath)) {
            return filePath;
        }

        // Also check for transformation files
        const transformFiles = fs.readdirSync(this.uploadsDir)
            .filter(f => f.includes(fileId));
        
        if (transformFiles.length > 0) {
            return path.join(this.uploadsDir, transformFiles[0]);
        }

        return null;
    }

    /**
     * Validate YAML file content
     */
    validateYamlFile(filePath: string): { isValid: boolean; error?: string } {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Basic YAML validation using js-yaml
            const yaml = require('js-yaml');
            const parsed = yaml.load(content);
            
            // Basic structure validation for pricing YAML
            if (typeof parsed !== 'object' || !parsed) {
                return { isValid: false, error: 'Invalid YAML structure' };
            }

            // Check for required fields
            const requiredFields = ['saasName', 'plans'];
            for (const field of requiredFields) {
                if (!(field in parsed)) {
                    return { isValid: false, error: `Missing required field: ${field}` };
                }
            }

            console.log(`✅ YAML file validated successfully: ${path.basename(filePath)}`);
            return { isValid: true };
        } catch (error: any) {
            console.error(`❌ YAML validation failed for ${path.basename(filePath)}:`, error.message);
            return { isValid: false, error: error.message };
        }
    }

    /**
     * Delete a file from the file system
     */
    async deleteFile(filePath: string): Promise<void> {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ File deleted: ${path.basename(filePath)}`);
            }
        } catch (error) {
            console.error(`❌ Error deleting file ${path.basename(filePath)}:`, error);
            throw new Error(`Failed to delete file: ${error}`);
        }
    }

    /**
     * Clean up old files (older than specified hours)
     */
    cleanupOldFiles(olderThanHours: number = 24): void {
        try {
            const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
            const files = fs.readdirSync(this.uploadsDir);
            
            let deletedCount = 0;
            for (const file of files) {
                const filePath = path.join(this.uploadsDir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime < cutoffTime) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                }
            }
            
            if (deletedCount > 0) {
                console.log(`🧹 Cleaned up ${deletedCount} old files`);
            }
        } catch (error) {
            console.error('Error during file cleanup:', error);
        }
    }

    /**
     * Get all transformation files
     */
    getTransformationFiles(): SessionFile[] {
        try {
            const files = fs.readdirSync(this.uploadsDir);
            const transformationFiles: SessionFile[] = [];
            
            for (const file of files) {
                if (file.startsWith('transformation_')) {
                    const filePath = path.join(this.uploadsDir, file);
                    const stats = fs.statSync(filePath);
                    
                    // Parse the filename to extract information
                    const nameParts = file.split('_');
                    const taskId = nameParts[1] || 'unknown';
                    const fileId = nameParts[2] ? nameParts[2].replace('.yaml', '') : 'unknown';
                    
                    transformationFiles.push({
                        id: fileId,
                        fileId: fileId,
                        originalName: file,
                        filename: file,
                        path: filePath,
                        size: stats.size,
                        uploadedAt: stats.mtime,
                        status: 'uploaded'
                    });
                }
            }
            
            return transformationFiles.sort((a, b) => 
                new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
            );
        } catch (error: any) {
            console.error('Error getting transformation files:', error.message);
            return [];
        }
    }

    /**
     * Get file info without full path (for security)
     */
    getFileInfo(fileId: string, originalName: string): { exists: boolean; size?: number; type?: string } {
        const filePath = this.getFilePath(fileId, originalName);
        
        if (!filePath || !fs.existsSync(filePath)) {
            return { exists: false };
        }

        const stats = fs.statSync(filePath);
        return {
            exists: true,
            size: stats.size,
            type: path.extname(filePath) === '.yaml' ? 'application/x-yaml' : 'application/octet-stream'
        };
    }

    /**
     * Read and parse YAML file content
     */
    readYamlFile(filePath: string): any {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return yaml.load(content);
        } catch (error: any) {
            console.error(`❌ Failed to read YAML file ${path.basename(filePath)}:`, error.message);
            throw new Error(`Failed to read YAML file: ${error.message}`);
        }
    }
}

export const fileManager = new FileManager();
