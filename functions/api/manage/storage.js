import { Client as MinioClient } from "minio";

// Initialize MinIO client
let minio;

function initMinio(env) {
    if (minio) return;
    minio = new MinioClient({
        endPoint: "77.236.222.115",
        port: 9000,
        useSSL: false,
        accessKey: env.MINIO_USER,
        secretKey: env.MINIO_PASSWORD,
    });
}

// Helper to list objects (directory-aware)
async function listObjects(bucketName, prefix = "") {
    const objects = [];
    const stream = minio.listObjectsV2(bucketName, prefix, true);

    return new Promise((resolve, reject) => {
        stream.on("data", obj => objects.push(obj));
        stream.on("error", err => reject(err));
        stream.on("end", () => resolve(objects));
    });
}

// Helper to get object content as string
async function getObjectContent(bucketName, objectName) {
    return new Promise((resolve, reject) => {
        minio.getObject(bucketName, objectName, (err, dataStream) => {
            if (err) return reject(err);
            const chunks = [];
            dataStream.on("data", chunk => chunks.push(chunk));
            dataStream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
            dataStream.on("error", e => reject(e));
        });
    });
}

// Helper to get object content type
async function getObjectType(bucketName, objectName) {
    return new Promise((resolve, reject) => {
        minio.statObject(bucketName, objectName, (err, stat) => {
            if (err) return reject(err);
            resolve(stat.metaData["content-type"] || "application/octet-stream");
        });
    });
}

// Helper to upload object
async function uploadObject(bucketName, objectName, data, contentType = "application/octet-stream") {
    return minio.putObject(bucketName, objectName, data, { "Content-Type": contentType });
}

// Helper to delete object
async function deleteObject(bucketName, objectName) {
    return minio.removeObject(bucketName, objectName);
}

// Worker handler
export async function onRequest(context) {
    const { request, env } = context;
    initMinio(env);

    const contentTypeHeader = request.headers.get("content-type") || "";
    let body = {};
    let fileRef = null;

    if (contentTypeHeader.includes("application/json")) {
        body = await request.json();
    } else if (contentTypeHeader.includes("multipart/form-data")) {
        const formData = await request.formData();
        body = {};
        for (const [key, value] of formData.entries()) {
            if (key === "file" && value && typeof value === "object") fileRef = value;
            else body[key] = value;
        }
    }

    const { action, userId, token } = body;
    if (!action || !userId || !token) {
        return new Response(JSON.stringify({ success: false, message: "Missing required parameters" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    // Verify user authentication
    const user = await env.DB.prepare("SELECT id, role FROM users WHERE id = ?1 AND token = ?2 LIMIT 1").bind(parseInt(userId), token).first();
    if (!user) return new Response(JSON.stringify({ success: false, message: "Invalid authentication" }), { status: 401, headers: { "Content-Type": "application/json" } });
    if (!["admin", "root"].includes(user.role)) return new Response(JSON.stringify({ success: false, message: "Unauthorized. Admin or root access required." }), { status: 403, headers: { "Content-Type": "application/json" } });

    try {
        if (action === "browse") {
            const { bucketName, prefix = "" } = body;
            if (!bucketName) throw new Error("Missing bucketName");

            const objects = await listObjects(bucketName, prefix);
            const folders = [];
            const files = [];

            objects.forEach(obj => {
                if (obj.prefix) {
                    folders.push({ name: obj.prefix.replace(prefix, "").replace(/\/$/, ""), prefix: obj.prefix });
                } else {
                    files.push({
                        key: obj.name,
                        name: prefix ? obj.name.substring(prefix.length) : obj.name,
                        size: obj.size,
                        lastModified: obj.lastModified
                    });
                }
            });

            return new Response(JSON.stringify({ success: true, prefix, folders, files }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        else if (action === "getFileContent") {
            const { bucketName, key } = body;
            if (!bucketName || !key) throw new Error("Missing required parameters");
            const content = await getObjectContent(bucketName, key);
            return new Response(JSON.stringify({ success: true, content }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        else if (action === "getFileType") {
            const { bucketName, key } = body;
            if (!bucketName || !key) throw new Error("Missing required parameters");
            const type = await getObjectType(bucketName, key);
            return new Response(JSON.stringify({ success: true, type }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        else if (action === "uploadFile") {
            const { bucketName, key, prefix = "" } = body;
            if (!bucketName || !fileRef) throw new Error("Missing required parameters or file");

            const arrayBuffer = await fileRef.arrayBuffer();
            const data = Buffer.from(arrayBuffer);
            const fileName = key || (prefix ? `${prefix.replace(/^\/+/, "")}/${fileRef.name}` : fileRef.name);
            await uploadObject(bucketName, fileName, data, fileRef.type || "application/octet-stream");

            return new Response(JSON.stringify({ success: true, message: "File uploaded successfully", key: fileName }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        else if (action === "deleteFile") {
            const { bucketName, key } = body;
            if (!bucketName || !key) throw new Error("Missing required parameters");
            await deleteObject(bucketName, key);
            return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        else if (action === "downloadFile") {
            const { bucketName, key } = body;
            if (!bucketName || !key) throw new Error("Missing required parameters");

            const data = await getObjectContent(bucketName, key);
            const filename = key.split("/").pop();
            const headers = new Headers();
            headers.set("Content-Type", "application/octet-stream");
            headers.set("Content-Disposition", `attachment; filename="${filename}"`);

            return new Response(data, { status: 200, headers });
        }
        else {
            return new Response(JSON.stringify({ success: false, message: "Unknown action" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
    } catch (err) {
        console.error("Error:", err);
        return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}
