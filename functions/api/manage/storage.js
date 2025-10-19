import { S3Client, ListObjectsV2Command, GetObjectCommand, HeadObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { DOMParser as XmldomDOMParser } from "@xmldom/xmldom";

if (typeof globalThis.DOMParser === "undefined") {
    globalThis.DOMParser = XmldomDOMParser;
}

// Ensure DOMParser.parseFromString always returns a valid document
try {
    const OriginalDOMParser = globalThis.DOMParser;

    class SafeDOMParser {
        parseFromString(str, type) {
            try {
                // Ensure we have a valid string
                const xmlString = String(str ?? '').trim();

                // If empty, return error document
                if (!xmlString) {
                    const errorParser = new OriginalDOMParser();
                    return errorParser.parseFromString('<parsererror/>', 'application/xml');
                }

                // Parse the XML
                const parser = new OriginalDOMParser();
                const doc = parser.parseFromString(xmlString, type || 'application/xml');

                // Validate the document has a proper structure
                if (!doc || !doc.documentElement || !doc.documentElement.nodeName) {
                    const errorParser = new OriginalDOMParser();
                    return errorParser.parseFromString('<parsererror/>', 'application/xml');
                }

                // Check for parser errors
                const parserError = doc.getElementsByTagName('parsererror');
                if (parserError && parserError.length > 0) {
                    console.error('XML Parse Error:', xmlString.substring(0, 200));
                }

                return doc;
            } catch (e) {
                console.error('DOMParser error:', e, 'Input:', String(str ?? '').substring(0, 200));
                const errorParser = new OriginalDOMParser();
                return errorParser.parseFromString('<parsererror/>', 'application/xml');
            }
        }
    }

    globalThis.DOMParser = SafeDOMParser;
} catch (e) {
    console.error('Failed to setup SafeDOMParser:', e);
}

let s3;

async function init(env) {
    s3 = new S3Client({
        region: "us-east-1", // MinIO to ignoruje, ale SDK to chce
        endpoint: "http://77.236.222.115:9000", // adresa tvého MinIO serveru
        forcePathStyle: true, // nutné pro MinIO (jinak hledá subdomény)
        credentials: {
            accessKeyId: env.MINIO_USER,   // nastav si svoje
            secretAccessKey: env.MINIO_PASSWORD,
        },
    });
    // Add this after creating the S3Client
    s3.middlewareStack.add(
        (next) => async (args) => {
            const result = await next(args);
            if (result.response?.body) {
                console.log('S3 Response:', result.response);
            }
            return result;
        },
        { step: 'deserialize', priority: 'low' }
    );
}
async function getFileContent(bucketName, key, env) {
    if (!s3) await init(env);
    const response = await s3.send(
        new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
        })
    );

    const chunks = [];
    for await (const chunk of response.Body) chunks.push(chunk);
    return Buffer.concat(chunks).toString("utf-8");
}

async function getFileType(bucketName, key, env) {
    if (!s3) await init(env);
    const response = await s3.send(
        new HeadObjectCommand({
            Bucket: bucketName,
            Key: key,
        })
    );
    return response.ContentType || "unknown";
}

/**
 * Nahraje soubor do bucketu.
 * @param {string} bucketName - Název bucketu
 * @param {string} fileName - Název (key) souboru v bucketu
 * @param {Buffer|string|Uint8Array|ReadableStream} fileData - Data k nahrání
 * @param {string} [contentType] - Volitelný MIME typ
 */
export async function uploadFileToBucket(bucketName, fileName, fileData, contentType = "application/octet-stream", env) {
    if (!s3) await init(env);
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: fileData,
        ContentType: contentType,
    });

    await s3.send(command);
}

export async function onRequest(context) {
    const { request, env } = context;

    const contentType = request.headers.get('content-type') || '';
    let body = {};
    let uploadFileRef = null;

    if (contentType.includes('application/json')) {
        body = await request.json();
    } else if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        // Extract non-file fields to body and keep file separately
        body = {};
        for (const [key, value] of formData.entries()) {
            if (key === 'file' && value && typeof value === 'object') {
                uploadFileRef = value;
            } else {
                body[key] = value;
            }
        }
    }

    const action = body.action;
    const userId = body.userId;
    const token = body.token;

    if (!userId || !token || !action) {
        return new Response(JSON.stringify({
            success: false,
            message: 'Missing required parameters'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Verify user authentication
    const user = await env.DB.prepare(`
                SELECT id, role FROM users WHERE id = ?1 AND token = ?2 LIMIT 1
            `).bind(parseInt(userId), token).first();

    if (!user) {
        return new Response(JSON.stringify({
            success: false,
            message: 'Invalid authentication'
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Check if user is admin or root
    if (user.role !== 'admin' && user.role !== 'root') {
        return new Response(JSON.stringify({
            success: false,
            message: 'Unauthorized. Admin or root access required.'
        }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Directory-aware list using prefix and delimiter
    if (action === 'browse') {
        const bucketName = body.bucketName;
        const prefix = body.prefix || '';
        if (!bucketName) {
            return new Response(JSON.stringify({ success: false, message: 'Missing bucketName' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        try {
            if (!s3) await init(env);
            const cmd = new ListObjectsV2Command({ Bucket: bucketName, Prefix: prefix, Delimiter: '/' });
            const resp = await s3.send(cmd);
            const folders = (resp.CommonPrefixes || []).map(p => ({ name: p.Prefix.replace(prefix, '').replace(/\/$/, ''), prefix: p.Prefix }));
            const files = (resp.Contents || [])
                .filter(o => o.Key !== prefix)
                .map(o => ({
                    key: o.Key,
                    name: prefix ? o.Key.substring(prefix.length) : o.Key,
                    size: o.Size,
                    lastModified: o.LastModified
                }));
            return new Response(JSON.stringify({ success: true, prefix, folders, files }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } catch (error) {
            console.error('Error browsing:', error);
            return new Response(JSON.stringify({ success: false, message: 'An error occurred while browsing' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    }
    else if (action === 'getFileType') {
        const bucketName = body.bucketName;
        const key = body.key;
        if (!bucketName || !key) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Missing required parameters'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        try {
            const type = await getFileType(bucketName, key, env);
            return new Response(JSON.stringify({
                success: true,
                type: type
            }), {
                status: 200,
            }
            )
        }
        catch (error) {
            console.error('Error getting file type:', error);
            return new Response(JSON.stringify({
                success: false,
                message: 'An error occurred while getting file type'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
    else if (action === 'getFileContent') {
        const bucketName = body.bucketName;
        const key = body.key;
        if (!bucketName || !key) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Missing required parameters'
            }), {
                status: 400,
            }
            )
        }

        try {
            const content = await getFileContent(bucketName, key, env);
            return new Response(JSON.stringify({
                success: true,
                content: content
            }), {
                status: 200,
            }
            )
        }
        catch (error) {
            console.error('Error getting file content:', error);
            return new Response(JSON.stringify({
                success: false,
                message: 'An error occurred while getting file content'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
    else if (action === 'downloadFile') {
        const bucketName = body.bucketName;
        const key = body.key;
        if (!bucketName || !key) {
            return new Response(JSON.stringify({ success: false, message: 'Missing required parameters' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        try {
            if (!s3) await init(env);
            const getResp = await s3.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
            const filename = key.split('/').pop();
            const headers = new Headers();
            headers.set('Content-Type', getResp.ContentType || 'application/octet-stream');
            headers.set('Content-Disposition', `attachment; filename="${filename}"`);
            return new Response(getResp.Body, { status: 200, headers });
        } catch (error) {
            console.error('Error downloading file:', error);
            return new Response(JSON.stringify({ success: false, message: 'An error occurred while downloading file' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    }
    else if (action === 'deleteFile') {
        const bucketName = body.bucketName;
        const key = body.key;
        if (!bucketName || !key) {
            return new Response(JSON.stringify({ success: false, message: 'Missing required parameters' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        try {
            if (!s3) await init(env);
            await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
            return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } catch (error) {
            console.error('Error deleting file:', error);
            return new Response(JSON.stringify({ success: false, message: 'An error occurred while deleting file' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    }
    else if (action === 'uploadFile') {
        const bucketName = body.bucketName;
        const targetPrefix = (body.prefix || '').replace(/^\/+/, '');

        if (!bucketName) {
            return new Response(JSON.stringify({ success: false, message: 'Missing bucketName' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        const file = uploadFileRef; // from multipart form-data
        if (!file) {
            return new Response(JSON.stringify({
                success: false,
                message: 'File not found in form data'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        const fileName = body.key || (targetPrefix ? `${targetPrefix}${targetPrefix.endsWith('/') ? '' : '/'}${file.name}` : file.name);
        const fileType = file.type;

        const arrayBuffer = await file.arrayBuffer();
        const fileData = Buffer.from(arrayBuffer);
        const ct = fileType || "application/octet-stream";
        try {
            await uploadFileToBucket(bucketName, fileName, fileData, ct, env);
            return new Response(JSON.stringify({
                success: true,
                message: 'File uploaded successfully',
                key: fileName
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        catch (error) {
            console.error('Error uploading file:', error);
            return new Response(JSON.stringify({
                success: false,
                message: 'An error occurred while uploading file'
            }), {
                status: 500,
            }
            )
        }
    }
    else {
        return new Response(JSON.stringify({ success: false, message: 'Unknown action' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
}